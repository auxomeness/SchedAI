"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";
import { AlertCircle, CalendarCheck2, Download, Eye, Facebook, FileDown, Github, Instagram, Linkedin, Lock, Moon, Plus, RefreshCw, RotateCcw, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomAurora } from "@/components/bottom-aurora";
import { EmptyState } from "@/components/empty-state";
import { ManualSubjectForm } from "@/components/manual-subject-form";
import { PreferencesPanel } from "@/components/preferences-panel";
import { ScheduleTimetable } from "@/components/schedule-timetable";
import { SubjectPicker } from "@/components/subject-picker";
import { UploadPanel } from "@/components/upload-panel";
import { Card, CardContent } from "@/components/ui/card";
import type { ClassSection, GeneratedSchedule, NoSolutionReason, ParseResult, SchedulePreferences, SelectedSectionIds, SubjectOption } from "@/types/schedule";
import { buildParseResult } from "@/lib/parsers/normalize";
import { explainFailure } from "@/lib/scheduler/explain-failure";
import { generateSchedules } from "@/lib/scheduler/generate-schedules";
import { clearStoredSession, loadStoredPreferences, loadStoredSession, loadStoredTheme, saveStoredSession, saveStoredTheme } from "@/lib/storage";

const DEFAULT_PREFERENCES: SchedulePreferences = {
  noFriday: false,
  blockedDays: [],
  protectBreak: false,
  breaks: [],
  preferCompact: true
};
const APP_VERSION = "0.2.5";

interface ExportResult {
  format: "png" | "pdf";
  fileName: string;
  url: string;
}

export function AppShell() {
  const timetableRef = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<ClassSection[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [preferredSections, setPreferredSections] = useState<Record<string, string | undefined>>({});
  const [selectedSectionIds, setSelectedSectionIds] = useState<SelectedSectionIds>({});
  const [preferences, setPreferences] = useState<SchedulePreferences>(DEFAULT_PREFERENCES);
  const [schedules, setSchedules] = useState<GeneratedSchedule[]>([]);
  const [frozenSchedules, setFrozenSchedules] = useState<GeneratedSchedule[]>([]);
  const [scheduleIndex, setScheduleIndex] = useState(0);
  const [reasons, setReasons] = useState<NoSolutionReason[]>([]);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState<string>();
  const [isParsing, setIsParsing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isDownloadMenuOpen, setIsDownloadMenuOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [exportResult, setExportResult] = useState<ExportResult>();
  const [hasRestoredSession, setHasRestoredSession] = useState(false);

  useEffect(() => {
    const storedSession = loadStoredSession();
    if (storedSession) {
      setSections(storedSession.sections);
      setSubjects(buildParseResult(storedSession.sections).subjects);
      setSelectedSubjects(storedSession.selectedSubjects);
      setPreferredSections(storedSession.preferredSections);
      setSelectedSectionIds(storedSession.selectedSectionIds ?? buildSelectedSectionIdsFromPreferred(storedSession.sections, storedSession.selectedSubjects, storedSession.preferredSections));
      setPreferences(normalizePreferences(storedSession.preferences));
      setSchedules(storedSession.schedules);
      setFrozenSchedules(storedSession.frozenSchedules);
      setScheduleIndex(storedSession.scheduleIndex);
      setFileName(storedSession.fileName);
      setIsDarkMode(loadStoredTheme() ?? storedSession.isDarkMode);
      setHasRestoredSession(true);
      return;
    }

    const storedPreferences = loadStoredPreferences();
    if (storedPreferences) setPreferences(normalizePreferences(storedPreferences));
    setIsDarkMode(loadStoredTheme() ?? false);
    setHasRestoredSession(true);
  }, []);

  useLayoutEffect(() => {
    if (!hasRestoredSession) return;
    saveStoredSession({
      sections,
      selectedSubjects,
      preferredSections,
      selectedSectionIds,
      preferences,
      schedules,
      frozenSchedules,
      scheduleIndex,
      fileName,
      isDarkMode
    });
  }, [fileName, frozenSchedules, hasRestoredSession, isDarkMode, preferences, preferredSections, scheduleIndex, schedules, sections, selectedSectionIds, selectedSubjects]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    saveStoredTheme(isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    return () => {
      if (exportResult) URL.revokeObjectURL(exportResult.url);
    };
  }, [exportResult]);

  const currentSchedule = schedules[scheduleIndex];
  const frozenSections = useMemo(() => frozenSchedules.flatMap((schedule) => schedule.sections), [frozenSchedules]);
  const canGenerate = sections.length > 0 && selectedSubjects.length > 0 && !isParsing;
  const displaySchedule = currentSchedule ?? (frozenSchedules.length ? { sections: [], score: 0, warnings: [] } : undefined);

  const selectedSummary = useMemo(() => {
    if (!selectedSubjects.length) return "No subjects selected.";
    return `${selectedSubjects.length} subject${selectedSubjects.length === 1 ? "" : "s"} selected.`;
  }, [selectedSubjects.length]);

  function handleParsed(result: ParseResult, loadedFileName: string) {
    setSections(result.sections);
    setSubjects(result.subjects);
    setSelectedSubjects([]);
    setPreferredSections({});
    setSelectedSectionIds({});
    setSchedules([]);
    setScheduleIndex(0);
    setReasons([]);
    setError("");
    setFileName(loadedFileName);
  }

  function handleRemoveFile() {
    const manualSections = sections.filter((section) => section.id.startsWith("manual-"));
    const result = buildParseResult(manualSections);
    const availableCodes = new Set(result.subjects.map((subject) => subject.code));
    const availableSectionIds = new Set(manualSections.map((section) => section.id));
    setSections(result.sections);
    setSubjects(result.subjects);
    setSelectedSubjects((existing) => existing.filter((code) => availableCodes.has(code)));
    setPreferredSections((existing) =>
      Object.fromEntries(Object.entries(existing).filter(([code]) => availableCodes.has(code)))
    );
    setSelectedSectionIds((existing) =>
      Object.fromEntries(
        Object.entries(existing)
          .map(([code, ids]) => [code, ids.filter((id) => availableSectionIds.has(id))] as const)
          .filter(([code, ids]) => availableCodes.has(code) && ids.length > 0)
      )
    );
    setSchedules([]);
    setFrozenSchedules([]);
    setScheduleIndex(0);
    setReasons([]);
    setError("");
    setFileName(undefined);
  }

  function handleManualAdd(section: ClassSection) {
    const nextSections = [...sections, section];
    const result = buildParseResult(nextSections);
    setSections(result.sections);
    setSubjects(result.subjects);
    setSelectedSubjects((existing) => Array.from(new Set([...existing, section.subjectCode])).sort());
    setSelectedSectionIds((existing) => ({
      ...existing,
      [section.subjectCode]: Array.from(new Set([...(existing[section.subjectCode] ?? []), section.id]))
    }));
    setSchedules([]);
    setScheduleIndex(0);
    setReasons([]);
    setError("");
  }

  function handleGenerate() {
    const nextSchedules = generateSchedules(sections, selectedSubjects, preferences, preferredSections, frozenSections, selectedSectionIds);
    setSchedules(nextSchedules);
    setScheduleIndex(0);
    setReasons(nextSchedules.length ? [] : explainFailure(sections, selectedSubjects, preferences));
  }

  function handleGenerateAnother() {
    if (schedules.length <= 1) return;
    setScheduleIndex((current) => (current + 1) % schedules.length);
  }

  function handleMarkComplete() {
    if (!currentSchedule) return;
    setFrozenSchedules((existing) => [...existing, currentSchedule]);
  }

  function handleNewSchedule() {
    setSelectedSubjects([]);
    setPreferredSections({});
    setSelectedSectionIds({});
    setSchedules([]);
    setScheduleIndex(0);
    setReasons([]);
  }

  function handleResetSession() {
    clearStoredSession();
    setSections([]);
    setSubjects([]);
    setSelectedSubjects([]);
    setPreferredSections({});
    setSelectedSectionIds({});
    setPreferences(DEFAULT_PREFERENCES);
    setSchedules([]);
    setFrozenSchedules([]);
    setScheduleIndex(0);
    setReasons([]);
    setError("");
    setFileName(undefined);
    setIsParsing(false);
    setIsDarkMode(false);
    setIsDownloadMenuOpen(false);
    setIsPreviewOpen(false);
    setExportResult(undefined);
  }

  async function handleExport(format: "png" | "pdf") {
    if (!timetableRef.current || isExporting) return;
    setIsDownloadMenuOpen(false);
    setIsExporting(true);
    try {
      const dataUrl = await toPng(timetableRef.current, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: isDarkMode ? "#000000" : "#ffffff"
      });

      if (format === "png") {
        const blob = dataUrlToBlob(dataUrl);
        showExportResult({
          format,
          fileName: "schedai-schedule.png",
          url: URL.createObjectURL(blob)
        });
        return;
      }

      const image = await loadImage(dataUrl);
      const pdf = new jsPDF({
        orientation: image.width >= image.height ? "landscape" : "portrait",
        unit: "px",
        format: [image.width, image.height]
      });
      pdf.addImage(dataUrl, "PNG", 0, 0, image.width, image.height);
      showExportResult({
        format,
        fileName: "schedai-schedule.pdf",
        url: URL.createObjectURL(pdf.output("blob"))
      });
    } catch (error) {
      setError(error instanceof Error ? `Export failed: ${error.message}` : "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  function showExportResult(nextResult: ExportResult) {
    setExportResult((existing) => {
      if (existing) URL.revokeObjectURL(existing.url);
      return nextResult;
    });
  }

  function closeExportResult() {
    setExportResult((existing) => {
      if (existing) URL.revokeObjectURL(existing.url);
      return undefined;
    });
  }

  return (
    <main className="schedai-root flex min-h-screen w-full max-w-none flex-col gap-8 overflow-x-hidden px-3 py-5 sm:px-6 lg:px-8">
      <header className="sticky top-4 z-20 mx-auto flex h-auto w-full max-w-7xl flex-col gap-3 rounded-[24px] border border-white/50 bg-white/30 px-4 py-4 shadow-[inset_0_1px_rgba(255,255,255,0.65),0_18px_52px_rgba(31,38,46,0.06)] backdrop-blur-2xl dark:border-white/10 dark:bg-black/50 sm:h-[62px] sm:flex-row sm:items-center sm:justify-between sm:gap-0 sm:px-5 sm:py-2">
        <a href="#" className="inline-flex items-baseline gap-1 text-xl font-extrabold tracking-tight">
          <span>SchedAI</span>
          <span className="font-normal text-muted-foreground">by Arxeni</span>
        </a>
        <div className="hidden text-sm font-semibold text-muted-foreground sm:block">Workspace</div>
        <div className="grid w-full grid-cols-2 items-center gap-2 sm:flex sm:w-auto sm:flex-wrap">
          <Button className="min-w-0" variant="secondary" onClick={() => setIsDarkMode((value) => !value)}>
            {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            {isDarkMode ? "Light" : "Dark"}
          </Button>
          <Button className="min-w-0" disabled={!canGenerate} onClick={handleGenerate}>
            <CalendarCheck2 className="h-4 w-4" />
            Generate
          </Button>
        </div>
      </header>

      <div className="relative z-10 grid w-full min-w-0 gap-6 lg:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
        <section className="min-w-0 space-y-5">
          <div className="space-y-3 rounded-2xl border bg-white/70 p-3 shadow-sm dark:bg-[#050505]/90">
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
              <div className="rounded-xl border bg-white/70 px-3 py-2 text-sm text-muted-foreground dark:bg-[#050505]/90">
                {selectedSummary}
              </div>
              {frozenSchedules.length > 0 ? (
                <div className="rounded-xl border bg-white/70 px-3 py-2 text-sm text-muted-foreground dark:bg-[#050505]/90">
                  {frozenSchedules.length} completed
                </div>
              ) : null}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button className="min-w-0" variant="outline" disabled={!currentSchedule} onClick={handleMarkComplete}>
                <Lock className="h-4 w-4" />
                <span className="min-w-0 truncate">Complete</span>
              </Button>
              <Button className="min-w-0" variant="outline" disabled={frozenSchedules.length === 0} onClick={handleNewSchedule}>
                <Plus className="h-4 w-4" />
                <span className="min-w-0 truncate">New</span>
              </Button>
              <Button className="min-w-0" variant="outline" disabled={!displaySchedule || isExporting} onClick={() => setIsDownloadMenuOpen(true)}>
                <Download className="h-4 w-4" />
                <span className="min-w-0 truncate">Download</span>
              </Button>
              <Button className="min-w-0" variant="outline" onClick={handleResetSession}>
                <RotateCcw className="h-4 w-4" />
                <span className="min-w-0 truncate">Reset Session</span>
              </Button>
              <Button className="col-span-2 min-w-0" variant="outline" disabled={schedules.length <= 1} onClick={handleGenerateAnother}>
                <RefreshCw className="h-4 w-4" />
                <span className="min-w-0 truncate">Generate New</span>
              </Button>
            </div>
          </div>
          <UploadPanel
            fileName={fileName}
            isParsing={isParsing}
            onError={setError}
            onParsed={handleParsed}
            onParsingChange={setIsParsing}
            onRemove={handleRemoveFile}
          />
          <ManualSubjectForm onAdd={handleManualAdd} />
          <SubjectPicker
            sections={sections}
            subjects={subjects}
            selectedSubjects={selectedSubjects}
            selectedSectionIds={selectedSectionIds}
            onChange={setSelectedSubjects}
            onSelectedSectionIdsChange={setSelectedSectionIds}
          />
          <PreferencesPanel preferences={preferences} onChange={setPreferences} />
          <div className="grid gap-3">
            <Button size="lg" disabled={!canGenerate} onClick={handleGenerate}>
              <CalendarCheck2 className="h-4 w-4" />
              Generate Schedule
            </Button>
            {schedules.length > 0 ? (
              <p className="text-center text-xs text-muted-foreground">
                Showing option {scheduleIndex + 1} of {schedules.length}.
              </p>
            ) : null}
          </div>
        </section>

        <section className="min-w-0 space-y-5">
          {error ? <FeedbackCard title="File could not be read" items={[{ message: error, suggestion: "Try a text-based PDF, CSV, or Excel file with subject, day, and time columns." }]} /> : null}
          {reasons.length > 0 ? <FeedbackCard title="Unable to generate a schedule" items={reasons} /> : null}
          {displaySchedule ? (
            <div className="space-y-3">
              <ScheduleTimetable ref={timetableRef} schedule={displaySchedule} frozenSchedules={frozenSchedules} />
              <div className="flex justify-end">
                <Button type="button" variant="outline" onClick={() => setIsPreviewOpen(true)}>
                  <Eye className="h-4 w-4" />
                  Preview
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState />
          )}
        </section>
      </div>
      {isDownloadMenuOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-lg">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-base font-semibold">Download schedule</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Choose the file format to export.</p>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={() => setIsDownloadMenuOpen(false)} aria-label="Close download options">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={isExporting} onClick={() => handleExport("png")}>
                  <Download className="h-4 w-4" />
                  PNG
                </Button>
                <Button variant="outline" disabled={isExporting} onClick={() => handleExport("pdf")}>
                  <FileDown className="h-4 w-4" />
                  PDF
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {exportResult ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-lg">
          <Card className="w-full max-w-sm shadow-2xl">
            <CardContent className="space-y-4 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-base font-semibold">Export ready</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Open the file first on iPhone, then use Share or Save to Files if download does not start.
                  </p>
                </div>
                <Button type="button" size="sm" variant="ghost" onClick={closeExportResult} aria-label="Close export options">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid gap-2">
                <Button asChild>
                  <a href={exportResult.url} target="_blank" rel="noreferrer">
                    <Eye className="h-4 w-4" />
                    View {exportResult.format.toUpperCase()}
                  </a>
                </Button>
                <Button asChild variant="outline">
                  <a href={exportResult.url} download={exportResult.fileName}>
                    <Download className="h-4 w-4" />
                    Download {exportResult.format.toUpperCase()}
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
      {isPreviewOpen && displaySchedule ? (
        <div className="fixed -inset-8 z-[9999] grid place-items-center bg-black/75 p-10 backdrop-blur-xl sm:p-12">
          <div className="flex max-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col rounded-2xl border bg-card text-card-foreground shadow-2xl sm:max-h-[88vh]">
            <div className="flex items-center justify-between gap-4 border-b p-5">
              <div className="flex min-w-0 items-center gap-3">
                <img src="/arxeni.png" alt="Arxeni" className="hidden h-8 w-auto object-contain dark:invert sm:block" />
                <div>
                  <h2 className="text-lg font-semibold">Schedule preview</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{selectedSummary}</p>
                </div>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsPreviewOpen(false)} aria-label="Close schedule preview">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="overflow-auto p-3 sm:p-5">
              <ScheduleTimetable schedule={displaySchedule} frozenSchedules={frozenSchedules} />
            </div>
          </div>
        </div>
      ) : null}
      <footer className="relative z-10 -mx-3 -mb-5 mt-12 min-h-[78vh] overflow-hidden border-t bg-white px-4 py-14 text-slate-600 dark:border-white/10 dark:bg-[#050607] dark:text-slate-400 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <BottomAurora />
        <div className="relative z-10 mx-auto grid max-w-7xl gap-12 lg:grid-cols-[minmax(0,0.76fr)_minmax(0,1.6fr)]">
          <div className="grid content-start gap-5">
            <img src="/arxeni.png" alt="Arxeni" className="w-40 max-w-full object-contain invert dark:invert-0 sm:w-48" />
            <p className="max-w-72 text-sm leading-7">
              Personal schedule generation for clean weekly class plans. No enrollment actions, no server storage.
            </p>
            <a className="w-fit text-sm font-semibold text-slate-900 hover:underline dark:text-slate-200" href="mailto:arxeni.dev@gmail.com">
              arxeni.dev@gmail.com
            </a>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-600">Version {APP_VERSION}</p>
            <small className="mt-8 text-xs text-slate-500 dark:text-slate-600">© 2026 SchedAI by Arxeni. All rights reserved.</small>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
            <FooterColumn
              title="Explore"
              links={[
                { label: "Workspace", href: "/" },
                { label: "Imports", href: "/imports" },
                "Upload",
                "Subjects",
                "Preferences"
              ]}
            />
            <FooterColumn title="More from Arxeni" links={["Expy", "Lumen", "APOS Web", "APOS Mobile", "ProxiFix"]} />
            <FooterColumn
              title="Follow"
              links={[
                { label: "GitHub", href: "https://github.com/auxomeness", icon: Github },
                { label: "LinkedIn", href: "https://www.linkedin.com/in/karlaustinpavia", icon: Linkedin },
                { label: "Facebook", href: "https://www.facebook.com/karlaustin.pavia", icon: Facebook },
                { label: "Instagram", href: "https://www.instagram.com/thatguyaustinn/", icon: Instagram }
              ]}
            />
            <FooterColumn
              title="Help"
              links={[
                { label: "Imports", href: "/imports#imports" },
                { label: "Google Sheets", href: "/imports#google-sheets" },
                { label: "Google Docs", href: "/imports#google-docs" }
              ]}
            />
            <FooterColumn
              title="Legal"
              links={[
                { label: "Terms", href: "/terms" },
                { label: "Privacy", href: "/privacy" }
              ]}
            />
            <p className="border-t border-white/10 pt-5 text-sm leading-7 sm:col-span-2 lg:col-span-5">
              SchedAI helps compare personal schedule options. Always verify your final schedule with your school.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

function normalizePreferences(preferences: SchedulePreferences): SchedulePreferences {
  const legacyBreak =
    preferences.breakStart !== undefined && preferences.breakEnd !== undefined
      ? [{ id: "legacy-lunch", start: preferences.breakStart, end: preferences.breakEnd }]
      : [];

  return {
    ...DEFAULT_PREFERENCES,
    ...preferences,
    breaks: preferences.breaks?.length ? preferences.breaks : legacyBreak
  };
}

function buildSelectedSectionIdsFromPreferred(
  sections: ClassSection[],
  selectedSubjects: string[],
  preferredSections: Record<string, string | undefined>
): SelectedSectionIds {
  const selected = new Set(selectedSubjects);
  return selectedSubjects.reduce<SelectedSectionIds>((result, subject) => {
    const preferred = preferredSections[subject];
    result[subject] = sections
      .filter((section) => selected.has(section.subjectCode))
      .filter((section) => section.subjectCode === subject)
      .filter((section) => !preferred || section.section === preferred)
      .map((section) => section.id);
    return result;
  }, {});
}

type FooterLink = string | {
  label: string;
  href: string;
  icon?: React.ComponentType<{ className?: string }>;
};

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <nav className="grid content-start gap-2">
      <span className="mb-1 text-xs font-extrabold text-slate-900 dark:text-slate-200">{title}</span>
      {links.map((link) => {
        const label = typeof link === "string" ? link : link.label;
        const href = typeof link === "string" ? "#" : link.href;
        const Icon = typeof link === "string" ? undefined : link.icon;

        const isExternal = href.startsWith("http");

        return (
          <a key={label} href={href} target={isExternal ? "_blank" : undefined} rel={isExternal ? "noreferrer" : undefined} className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950 hover:underline dark:hover:text-slate-100">
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {label}
          </a>
        );
      })}
    </nav>
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [metadata, base64] = dataUrl.split(",");
  const mime = metadata.match(/data:(.*?);/)?.[1] ?? "application/octet-stream";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mime });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function FeedbackCard({ title, items }: { title: string; items: NoSolutionReason[] }) {
  return (
    <Card className="border-amber-200 bg-amber-50/90 shadow-none">
      <CardContent className="flex gap-3 p-4">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
        <div>
          <h2 className="text-sm font-semibold text-amber-950">{title}</h2>
          <div className="mt-2 space-y-2">
            {items.map((item) => (
              <div key={`${item.message}-${item.suggestion}`} className="text-sm leading-6 text-amber-900">
                <p>{item.message}</p>
                <p className="font-medium">{item.suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

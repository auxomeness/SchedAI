"use client";

import { useMemo, useState } from "react";
import { BookOpenCheck, ChevronDown, ChevronRight, Maximize2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { ClassSection, SelectedSectionIds, SubjectOption } from "@/types/schedule";
import { formatMinutes } from "@/lib/scheduler/time";

interface SubjectPickerProps {
  sections: ClassSection[];
  subjects: SubjectOption[];
  selectedSubjects: string[];
  selectedSectionIds: SelectedSectionIds;
  onChange: (subjects: string[]) => void;
  onSelectedSectionIdsChange: (sections: SelectedSectionIds) => void;
}

export function SubjectPicker({
  sections,
  subjects,
  selectedSubjects,
  selectedSectionIds,
  onChange,
  onSelectedSectionIdsChange
}: SubjectPickerProps) {
  const [query, setQuery] = useState("");
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [isExpandedViewOpen, setIsExpandedViewOpen] = useState(false);

  const sectionsBySubject = useMemo(() => {
    const result = new Map<string, ClassSection[]>();
    sections.forEach((section) => {
      result.set(section.subjectCode, [...(result.get(section.subjectCode) ?? []), section]);
    });
    result.forEach((items, code) => {
      result.set(
        code,
        items.sort((a, b) => sectionLabel(a).localeCompare(sectionLabel(b)))
      );
    });
    return result;
  }, [sections]);

  const selected = useMemo(
    () => selectedSubjects.flatMap((code) => subjects.find((subject) => subject.code === code) ?? []),
    [selectedSubjects, subjects]
  );

  const filteredSubjects = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return subjects.filter((subject) => {
      if (showSelectedOnly && !selectedSubjects.includes(subject.code)) return false;
      if (!normalized) return true;

      const subjectSections = sectionsBySubject.get(subject.code) ?? [];
      return (
        subject.code.toLowerCase().includes(normalized) ||
        subject.name.toLowerCase().includes(normalized) ||
        subjectSections.some((section) =>
          [section.section, section.professor, section.room, meetingSummary(section)]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(normalized)
        )
      );
    });
  }, [query, sectionsBySubject, selectedSubjects, showSelectedOnly, subjects]);

  function allSectionIds(code: string) {
    return (sectionsBySubject.get(code) ?? []).map((section) => section.id);
  }

  function toggleSubject(code: string, checked: boolean) {
    if (checked) {
      onChange(Array.from(new Set([...selectedSubjects, code])).sort());
      onSelectedSectionIdsChange({ ...selectedSectionIds, [code]: allSectionIds(code) });
      return;
    }

    onChange(selectedSubjects.filter((subject) => subject !== code));
    const next = { ...selectedSectionIds };
    delete next[code];
    onSelectedSectionIdsChange(next);
  }

  function toggleSection(subject: SubjectOption, sectionId: string, checked: boolean) {
    const current = selectedSectionIds[subject.code] ?? [];
    const nextIds = checked ? Array.from(new Set([...current, sectionId])) : current.filter((id) => id !== sectionId);
    const nextSelections = { ...selectedSectionIds };

    if (nextIds.length > 0) {
      nextSelections[subject.code] = nextIds;
      if (!selectedSubjects.includes(subject.code)) onChange([...selectedSubjects, subject.code].sort());
    } else {
      delete nextSelections[subject.code];
      onChange(selectedSubjects.filter((code) => code !== subject.code));
    }

    onSelectedSectionIdsChange(nextSelections);
  }

  function toggleExpanded(code: string) {
    setExpandedSubjects((existing) => (existing.includes(code) ? existing.filter((item) => item !== code) : [...existing, code]));
  }

  function clearAll() {
    onChange([]);
    onSelectedSectionIdsChange({});
  }

  function renderSearch() {
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search subject, section, professor, room, or time"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
    );
  }

  function renderActions({ showExpand }: { showExpand: boolean }) {
    return (
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="ghost" onClick={clearAll}>
          Uncheck all
        </Button>
        <Button
          type="button"
          size="sm"
          variant={showSelectedOnly ? "default" : "outline"}
          onClick={() => setShowSelectedOnly((value) => !value)}
        >
          Show selected only
        </Button>
        {showExpand ? (
          <Button type="button" size="sm" variant="outline" onClick={() => setIsExpandedViewOpen(true)}>
            <Maximize2 className="h-4 w-4" />
            Expand
          </Button>
        ) : null}
      </div>
    );
  }

  function renderSubjectList(className: string) {
    return (
      <div className={`${className} space-y-2 overflow-auto pr-1`}>
        {filteredSubjects.map((subject) => {
          const subjectSections = sectionsBySubject.get(subject.code) ?? [];
          const selectedIds = selectedSectionIds[subject.code] ?? [];
          const isSelected = selectedSubjects.includes(subject.code);
          const isExpanded = expandedSubjects.includes(subject.code);

          return (
            <div key={subject.code} className="rounded-xl border bg-white/60 dark:bg-[#050505]/90">
              <div className="flex items-start gap-3 p-3">
                <Checkbox checked={isSelected} onCheckedChange={(checked) => toggleSubject(subject.code, checked === true)} />
                <button type="button" className="min-w-0 flex-1 text-left" onClick={() => toggleExpanded(subject.code)}>
                  <span className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0" />}
                    <span className="text-sm font-semibold">{subject.code}</span>
                  </span>
                  <span className="mt-1 block truncate text-xs text-muted-foreground">{subject.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {selectedIds.length || 0} of {subject.sectionCount} section{subject.sectionCount === 1 ? "" : "s"} selected
                  </span>
                </button>
              </div>

              {isExpanded ? (
                <div className="border-t p-2">
                  <div className="grid gap-2 xl:grid-cols-2">
                    {subjectSections.map((section) => {
                      const checked = selectedIds.includes(section.id);
                      return (
                        <label
                          key={section.id}
                          className="grid cursor-pointer gap-2 rounded-lg border bg-card p-3 text-sm hover:bg-secondary/60"
                        >
                          <span className="flex items-start gap-3">
                            <Checkbox checked={checked} onCheckedChange={(next) => toggleSection(subject, section.id, next === true)} />
                            <span className="min-w-0">
                              <span className="block font-semibold">
                                {section.section || "No section"} · {meetingSummary(section)}
                              </span>
                              <span className="block truncate text-xs text-muted-foreground">{section.subjectName}</span>
                            </span>
                          </span>
                          <span className="grid gap-1 pl-8 text-xs text-muted-foreground sm:grid-cols-2">
                            <span>Room: {section.room || "Not listed"}</span>
                            <span>Teacher: {section.professor || "Not listed"}</span>
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <BookOpenCheck className="h-5 w-5 text-foreground" />
            <div>
              <CardTitle>Choose subjects</CardTitle>
              <CardDescription>{subjects.length ? `${subjects.length} subjects found.` : "Upload a file to see subjects."}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">Subjects will appear here after parsing.</p>
          ) : (
            <div className="space-y-4">
              {renderSearch()}

              {selected.length > 0 ? (
                <div className="rounded-xl border bg-secondary/40 p-3">
                  <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Selected subjects</div>
                  <div className="flex flex-wrap gap-2">
                    {selected.map((subject) => (
                      <button
                        key={subject.code}
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1 text-sm font-medium"
                        onClick={() => toggleSubject(subject.code, false)}
                      >
                        {subject.code}
                        <span className="text-xs text-muted-foreground">{selectedSectionIds[subject.code]?.length ?? 0}/{sectionsBySubject.get(subject.code)?.length ?? 0}</span>
                        <X className="h-3.5 w-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-xl border bg-white/60 p-3 text-sm text-muted-foreground dark:bg-[#050505]/90">
                  Nothing selected yet. Check the subjects or exact sections you want to include.
                </p>
              )}

              {renderActions({ showExpand: true })}
              {renderSubjectList("max-h-[34rem]")}
            </div>
          )}
        </CardContent>
      </Card>

      {isExpandedViewOpen ? (
        <div className="fixed -inset-8 z-[9999] grid place-items-center bg-black/70 p-10 backdrop-blur-xl sm:p-12">
          <div className="flex max-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col rounded-2xl border bg-card text-card-foreground shadow-2xl sm:max-h-[88vh]">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">Choose exact sections</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Search and select the specific sections, professors, rooms, and time slots SchedAI can use.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsExpandedViewOpen(false)} aria-label="Close expanded subject picker">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4 overflow-hidden p-4 sm:p-5">
              {renderSearch()}
              {renderActions({ showExpand: false })}
              {renderSubjectList("max-h-[60vh]")}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function sectionLabel(section: ClassSection) {
  return `${section.section ?? ""} ${meetingSummary(section)} ${section.professor ?? ""} ${section.room ?? ""}`;
}

function meetingSummary(section: ClassSection) {
  return section.meetings.map((meeting) => `${meeting.day} ${formatMinutes(meeting.start)} - ${formatMinutes(meeting.end)}`).join(", ");
}

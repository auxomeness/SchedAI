"use client";

import type { ChangeEvent } from "react";
import { useCallback, useEffect, useState } from "react";
import { FileCheck2, FileSpreadsheet, FileText, FileUp, HelpCircle, Link2, Loader2, Paperclip, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ParseResult } from "@/types/schedule";
import { parseScheduleFile } from "@/lib/parsers";

interface UploadPanelProps {
  isParsing: boolean;
  onParsingChange: (value: boolean) => void;
  onParsed: (result: ParseResult, fileName: string) => void;
  onError: (message: string) => void;
  onRemove?: () => void;
  fileName?: string;
}

const templateDownloads = [
  { label: "Excel template", href: "/templates/schedai-import-template.xlsx", icon: FileSpreadsheet },
  { label: "PDF template", href: "/templates/schedai-import-template.pdf", icon: FileText },
  { label: "CSV template", href: "/templates/schedai-import-template.csv", icon: FileText }
];

const acceptedColumns = ["Subject Code", "Subject Name", "Section", "Days", "Start Time", "End Time", "Professor", "Room"];
const googleSheetsTemplateUrl = "https://docs.google.com/spreadsheets/d/1pojtsXh_zfO2HwHBQ09vZ3aORqIXRwWCFztP5HunI8Y/copy";

export function UploadPanel({ isParsing, onParsingChange, onParsed, onError, onRemove, fileName }: UploadPanelProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isGoogleImportOpen, setIsGoogleImportOpen] = useState(false);
  const [googleUrl, setGoogleUrl] = useState("");
  const [googleError, setGoogleError] = useState("");
  const [isPageDragging, setIsPageDragging] = useState(false);

  const parseFile = useCallback(async (file: File) => {
    onParsingChange(true);
    onError("");

    try {
      const result = await parseScheduleFile(file);
      onParsed(result, file.name);
    } catch (error) {
      onError(error instanceof Error ? error.message : "We could not read this schedule file.");
    } finally {
      onParsingChange(false);
    }
  }, [onError, onParsed, onParsingChange]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await parseFile(file);
    } finally {
      event.target.value = "";
    }
  }

  async function handleGoogleImport() {
    const trimmedUrl = googleUrl.trim();
    if (!trimmedUrl || isParsing) return;

    onParsingChange(true);
    onError("");
    setGoogleError("");

    try {
      const response = await fetch("/api/import/google", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({ url: trimmedUrl })
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => undefined)) as { error?: string } | undefined;
        throw new Error(payload?.error ?? "We could not import this Google file.");
      }

      const blob = await response.blob();
      const fileName = response.headers.get("x-schedai-filename") ?? "google-import.csv";
      const file = new File([blob], fileName, { type: response.headers.get("content-type") ?? blob.type });
      const result = await parseScheduleFile(file);
      onParsed(result, file.name);
      setGoogleUrl("");
      setIsGoogleImportOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : "We could not import this Google file.";
      setGoogleError(message);
      onError(message);
    } finally {
      onParsingChange(false);
    }
  }

  useEffect(() => {
    function hasDraggedFiles(event: DragEvent) {
      return Array.from(event.dataTransfer?.types ?? []).includes("Files");
    }

    function handleWindowDragOver(event: DragEvent) {
      if (!hasDraggedFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = "copy";
      if (!isParsing) setIsPageDragging(true);
    }

    function handleWindowDragLeave(event: DragEvent) {
      if (!hasDraggedFiles(event)) return;
      if (event.clientX <= 0 || event.clientY <= 0 || event.clientX >= window.innerWidth || event.clientY >= window.innerHeight) {
        setIsPageDragging(false);
      }
    }

    async function handleWindowDrop(event: DragEvent) {
      if (!hasDraggedFiles(event)) return;
      event.preventDefault();
      setIsPageDragging(false);
      const file = event.dataTransfer?.files?.[0];
      if (!file || isParsing) return;
      await parseFile(file);
    }

    function handleWindowDragEnd() {
      setIsPageDragging(false);
    }

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("dragleave", handleWindowDragLeave);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("dragend", handleWindowDragEnd);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("dragleave", handleWindowDragLeave);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragend", handleWindowDragEnd);
    };
  }, [isParsing, parseFile]);

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <FileUp className="h-5 w-5 shrink-0 text-foreground" />
              <div>
                <CardTitle>Upload schedule file</CardTitle>
                <CardDescription>PDF, CSV, or Excel. Text-based files work best.</CardDescription>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-9 w-9 shrink-0 rounded-full p-0"
              onClick={() => setIsHelpOpen(true)}
              aria-label="Show accepted import format"
            >
              <HelpCircle className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <label className="block">
            <span className="sr-only">Choose schedule file</span>
            <Input className="hidden" accept=".pdf,.csv,.xlsx,.xls" disabled={isParsing} type="file" onChange={handleFileChange} />
            <span className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-3 text-sm font-medium transition-colors dark:bg-[#050505]/90 ${isPageDragging ? "border-foreground bg-secondary" : "bg-white/70 hover:bg-secondary/70"}`}>
              {fileName ? <Paperclip className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
              {isPageDragging ? "Drop file anywhere to upload" : fileName ? "Replace attached file" : "Choose or drag schedule file"}
            </span>
          </label>
          <div className="flex min-h-5 items-center gap-2 text-sm text-muted-foreground">
            {isParsing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reading file...
              </>
            ) : fileName ? (
              <div className="flex min-w-0 items-center gap-2">
                <span className="inline-flex min-w-0 items-center gap-2 rounded-full border bg-card px-3 py-1 text-foreground">
                  <FileCheck2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{fileName} attached</span>
                </span>
                {onRemove ? (
                  <Button type="button" size="sm" variant="ghost" className="h-8 w-8 rounded-full p-0" onClick={onRemove} aria-label="Remove attached file">
                    <X className="h-4 w-4" />
                  </Button>
                ) : null}
              </div>
            ) : (
              <>No file loaded yet.</>
            )}
          </div>
          <Button type="button" variant="outline" className="w-full" onClick={() => setIsGoogleImportOpen(true)}>
            <Link2 className="h-4 w-4" />
            Import from Google link
          </Button>
        </CardContent>
      </Card>

      {isPageDragging ? (
        <div className="pointer-events-none fixed -inset-8 z-[9998] grid place-items-center bg-black/50 p-12 backdrop-blur-lg">
          <div className="rounded-2xl border bg-card px-6 py-5 text-center text-card-foreground shadow-2xl">
            <FileUp className="mx-auto h-7 w-7" />
            <p className="mt-3 text-sm font-extrabold">Drop schedule file to upload</p>
            <p className="mt-1 text-xs text-muted-foreground">PDF, CSV, XLSX, or XLS</p>
          </div>
        </div>
      ) : null}

      {isHelpOpen ? (
        <div className="fixed -inset-8 z-[9999] grid place-items-center bg-black/70 p-12 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="import-help-title">
          <div className="w-full max-w-2xl rounded-2xl border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 id="import-help-title" className="text-lg font-extrabold">
                  Accepted import format
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Upload a text-based PDF, CSV, XLSX, or XLS file with one row per class section.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0" onClick={() => setIsHelpOpen(false)} aria-label="Close import help">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-5 p-5">
              <div>
                <p className="text-sm font-semibold">Recommended columns</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {acceptedColumns.map((column) => (
                    <span key={column} className="rounded-full border bg-secondary px-3 py-1 text-xs font-semibold">
                      {column}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border bg-secondary/50 p-4 text-sm leading-7 text-muted-foreground">
                <p>
                  Example row: <span className="font-semibold text-foreground">COURSE101</span>, Sample Course Title, SEC-A, MW, 9:00 AM, 10:30 AM,
                  Professor Name, Room / Online.
                </p>
                <p className="mt-2">PDF files must be text-based. Scanned image PDFs may not parse correctly.</p>
                <p className="mt-2">For Google links, share the file as "Anyone with the link can view" before importing.</p>
              </div>
              <div className="rounded-xl border bg-card p-4 text-sm leading-7">
                <p className="font-semibold">Google import guide</p>
                <p className="mt-2 text-muted-foreground">Google Sheets is recommended. Make a copy of the template, fill one class section per row, share it as view-only, then paste the normal Sheet link into SchedAI.</p>
                <p className="mt-2 text-muted-foreground">Google Docs is beta. Use a real 8-column text table, not a screenshot, and avoid merged cells or title rows above the headers.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button asChild variant="outline" className="justify-center">
                  <a href={googleSheetsTemplateUrl} target="_blank" rel="noreferrer">
                    <FileSpreadsheet className="h-4 w-4" />
                    Google Sheets template
                  </a>
                </Button>
                <Button asChild variant="outline" className="justify-center">
                  <a href="/imports#google-sheets">
                    <Link2 className="h-4 w-4" />
                    Google guide
                  </a>
                </Button>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {templateDownloads.map(({ label, href, icon: Icon }) => (
                  <Button key={href} asChild variant="outline" className="justify-center">
                    <a href={href} download>
                      <Icon className="h-4 w-4" />
                      {label}
                    </a>
                  </Button>
                ))}
              </div>
              <a href="/imports" className="inline-flex text-sm font-semibold text-foreground underline-offset-4 hover:underline">
                View full import guide
              </a>
            </div>
          </div>
        </div>
      ) : null}

      {isGoogleImportOpen ? (
        <div className="fixed -inset-8 z-[9999] grid place-items-center bg-black/70 p-12 backdrop-blur-xl" role="dialog" aria-modal="true" aria-labelledby="google-import-title">
          <div className="w-full max-w-xl rounded-2xl border bg-card text-card-foreground shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 id="google-import-title" className="text-lg font-extrabold">
                  Import from Google
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Paste a Google Sheets or Google Docs link shared as "Anyone with the link can view."
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" className="h-9 w-9 rounded-full p-0" onClick={() => setIsGoogleImportOpen(false)} aria-label="Close Google import">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <label htmlFor="google-import-url" className="text-sm font-semibold">
                  Google link
                </label>
                <Input
                  id="google-import-url"
                  value={googleUrl}
                  onChange={(event) => {
                    setGoogleUrl(event.target.value);
                    setGoogleError("");
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void handleGoogleImport();
                  }}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  disabled={isParsing}
                />
              </div>
              <div className="rounded-xl border bg-secondary/50 p-4 text-sm leading-7 text-muted-foreground">
                <p>Google Sheets is recommended because it exports clean CSV data.</p>
                <p className="mt-2">Google Docs support is beta and works best when the document contains a simple text table.</p>
              </div>
              <Button asChild variant="outline" className="w-full">
                <a href={googleSheetsTemplateUrl} target="_blank" rel="noreferrer">
                  <FileSpreadsheet className="h-4 w-4" />
                  Make a copy of the Google Sheets template
                </a>
              </Button>
              {googleError ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {googleError}
                </p>
              ) : null}
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" onClick={() => setIsGoogleImportOpen(false)}>
                  Cancel
                </Button>
                <Button type="button" disabled={!googleUrl.trim() || isParsing} onClick={handleGoogleImport}>
                  {isParsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                  Import link
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

"use client";

import type { ChangeEvent } from "react";
import { FileCheck2, FileUp, Loader2, Paperclip, X } from "lucide-react";
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

export function UploadPanel({ isParsing, onParsingChange, onParsed, onError, onRemove, fileName }: UploadPanelProps) {
  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    onParsingChange(true);
    onError("");

    try {
      const result = await parseScheduleFile(file);
      onParsed(result, file.name);
    } catch (error) {
      onError(error instanceof Error ? error.message : "We could not read this schedule file.");
    } finally {
      onParsingChange(false);
      event.target.value = "";
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <FileUp className="h-5 w-5 text-foreground" />
          <div>
            <CardTitle>Upload schedule file</CardTitle>
            <CardDescription>PDF, CSV, or Excel. Text-based files work best.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <label className="block">
          <span className="sr-only">Choose schedule file</span>
          <Input className="hidden" accept=".pdf,.csv,.xlsx,.xls" disabled={isParsing} type="file" onChange={handleFileChange} />
          <span className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed bg-white/70 px-4 py-3 text-sm font-medium transition-colors hover:bg-secondary/70 dark:bg-[#050505]/90">
            {fileName ? <Paperclip className="h-4 w-4" /> : <FileUp className="h-4 w-4" />}
            {fileName ? "Replace attached file" : "Choose schedule file"}
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
      </CardContent>
    </Card>
  );
}

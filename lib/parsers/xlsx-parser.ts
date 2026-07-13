import type { ParseResult } from "@/types/schedule";
import { hasUsableScheduleData, normalizeStructuredRows } from "@/lib/parsers/normalize";

export async function parseXlsxFile(file: File): Promise<ParseResult> {
  const XLSX = await import("xlsx");
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: "" });
  const parsed = normalizeStructuredRows(rows);

  if (!hasUsableScheduleData(parsed)) {
    throw new Error("We could not find schedule rows with subject, day, and time fields in this Excel file.");
  }

  return parsed;
}

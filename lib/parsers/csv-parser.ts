import Papa from "papaparse";
import type { ParseResult } from "@/types/schedule";
import { hasUsableScheduleData, normalizeStructuredRows } from "@/lib/parsers/normalize";

export async function parseCsvFile(file: File): Promise<ParseResult> {
  const text = await file.text();

  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (result) => {
        const parsed = normalizeStructuredRows(result.data);
        if (!hasUsableScheduleData(parsed)) {
          reject(new Error("We could not find schedule rows with subject, day, and time fields in this CSV."));
          return;
        }
        resolve(parsed);
      },
      error: () => reject(new Error("We could not read this CSV file."))
    });
  });
}

import type { ParseResult } from "@/types/schedule";
import { parseCsvFile } from "@/lib/parsers/csv-parser";
import { parsePdfFile } from "@/lib/parsers/pdf-parser";
import { parseXlsxFile } from "@/lib/parsers/xlsx-parser";

export async function parseScheduleFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const type = file.type;

  if (name.endsWith(".csv") || type.includes("csv")) return parseCsvFile(file);
  if (name.endsWith(".xlsx") || name.endsWith(".xls")) return parseXlsxFile(file);
  if (name.endsWith(".pdf") || type.includes("pdf")) return parsePdfFile(file);

  throw new Error("Please upload a PDF, CSV, or Excel file.");
}

import type { ParseResult } from "@/types/schedule";
import { hasUsableScheduleData, normalizePdfText, normalizeStructuredRows } from "@/lib/parsers/normalize";

interface PdfTextItem {
  str: string;
  x: number;
  y: number;
}

interface PdfLine {
  y: number;
  items: PdfTextItem[];
}

const TABLE_HEADERS = ["Subject Code", "Subject Name", "Section", "Days", "Start Time", "End Time", "Professor", "Room"];

function cleanHeader(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function findTableHeaderLine(lines: PdfLine[]): PdfLine | undefined {
  return lines.find((line) => {
    const text = line.items.map((item) => item.str).join(" ").toLowerCase();
    return text.includes("subject code") && text.includes("days") && (text.includes("start time") || text.includes("time"));
  });
}

function extractHeaderItems(line: PdfLine): Array<PdfTextItem & { normalized: string }> {
  const items = [...line.items].sort((a, b) => a.x - b.x);
  const result: Array<PdfTextItem & { normalized: string }> = [];
  let cursor = 0;

  TABLE_HEADERS.forEach((header) => {
    const expected = cleanHeader(header);

    for (let index = cursor; index < items.length; index += 1) {
      for (let length = 1; length <= 3 && index + length <= items.length; length += 1) {
        const slice = items.slice(index, index + length);
        const normalized = cleanHeader(slice.map((item) => item.str).join(" "));
        if (normalized !== expected) continue;

        result.push({
          str: header,
          x: slice[0].x,
          y: slice[0].y,
          normalized: expected
        });
        cursor = index + length;
        return;
      }
    }
  });

  return result;
}

function buildStructuredRowsFromTable(lines: PdfLine[]): Record<string, string>[] {
  const headerLine = findTableHeaderLine(lines);
  if (!headerLine) return [];

  const headerItems = extractHeaderItems(headerLine).sort((a, b) => a.x - b.x);

  if (headerItems.length < 6) return [];

  const columns = headerItems.map((item, index) => {
    const next = headerItems[index + 1];
    return {
      header: TABLE_HEADERS.find((header) => cleanHeader(header) === item.normalized) ?? item.str,
      endX: next ? (item.x + next.x) / 2 : Number.POSITIVE_INFINITY
    };
  });

  return lines
    .filter((line) => line.y < headerLine.y - 1)
    .map((line) => {
      const row: Record<string, string> = {};
      columns.forEach(({ header }) => {
        row[header] = "";
      });

      line.items
        .sort((a, b) => a.x - b.x)
        .forEach((item) => {
          const columnIndex = columns.findIndex((column, index) => item.x < column.endX || index === columns.length - 1);
          const column = columns[columnIndex];
          if (!column) return;
          row[column.header] = [row[column.header], item.str].filter(Boolean).join(" ").trim();
        });

      return row;
    })
    .filter((row) => Object.values(row).some(Boolean));
}

export async function parsePdfFile(file: File): Promise<ParseResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];
  const structuredRows: Record<string, string>[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const rows = content.items.flatMap((item) => {
      if (!("str" in item) || !("transform" in item)) return [];
      const transform = item.transform as unknown[];
      const str = item.str.trim();
      if (!str) return [];
      return [
        {
          str,
          x: Number(transform[4] ?? 0),
          y: Number(transform[5] ?? 0)
        }
      ];
    });

    const lineGroups: PdfLine[] = [];
    rows
      .sort((a, b) => b.y - a.y || a.x - b.x)
      .forEach((item) => {
        const group = lineGroups.find((line) => Math.abs(line.y - item.y) <= 1.4);
        if (!group) {
          lineGroups.push({ y: item.y, items: [item] });
          return;
        }

        group.items.push(item);
        group.y = group.items.reduce((sum, current) => sum + current.y, 0) / group.items.length;
      });

    structuredRows.push(...buildStructuredRowsFromTable(lineGroups));

    const text = lineGroups
      .sort((a, b) => b.y - a.y)
      .map(({ items }) =>
        items
          .sort((a, b) => a.x - b.x)
          .map((item) => item.str)
          .join(" ")
          .replace(/\s*:\s*/g, ":")
          .replace(/\s*\/\s*/g, "/")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean)
      .join("\n");

    pages.push(text);
  }

  const structured = normalizeStructuredRows(structuredRows);
  if (hasUsableScheduleData(structured)) return structured;

  const parsed = normalizePdfText(pages.join("\n"));
  if (!hasUsableScheduleData(parsed)) {
    throw new Error("We could not read schedule rows from this PDF. SchedAI supports text-based PDFs, not scanned image PDFs.");
  }

  return parsed;
}

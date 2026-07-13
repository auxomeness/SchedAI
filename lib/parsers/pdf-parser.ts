import type { ParseResult } from "@/types/schedule";
import { hasUsableScheduleData, normalizePdfText } from "@/lib/parsers/normalize";

export async function parsePdfFile(file: File): Promise<ParseResult> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.mjs", import.meta.url).toString();

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buffer }).promise;
  const pages: string[] = [];

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

    const lineGroups: Array<{ y: number; items: typeof rows }> = [];
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

  const parsed = normalizePdfText(pages.join("\n"));
  if (!hasUsableScheduleData(parsed)) {
    throw new Error("We could not read schedule rows from this PDF. SchedAI supports text-based PDFs, not scanned image PDFs.");
  }

  return parsed;
}

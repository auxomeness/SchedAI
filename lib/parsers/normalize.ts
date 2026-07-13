import type { ClassSection, ParseResult, SubjectOption } from "@/types/schedule";
import { buildMeetings, parseDays, parseTimeToMinutes } from "@/lib/scheduler/time";

const FIELD_ALIASES = {
  subjectCode: ["subject code", "subj code", "subj. code", "code", "course code", "subject"],
  subjectName: ["subject name", "subject title", "title", "course title", "course name", "name"],
  section: ["section", "sec"],
  days: ["days", "day"],
  startTime: ["start time", "start", "from"],
  endTime: ["end time", "end", "to"],
  time: ["time", "schedule"],
  professor: ["professor", "teacher", "instructor", "faculty"],
  room: ["room", "location"]
} as const;

type CanonicalField = keyof typeof FIELD_ALIASES;
type Row = Record<string, unknown>;

function cleanHeader(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").replace(/[^a-z0-9. ]/g, "").trim();
}

function getString(row: Row, headerMap: Map<CanonicalField, string>, key: CanonicalField): string {
  const header = headerMap.get(key);
  const value = header ? row[header] : undefined;
  return value === undefined || value === null ? "" : String(value).trim();
}

function createHeaderMap(headers: string[]): Map<CanonicalField, string> {
  const normalized = new Map(headers.map((header) => [cleanHeader(header), header]));
  const result = new Map<CanonicalField, string>();

  Object.entries(FIELD_ALIASES).forEach(([field, aliases]) => {
    const match = aliases.find((alias) => normalized.has(alias));
    if (match) result.set(field as CanonicalField, normalized.get(match)!);
  });

  return result;
}

function splitTimeRange(value: string): [string, string] | undefined {
  const normalized = value
    .replace(/[–—]/g, "-")
    .replace(/\s*:\s*/g, ":")
    .replace(/\s+/g, " ")
    .trim();
  const match = normalized.match(/(\d{1,2}:?\d{0,2}\s*(?:AM|PM|NN|NOON)?)\s*-\s*(\d{1,2}:?\d{0,2}\s*(?:AM|PM|NN|NOON)?)/i);
  if (!match) return undefined;

  const start = match[1];
  let end = match[2];
  const endHasMeridiem = /(AM|PM|NN|NOON)/i.test(end);
  const startMeridiem = start.match(/(AM|PM|NN|NOON)/i)?.[1];
  if (!endHasMeridiem && startMeridiem) end = `${end} ${startMeridiem}`;
  return [start, end];
}

function inferCodeAndSection(parts: string[]): { code?: string; section?: string; index: number; nextIndex: number } {
  const codeIndex = parts.findIndex((part) => /^[A-Z]{2,5}\d{3}[A-Z]?$/.test(part));
  if (codeIndex === -1) return { index: -1, nextIndex: -1 };

  const sectionToken = parts[codeIndex + 1];
  if (!sectionToken || !/^[A-Z0-9]{2,}$/i.test(sectionToken)) {
    return { code: parts[codeIndex], index: codeIndex, nextIndex: codeIndex + 1 };
  }

  const suffixToken = parts[codeIndex + 2];
  const section = suffixToken && /^[A-Z][a-z]?$/.test(suffixToken) ? `${sectionToken}${suffixToken}` : sectionToken;
  return {
    code: parts[codeIndex],
    section,
    index: codeIndex,
    nextIndex: codeIndex + (suffixToken && /^[A-Z][a-z]?$/.test(suffixToken) ? 3 : 2)
  };
}

function normalizeSection(section: Omit<ClassSection, "id">, seed: number): ClassSection | undefined {
  if (!section.subjectCode || !section.subjectName || section.meetings.length === 0) return undefined;
  return {
    ...section,
    subjectCode: section.subjectCode.toUpperCase(),
    subjectName: section.subjectName.replace(/\s+/g, " ").trim(),
    section: section.section?.trim() || undefined,
    professor: section.professor?.replace(/\s+/g, " ").trim() || undefined,
    room: section.room?.replace(/\s+/g, " ").trim() || undefined,
    id: `${section.subjectCode}-${section.section ?? "section"}-${seed}`.replace(/\s+/g, "-")
  };
}

export function normalizeStructuredRows(rows: Row[]): ParseResult {
  const headers = Object.keys(rows[0] ?? {});
  const headerMap = createHeaderMap(headers);
  const sections: ClassSection[] = [];

  rows.forEach((row, index) => {
    const subjectCode = getString(row, headerMap, "subjectCode");
    const subjectName = getString(row, headerMap, "subjectName");
    const section = getString(row, headerMap, "section");
    const days = getString(row, headerMap, "days");
    const time = getString(row, headerMap, "time");
    const timeRange = time ? splitTimeRange(time) : undefined;
    const start = getString(row, headerMap, "startTime") || timeRange?.[0] || "";
    const end = getString(row, headerMap, "endTime") || timeRange?.[1] || "";

    const normalized = normalizeSection(
      {
        subjectCode,
        subjectName,
        section,
        professor: getString(row, headerMap, "professor"),
        room: getString(row, headerMap, "room"),
        meetings: buildMeetings(days, start, end)
      },
      index
    );

    if (normalized) sections.push(normalized);
  });

  return buildParseResult(sections);
}

export function normalizePdfText(text: string): ParseResult {
  const sections: ClassSection[] = [];
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean);
  let previousIndex = -1;

  lines.forEach((line, index) => {
    const parts = line.split(" ");
    const inferred = inferCodeAndSection(parts);
    const range = splitTimeRange(line);
    if (!range) return;

    if (!inferred.code && previousIndex >= 0) {
      const tail = line.slice(line.indexOf(range[1]) + range[1].length).trim().split(" ");
      const dayToken = tail.find((token) => parseDays(token).length > 0) ?? "";
      const meetings = buildMeetings(dayToken, range[0], range[1]);
      sections[previousIndex] = {
        ...sections[previousIndex],
        meetings: [...sections[previousIndex].meetings, ...meetings]
      };
      return;
    }

    if (!inferred.code) return;

    const afterCode = parts.slice(inferred.nextIndex).join(" ");
    const titleEnd = afterCode.search(/\s\d+\.0\s+\d+\.0/);
    const subjectName = titleEnd > 0 ? afterCode.slice(0, titleEnd) : afterCode.slice(0, 60);
    const timeEndIndex = line.indexOf(range[1]) + range[1].length;
    const tail = line.slice(timeEndIndex).trim().split(" ");
    const dayToken = tail.find((token) => parseDays(token).length > 0) ?? "";
    const dayIndex = tail.indexOf(dayToken);
    const room = dayIndex >= 0 && tail[dayIndex + 1] && !/^\d+$/.test(tail[dayIndex + 1]) ? tail[dayIndex + 1] : "";
    const professorParts = tail.slice(dayIndex + (room ? 2 : 1)).filter((token) => !/^\d+$/.test(token));

    const normalized = normalizeSection(
      {
        subjectCode: inferred.code,
        subjectName,
        section: inferred.section,
        professor: professorParts.join(" "),
        room,
        meetings: buildMeetings(dayToken, range[0], range[1])
      },
      index
    );

    if (normalized) {
      sections.push(normalized);
      previousIndex = sections.length - 1;
    }
  });

  return buildParseResult(sections);
}

export function buildParseResult(sections: ClassSection[]): ParseResult {
  const unique = new Map<string, SubjectOption>();
  sections.forEach((section) => {
    const existing = unique.get(section.subjectCode);
    unique.set(section.subjectCode, {
      code: section.subjectCode,
      name: existing?.name || section.subjectName,
      sectionCount: (existing?.sectionCount ?? 0) + 1
    });
  });

  return {
    sections,
    subjects: Array.from(unique.values()).sort((a, b) => a.code.localeCompare(b.code))
  };
}

export function hasUsableScheduleData(result: ParseResult): boolean {
  return result.sections.length > 0 && result.subjects.length > 0;
}

export function isLikelyTime(value: string): boolean {
  return parseTimeToMinutes(value) !== undefined;
}

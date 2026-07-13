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

function isTimeField(key: CanonicalField): boolean {
  return key === "startTime" || key === "endTime" || key === "time";
}

function formatMinutesAsTime(minutes: number): string {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(normalized / 60);
  const minute = normalized % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 || 12;
  return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
}

function formatExcelTimeNumber(value: number): string {
  const fraction = ((value % 1) + 1) % 1;
  if (fraction === 0 && value !== 0) return String(value);
  return formatMinutesAsTime(Math.round(fraction * 1440));
}

function stringifyCellValue(value: unknown, key: CanonicalField): string {
  if (value === undefined || value === null) return "";
  if (value instanceof Date && isTimeField(key)) {
    return formatMinutesAsTime(value.getHours() * 60 + value.getMinutes());
  }
  if (typeof value === "number" && isTimeField(key)) {
    return formatExcelTimeNumber(value);
  }

  const text = String(value).trim();
  if (isTimeField(key) && /^-?\d+(?:\.\d+)?$/.test(text)) {
    return formatExcelTimeNumber(Number(text));
  }

  return text;
}

function getString(row: Row, headerMap: Map<CanonicalField, string>, key: CanonicalField): string {
  const header = headerMap.get(key);
  const value = header ? row[header] : undefined;
  return stringifyCellValue(value, key);
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

function isSectionToken(value: string): boolean {
  return /^[A-Z]{1,6}\d{1,4}[A-Z]{0,4}$/i.test(value) || /^[A-Z]{2,6}\d?[A-Z]{0,3}$/i.test(value);
}

function inferCodeAndSection(parts: string[]): { code?: string; section?: string; index: number; nextIndex: number } {
  const codeIndex = parts.findIndex((part) => /^[A-Z]{2,5}\d{3}[A-Z]?$/.test(part));
  if (codeIndex === -1) return { index: -1, nextIndex: -1 };

  const sectionToken = parts[codeIndex + 1];
  if (!sectionToken || !/^[A-Z0-9]{2,}$/i.test(sectionToken)) {
    return { code: parts[codeIndex], index: codeIndex, nextIndex: codeIndex + 1 };
  }

  const secondToken = parts[codeIndex + 2];
  const thirdToken = parts[codeIndex + 3];
  const splitThreePartSection =
    /^[A-Z]{1,6}$/i.test(sectionToken) &&
    /^\d{1,4}$/.test(secondToken ?? "") &&
    /^[A-Z]{1,4}$/i.test(thirdToken ?? "");
  if (splitThreePartSection) {
    return {
      code: parts[codeIndex],
      section: `${sectionToken}${secondToken}${thirdToken}`,
      index: codeIndex,
      nextIndex: codeIndex + 4
    };
  }

  const splitTwoPartSection =
    /^[A-Z]{1,6}\d{1,4}$/i.test(sectionToken) &&
    /^[A-Z]{1,4}$/i.test(secondToken ?? "") &&
    isSectionToken(`${sectionToken}${secondToken}`);
  if (splitTwoPartSection) {
    return {
      code: parts[codeIndex],
      section: `${sectionToken}${secondToken}`,
      index: codeIndex,
      nextIndex: codeIndex + 3
    };
  }

  const splitLetterNumberSection =
    /^[A-Z]{1,6}$/i.test(sectionToken) &&
    /^\d{1,4}$/.test(secondToken ?? "") &&
    isSectionToken(`${sectionToken}${secondToken}`);
  if (splitLetterNumberSection) {
    return {
      code: parts[codeIndex],
      section: `${sectionToken}${secondToken}`,
      index: codeIndex,
      nextIndex: codeIndex + 3
    };
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

function normalizeDayCandidate(value: string): string {
  return value
    .toUpperCase()
    .replace(/[–—]/g, "-")
    .replace(/\./g, "")
    .replace(/\s*-\s*/g, "-")
    .trim();
}

function isDayCandidate(value: string): boolean {
  const candidate = normalizeDayCandidate(value);
  if (!candidate || /\d/.test(candidate)) return false;

  return /^(?:M|T|W|TH|F|S|SA|SU|MON|TUE|TUES|WED|THU|THUR|THURS|FRI|SAT|SUN|MW|TTH|FSA|M-[A-Z]+|T-[A-Z]+|W-[A-Z]+|TH-[A-Z]+|F-[A-Z]+|S-[A-Z]+|SA-[A-Z]+|SU-[A-Z]+)$/i.test(candidate)
    && parseDays(candidate).length > 0;
}

function extractPdfTail(tailText: string): { days: string; room: string; professor: string } {
  const tokens = tailText
    .replace(/[–—]/g, "-")
    .replace(/\s*-\s*/g, "-")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  let dayIndex = -1;
  let dayLength = 0;

  for (let index = 0; index < tokens.length; index += 1) {
    for (let length = 3; length >= 1; length -= 1) {
      const candidate = tokens.slice(index, index + length).join("");
      if (!isDayCandidate(candidate)) continue;
      dayIndex = index;
      dayLength = length;
      break;
    }
    if (dayIndex >= 0) break;
  }

  if (dayIndex < 0) return { days: "", room: "", professor: "" };

  const days = normalizeDayCandidate(tokens.slice(dayIndex, dayIndex + dayLength).join(""));
  const afterDays = tokens.slice(dayIndex + dayLength);
  const roomIndex = afterDays.findIndex((token) => !/^\d+(?:\.\d+)?$/.test(token));
  const roomParts =
    roomIndex >= 0
      ? [
          afterDays[roomIndex],
          ...(afterDays[roomIndex + 1] && /^[A-Z]$/i.test(afterDays[roomIndex]) && /\d/.test(afterDays[roomIndex + 1])
            ? [afterDays[roomIndex + 1]]
            : [])
        ]
      : [];
  const afterRoom = roomIndex >= 0 ? afterDays.slice(roomIndex + roomParts.length) : afterDays;
  const professorParts = afterRoom.filter((token) => !/^\d+(?:\.\d+)?$/.test(token));

  return {
    days,
    room: roomParts.join(" "),
    professor: professorParts.join(" ")
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
      const tail = extractPdfTail(line.slice(line.indexOf(range[1]) + range[1].length));
      const meetings = buildMeetings(tail.days, range[0], range[1]);
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
    const tail = extractPdfTail(line.slice(timeEndIndex));

    const normalized = normalizeSection(
      {
        subjectCode: inferred.code,
        subjectName,
        section: inferred.section,
        professor: tail.professor,
        room: tail.room,
        meetings: buildMeetings(tail.days, range[0], range[1])
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

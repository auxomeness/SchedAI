import type { Meeting, Weekday } from "@/types/schedule";

export const DAYS: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];
const RANGE_DAYS: Weekday[] = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

const DAY_ALIASES: Record<string, Weekday> = {
  M: "MON",
  MON: "MON",
  MONDAY: "MON",
  T: "TUE",
  TUE: "TUE",
  TUES: "TUE",
  TUESDAY: "TUE",
  W: "WED",
  WED: "WED",
  WEDNESDAY: "WED",
  TH: "THU",
  THU: "THU",
  THUR: "THU",
  THURS: "THU",
  THURSDAY: "THU",
  F: "FRI",
  FRI: "FRI",
  FRIDAY: "FRI",
  S: "SAT",
  SA: "SAT",
  SAT: "SAT",
  SATURDAY: "SAT",
  SU: "SUN",
  SUN: "SUN",
  SUNDAY: "SUN"
};

export function parseTimeToMinutes(value: string): number | undefined {
  const raw = value.trim().toUpperCase().replace(/\./g, "").replace("NOON", "NN");
  const match = raw.match(/(\d{1,2})(?::?(\d{2}))?\s*(AM|PM|NN)?/);
  if (!match) return undefined;

  let hour = Number(match[1]);
  const minute = Number(match[2] ?? 0);
  const meridiem = match[3];

  if (meridiem === "NN") {
    hour = 12;
  } else if (meridiem === "PM" && hour !== 12) {
    hour += 12;
  } else if (meridiem === "AM" && hour === 12) {
    hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return undefined;
  return hour * 60 + minute;
}

export function formatMinutes(minutes: number): string {
  const hour24 = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const period = hour24 >= 12 ? "PM" : "AM";
  const hour = hour24 % 12 || 12;
  return `${hour}:${minute.toString().padStart(2, "0")} ${period}`;
}

export function parseDays(value: string): Weekday[] {
  const raw = value
    .toUpperCase()
    .replace(/[–—]/g, "-")
    .replace(/\./g, "")
    .replace(/\s*-\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw) return [];

  const rangeMatch = raw.match(/^([A-Z]+)-([A-Z]+)$/);
  if (rangeMatch) {
    const start = DAY_ALIASES[rangeMatch[1]];
    const end = DAY_ALIASES[rangeMatch[2]];
    if (start && end) {
      const startIndex = RANGE_DAYS.indexOf(start);
      const endIndex = RANGE_DAYS.indexOf(end);
      if (startIndex >= 0 && endIndex >= startIndex) {
        return RANGE_DAYS.slice(startIndex, endIndex + 1);
      }
    }
  }

  if (/[,\s/&]+/.test(raw)) {
    const splitDays = raw
      .split(/[,\s/&]+/)
      .flatMap((part) => parseDays(part))
      .filter(Boolean);
    if (splitDays.length) return Array.from(new Set(splitDays));
  }

  const normalized = raw.replace(/[^A-Z]/g, "");
  if (!normalized) return [];

  if (normalized === "TTH") return ["TUE", "THU"];
  if (normalized === "MW") return ["MON", "WED"];
  if (normalized === "FSA") return ["FRI", "SAT"];

  const direct = DAY_ALIASES[normalized];
  if (direct) return [direct];

  const days: Weekday[] = [];
  let cursor = normalized;
  const patterns: Array<[string, Weekday]> = [
    ["MONDAY", "MON"],
    ["MON", "MON"],
    ["TUESDAY", "TUE"],
    ["TUES", "TUE"],
    ["TUE", "TUE"],
    ["WEDNESDAY", "WED"],
    ["WED", "WED"],
    ["THURSDAY", "THU"],
    ["THURS", "THU"],
    ["THUR", "THU"],
    ["THU", "THU"],
    ["TH", "THU"],
    ["FRIDAY", "FRI"],
    ["FRI", "FRI"],
    ["SATURDAY", "SAT"],
    ["SAT", "SAT"],
    ["SUNDAY", "SUN"],
    ["SUN", "SUN"],
    ["M", "MON"],
    ["T", "TUE"],
    ["W", "WED"],
    ["F", "FRI"],
    ["S", "SAT"]
  ];

  while (cursor.length > 0) {
    const match = patterns.find(([token]) => cursor.startsWith(token));
    if (!match) return [];

    const [token, day] = match;
    days.push(day);
    cursor = cursor.slice(token.length);
  }

  return Array.from(new Set(days));
}

export function buildMeetings(daysText: string, startText: string, endText: string): Meeting[] {
  const start = parseTimeToMinutes(startText);
  const end = parseTimeToMinutes(endText);
  const days = parseDays(daysText);
  if (start === undefined || end === undefined || end <= start || days.length === 0) return [];
  return days.map((day) => ({ day, start, end }));
}

export function meetingsOverlap(a: Meeting[], b: Meeting[]): boolean {
  return a.some((left) =>
    b.some((right) => left.day === right.day && left.start < right.end && right.start < left.end)
  );
}

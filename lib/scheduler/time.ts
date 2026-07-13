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
  const patterns: Array<[RegExp, Weekday]> = [
    [/^MON(DAY)?/, "MON"],
    [/^TUE(S|SDAY)?/, "TUE"],
    [/^WED(NESDAY)?/, "WED"],
    [/^THU(R|RS|RSDAY)?/, "THU"],
    [/^FRI(DAY)?/, "FRI"],
    [/^SAT(URDAY)?/, "SAT"],
    [/^SUN(DAY)?/, "SUN"]
  ];

  while (cursor.length > 0) {
    let matched = false;
    for (const [pattern, day] of patterns) {
      const match = cursor.match(pattern);
      if (match) {
        days.push(day);
        cursor = cursor.slice(match[0].length);
        matched = true;
        break;
      }
    }
    if (!matched) {
      const charDay = DAY_ALIASES[cursor[0]];
      if (charDay) days.push(charDay);
      cursor = cursor.slice(1);
    }
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

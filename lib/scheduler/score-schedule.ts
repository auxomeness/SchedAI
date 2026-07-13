import type { ClassSection, SchedulePreferences } from "@/types/schedule";

function daySpan(sections: ClassSection[]): number {
  const byDay = new Map<string, { start: number; end: number }>();
  sections.flatMap((section) => section.meetings).forEach((meeting) => {
    const current = byDay.get(meeting.day);
    byDay.set(meeting.day, {
      start: Math.min(current?.start ?? meeting.start, meeting.start),
      end: Math.max(current?.end ?? meeting.end, meeting.end)
    });
  });

  return Array.from(byDay.values()).reduce((total, day) => total + day.end - day.start, 0);
}

export function scoreSchedule(sections: ClassSection[], preferences: SchedulePreferences): number {
  let score = 0;
  const meetings = sections.flatMap((section) => section.meetings);
  const uniqueDays = new Set(meetings.map((meeting) => meeting.day)).size;
  const earliest = Math.min(...meetings.map((meeting) => meeting.start));
  const latest = Math.max(...meetings.map((meeting) => meeting.end));

  score += uniqueDays * 25;
  score += Math.max(0, earliest - 7 * 60) / 30;
  score += Math.max(0, 21 * 60 - latest) / 45;

  if (preferences.preferCompact) {
    score += daySpan(sections) / 20;
  }

  return Math.round(score * 100) / 100;
}

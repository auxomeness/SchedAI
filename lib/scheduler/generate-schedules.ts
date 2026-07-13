import type { ClassSection, GeneratedSchedule, SchedulePreferences, SelectedSectionIds } from "@/types/schedule";
import { meetingsOverlap } from "@/lib/scheduler/time";
import { scoreSchedule } from "@/lib/scheduler/score-schedule";

const MAX_RESULTS = 100;

function activeBreaks(preferences: SchedulePreferences) {
  const breaks = preferences.breaks?.length
    ? preferences.breaks
    : preferences.breakStart !== undefined && preferences.breakEnd !== undefined
      ? [{ id: "legacy", start: preferences.breakStart, end: preferences.breakEnd }]
      : [];

  return preferences.protectBreak ? breaks.filter((item) => item.end > item.start) : [];
}

function activeSubjectTimePreferences(preferences: SchedulePreferences) {
  return (preferences.subjectTimePreferences ?? [])
    .map((item) => ({
      ...item,
      subjectCode: item.subjectCode.trim().toUpperCase()
    }))
    .filter((item) => item.subjectCode && item.end > item.start);
}

function violatesSubjectTimePreference(section: ClassSection, preferences: SchedulePreferences): boolean {
  const rules = activeSubjectTimePreferences(preferences).filter((item) => item.subjectCode === section.subjectCode);
  if (!rules.length) return false;

  return rules.some((rule) =>
    !section.meetings.some((meeting) => meeting.start === rule.start && meeting.end === rule.end)
  );
}

function violatesPreferences(section: ClassSection, preferences: SchedulePreferences): boolean {
  const meetings = section.meetings;
  const blockedDays = new Set([...(preferences.blockedDays ?? []), ...(preferences.noFriday ? ["FRI" as const] : [])]);
  if (violatesSubjectTimePreference(section, preferences)) return true;
  if (meetings.some((meeting) => blockedDays.has(meeting.day))) return true;
  if (preferences.earliestTime !== undefined && meetings.some((meeting) => meeting.start < preferences.earliestTime!)) return true;
  if (preferences.latestTime !== undefined && meetings.some((meeting) => meeting.end > preferences.latestTime!)) return true;
  if (activeBreaks(preferences).some((item) => meetings.some((meeting) => meeting.start < item.end && item.start < meeting.end))) {
    return true;
  }
  return false;
}

function exceedsDailyLimit(sections: ClassSection[], preferences: SchedulePreferences): boolean {
  if (!preferences.maxClassesPerDay) return false;
  const counts = new Map<string, number>();
  sections.forEach((section) => {
    section.meetings.forEach((meeting) => counts.set(meeting.day, (counts.get(meeting.day) ?? 0) + 1));
  });
  return Array.from(counts.values()).some((count) => count > preferences.maxClassesPerDay!);
}

function conflictsWithExisting(section: ClassSection, selected: ClassSection[]): boolean {
  return selected.some((existing) => meetingsOverlap(section.meetings, existing.meetings));
}

export function generateSchedules(
  sections: ClassSection[],
  selectedSubjects: string[],
  preferences: SchedulePreferences,
  preferredSections: Record<string, string | undefined> = {},
  lockedSections: ClassSection[] = [],
  selectedSectionIds: SelectedSectionIds = {}
): GeneratedSchedule[] {
  const bySubject = selectedSubjects.map((subject) => ({
    subject,
    sections: sections
      .filter((section) => section.subjectCode === subject)
      .filter((section) => !selectedSectionIds[subject]?.length || selectedSectionIds[subject].includes(section.id))
      .filter((section) => !preferredSections[subject] || section.section === preferredSections[subject])
      .filter((section) => !violatesPreferences(section, preferences))
      .sort((a, b) => (a.section ?? "").localeCompare(b.section ?? ""))
  }));

  if (bySubject.some((entry) => entry.sections.length === 0)) return [];

  bySubject.sort((a, b) => a.sections.length - b.sections.length || a.subject.localeCompare(b.subject));

  const results: GeneratedSchedule[] = [];

  function backtrack(index: number, selected: ClassSection[]) {
    if (results.length >= MAX_RESULTS) return;
    if (index === bySubject.length) {
      if (!exceedsDailyLimit(selected, preferences)) {
        results.push({
          sections: [...selected].sort((a, b) => a.subjectCode.localeCompare(b.subjectCode)),
          score: scoreSchedule(selected, preferences),
          warnings: []
        });
      }
      return;
    }

    bySubject[index].sections.forEach((section) => {
      const next = [...selected, section];
      if (conflictsWithExisting(section, selected)) return;
      if (conflictsWithExisting(section, lockedSections)) return;
      if (exceedsDailyLimit([...lockedSections, ...next], preferences)) return;
      backtrack(index + 1, next);
    });
  }

  backtrack(0, []);

  return results.sort((a, b) => a.score - b.score || signature(a).localeCompare(signature(b)));
}

function signature(schedule: GeneratedSchedule): string {
  return schedule.sections.map((section) => `${section.subjectCode}-${section.section ?? ""}`).join("|");
}

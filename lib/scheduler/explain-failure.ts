import type { ClassSection, NoSolutionReason, SchedulePreferences } from "@/types/schedule";
import { formatMinutes, meetingsOverlap } from "@/lib/scheduler/time";

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

export function explainFailure(
  sections: ClassSection[],
  selectedSubjects: string[],
  preferences: SchedulePreferences
): NoSolutionReason[] {
  const reasons: NoSolutionReason[] = [];
  const blockedDays = new Set([...(preferences.blockedDays ?? []), ...(preferences.noFriday ? ["FRI" as const] : [])]);

  selectedSubjects.forEach((subject) => {
    const subjectSections = sections.filter((section) => section.subjectCode === subject);
    if (subjectSections.length === 0) {
      reasons.push({
        message: `${subject} has no readable sections in the uploaded file.`,
        suggestion: "Check if the subject code appears in the file or remove it from your selection."
      });
      return;
    }

    const blockingSubjectTime = activeSubjectTimePreferences(preferences)
      .filter((item) => item.subjectCode === subject)
      .find((rule) =>
        subjectSections.every((section) =>
          !section.meetings.some((meeting) => meeting.start === rule.start && meeting.end === rule.end)
        )
      );

    if (blockingSubjectTime) {
      reasons.push({
        message: `${subject} has no available section at your preferred time (${formatMinutes(blockingSubjectTime.start)} - ${formatMinutes(blockingSubjectTime.end)}).`,
        suggestion: "Try changing that preferred subject time or choosing more sections for the course."
      });
    }

    if (
      blockedDays.size > 0 &&
      subjectSections.every((section) => section.meetings.some((meeting) => blockedDays.has(meeting.day)))
    ) {
      const days = Array.from(blockedDays).join(", ");
      reasons.push({
        message: `${subject} only has sections on blocked day${blockedDays.size === 1 ? "" : "s"} (${days}).`,
        suggestion: "Try allowing one of those days."
      });
    }

    if (
      preferences.earliestTime !== undefined &&
      subjectSections.every((section) => section.meetings.some((meeting) => meeting.start < preferences.earliestTime!))
    ) {
      reasons.push({
        message: `${subject} has sections earlier than your earliest class time.`,
        suggestion: "Try moving your earliest class time earlier."
      });
    }

    if (
      preferences.latestTime !== undefined &&
      subjectSections.every((section) => section.meetings.some((meeting) => meeting.end > preferences.latestTime!))
    ) {
      reasons.push({
        message: `${subject} has sections later than your latest class time.`,
        suggestion: "Try extending your latest class time."
      });
    }

    const blockingBreak = activeBreaks(preferences).find((breakWindow) =>
      subjectSections.every((section) =>
        section.meetings.some((meeting) => meeting.start < breakWindow.end && breakWindow.start < meeting.end)
      )
    );

    if (blockingBreak) {
      reasons.push({
        message: `${subject} only has sections that overlap your protected break (${formatMinutes(blockingBreak.start)} - ${formatMinutes(blockingBreak.end)}).`,
        suggestion: "Try shortening or removing that break window."
      });
    }
  });

  for (let i = 0; i < selectedSubjects.length; i += 1) {
    for (let j = i + 1; j < selectedSubjects.length; j += 1) {
      const left = sections.filter((section) => section.subjectCode === selectedSubjects[i]);
      const right = sections.filter((section) => section.subjectCode === selectedSubjects[j]);
      if (left.length && right.length && left.every((a) => right.every((b) => meetingsOverlap(a.meetings, b.meetings)))) {
        reasons.push({
          message: `${selectedSubjects[i]} conflicts with ${selectedSubjects[j]} across all available section combinations.`,
          suggestion: "Try removing one subject or changing your selected electives."
        });
      }
    }
  }

  if (reasons.length === 0) {
    reasons.push({
      message: "The selected subjects cannot fit together under the current preferences.",
      suggestion: "Try relaxing one preference or selecting fewer subjects."
    });
  }

  return reasons.slice(0, 4);
}

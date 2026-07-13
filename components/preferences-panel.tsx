"use client";

import { Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SchedulePreferences, SubjectOption, Weekday } from "@/types/schedule";
import { DAYS, formatMinutes, parseTimeToMinutes } from "@/lib/scheduler/time";

const TIME_OPTIONS = Array.from({ length: 30 }, (_, index) => 7 * 60 + index * 30);

interface PreferencesPanelProps {
  preferences: SchedulePreferences;
  selectedSubjects: string[];
  subjects: SubjectOption[];
  onChange: (preferences: SchedulePreferences) => void;
}

export function PreferencesPanel({ preferences, selectedSubjects, subjects, onChange }: PreferencesPanelProps) {
  const blockedDays = new Set(preferences.blockedDays ?? []);
  const subjectTimePreferences = preferences.subjectTimePreferences ?? [];
  const selectedSubjectSet = new Set(selectedSubjects);
  const subjectOptions = [...subjects].sort((a, b) => {
    const selectedDelta = Number(selectedSubjectSet.has(b.code)) - Number(selectedSubjectSet.has(a.code));
    return selectedDelta || a.code.localeCompare(b.code);
  });
  const breakWindows = preferences.breaks?.length
    ? preferences.breaks
    : preferences.breakStart !== undefined && preferences.breakEnd !== undefined
      ? [{ id: "legacy-lunch", start: preferences.breakStart, end: preferences.breakEnd }]
      : [];

  function update(patch: Partial<SchedulePreferences>) {
    onChange({ ...preferences, ...patch });
  }

  function updateBreak(id: string, patch: { start?: number; end?: number }) {
    update({
      breaks: breakWindows.map((item) => (item.id === id ? { ...item, ...patch } : item))
    });
  }

  function addBreak() {
    update({
      protectBreak: true,
      breaks: [
        ...breakWindows,
        {
          id: `break-${Date.now()}`,
          start: parseTimeToMinutes("12:00 PM") ?? 720,
          end: parseTimeToMinutes("1:00 PM") ?? 780
        }
      ]
    });
  }

  function removeBreak(id: string) {
    const nextBreaks = breakWindows.filter((item) => item.id !== id);
    update({
      breaks: nextBreaks,
      protectBreak: nextBreaks.length > 0 ? preferences.protectBreak : false
    });
  }

  function addSubjectTimePreference() {
    const subjectCode = selectedSubjects[0] ?? subjectOptions[0]?.code;
    if (!subjectCode) return;

    update({
      subjectTimePreferences: [
        ...subjectTimePreferences,
        {
          id: `subject-time-${Date.now()}`,
          subjectCode,
          start: parseTimeToMinutes("1:30 PM") ?? 810,
          end: parseTimeToMinutes("3:00 PM") ?? 900
        }
      ]
    });
  }

  function updateSubjectTimePreference(
    id: string,
    patch: { subjectCode?: string; start?: number; end?: number }
  ) {
    update({
      subjectTimePreferences: subjectTimePreferences.map((item) =>
        item.id === id ? { ...item, ...patch } : item
      )
    });
  }

  function removeSubjectTimePreference(id: string) {
    update({
      subjectTimePreferences: subjectTimePreferences.filter((item) => item.id !== id)
    });
  }

  function toggleBlockedDay(day: Weekday, checked: boolean) {
    const next = new Set(blockedDays);
    if (checked) {
      next.add(day);
    } else {
      next.delete(day);
    }

    update({
      blockedDays: Array.from(next),
      noFriday: next.has("FRI")
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-5 w-5 text-foreground" />
          <div>
            <CardTitle>Preferences</CardTitle>
            <CardDescription>Optional filters for a better fit.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-white/60 p-3 dark:bg-[#050505]/90">
          <div className="text-sm font-medium">Days without class</div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {DAYS.map((day) => (
              <label key={day} className="flex cursor-pointer items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm dark:bg-[#050505]">
                <Checkbox
                  checked={blockedDays.has(day) || (day === "FRI" && preferences.noFriday)}
                  onCheckedChange={(checked) => toggleBlockedDay(day, checked === true)}
                />
                {day}
              </label>
            ))}
          </div>
        </div>

        <label className="flex items-center gap-3 rounded-xl border bg-white/60 p-3 dark:bg-[#050505]/90">
          <Checkbox checked={preferences.preferCompact} onCheckedChange={(checked) => update({ preferCompact: checked === true })} />
          <span className="text-sm font-medium">Prefer compact schedule</span>
        </label>

        <div className="rounded-xl border bg-white/60 p-3 dark:bg-[#050505]/90">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium">Preferred subject times</div>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                Require a course to use a specific time window when generating schedules.
              </p>
            </div>
            <button
              type="button"
              className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl border bg-white/70 px-3 text-sm font-medium hover:bg-secondary disabled:pointer-events-none disabled:opacity-50 dark:bg-[#050505]"
              onClick={addSubjectTimePreference}
              disabled={subjectOptions.length === 0}
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>

          {subjectTimePreferences.length > 0 ? (
            <div className="mt-3 space-y-3">
              {subjectTimePreferences.map((item, index) => (
                <div key={item.id} className="rounded-xl border bg-white/70 p-3 dark:bg-[#050505]">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Rule {index + 1}
                    </span>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground hover:bg-secondary"
                      onClick={() => removeSubjectTimePreference(item.id)}
                      aria-label={`Remove preferred subject time ${index + 1}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1.3fr_1fr_1fr]">
                    <div className="space-y-2">
                      <Label>Course</Label>
                      <Select
                        value={item.subjectCode}
                        onValueChange={(value) => updateSubjectTimePreference(item.id, { subjectCode: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose course" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjectOptions.map((subject) => (
                            <SelectItem key={subject.code} value={subject.code}>
                              {subject.code}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Starts</Label>
                      <TimeSelect
                        placeholder="1:30 PM"
                        value={item.start}
                        onChange={(value) => value !== undefined && updateSubjectTimePreference(item.id, { start: value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Ends</Label>
                      <TimeSelect
                        placeholder="3:00 PM"
                        value={item.end}
                        onChange={(value) => value !== undefined && updateSubjectTimePreference(item.id, { end: value })}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border bg-white/60 p-3 dark:bg-[#050505]/90">
          <label className="flex items-center gap-3">
            <Checkbox
              checked={preferences.protectBreak}
              onCheckedChange={(checked) =>
                update({
                  protectBreak: checked === true,
                  breaks: breakWindows.length
                    ? breakWindows
                    : [
                        {
                          id: `break-${Date.now()}`,
                          start: parseTimeToMinutes("12:00 PM") ?? 720,
                          end: parseTimeToMinutes("1:00 PM") ?? 780
                        }
                      ]
                })
              }
            />
            <span className="text-sm font-medium">Keep vacant break times</span>
          </label>

          <div className="mt-3 space-y-3">
            {breakWindows.map((breakWindow, index) => (
              <div key={breakWindow.id} className="rounded-xl border bg-white/70 p-3 dark:bg-[#050505]">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Break {index + 1}</span>
                  <button
                    type="button"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border text-muted-foreground hover:bg-secondary"
                    onClick={() => removeBreak(breakWindow.id)}
                    aria-label={`Remove break ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Starts</Label>
                    <TimeSelect
                      placeholder="12:00 PM"
                      value={breakWindow.start}
                      onChange={(value) => value !== undefined && updateBreak(breakWindow.id, { start: value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ends</Label>
                    <TimeSelect
                      placeholder="1:00 PM"
                      value={breakWindow.end}
                      onChange={(value) => value !== undefined && updateBreak(breakWindow.id, { end: value })}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border bg-white/70 text-sm font-medium hover:bg-secondary dark:bg-[#050505]"
              onClick={addBreak}
            >
              <Plus className="h-4 w-4" />
              Add break
            </button>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            When enabled, SchedAI avoids classes that overlap any listed break on any day.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Earliest class</Label>
            <TimeSelect
              placeholder="Any"
              value={preferences.earliestTime}
              onChange={(value) => update({ earliestTime: value })}
            />
          </div>
          <div className="space-y-2">
            <Label>Latest class</Label>
            <TimeSelect
              placeholder="Any"
              value={preferences.latestTime}
              onChange={(value) => update({ latestTime: value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Max classes per day</Label>
          <Select
            value={preferences.maxClassesPerDay?.toString() ?? "any"}
            onValueChange={(value) => update({ maxClassesPerDay: value === "any" ? undefined : Number(value) })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {[1, 2, 3, 4, 5].map((count) => (
                <SelectItem key={count} value={count.toString()}>
                  {count}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

function TimeSelect({
  value,
  onChange,
  placeholder
}: {
  value?: number;
  onChange: (value: number | undefined) => void;
  placeholder: string;
}) {
  return (
    <Select
      value={value?.toString() ?? "any"}
      onValueChange={(next) => onChange(next === "any" ? undefined : Number(next))}
    >
      <SelectTrigger>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="any">Any</SelectItem>
        {TIME_OPTIONS.map((time) => (
          <SelectItem key={time} value={String(time)}>
            {formatMinutes(time)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

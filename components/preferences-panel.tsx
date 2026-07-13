"use client";

import { Plus, SlidersHorizontal, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SchedulePreferences, Weekday } from "@/types/schedule";
import { DAYS, formatMinutes, parseTimeToMinutes } from "@/lib/scheduler/time";

const TIME_OPTIONS = Array.from({ length: 30 }, (_, index) => 7 * 60 + index * 30);

interface PreferencesPanelProps {
  preferences: SchedulePreferences;
  onChange: (preferences: SchedulePreferences) => void;
}

export function PreferencesPanel({ preferences, onChange }: PreferencesPanelProps) {
  const blockedDays = new Set(preferences.blockedDays ?? []);
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

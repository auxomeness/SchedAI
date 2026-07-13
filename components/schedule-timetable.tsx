import { forwardRef } from "react";
import type { ClassSection, GeneratedSchedule, Meeting } from "@/types/schedule";
import { DAYS, formatMinutes } from "@/lib/scheduler/time";
import { ScheduleCard } from "@/components/schedule-card";
import { cn } from "@/lib/utils";

const COLORS = [
  "bg-sky-100 text-sky-950 border-sky-200",
  "bg-emerald-100 text-emerald-950 border-emerald-200",
  "bg-amber-100 text-amber-950 border-amber-200",
  "bg-rose-100 text-rose-950 border-rose-200",
  "bg-indigo-100 text-indigo-950 border-indigo-200",
  "bg-teal-100 text-teal-950 border-teal-200",
  "bg-stone-100 text-stone-950 border-stone-200"
];

interface ScheduleTimetableProps {
  schedule: GeneratedSchedule;
  frozenSchedules?: GeneratedSchedule[];
  onEditSection?: (section: ClassSection, frozen: boolean) => void;
}

type TimetableEntry = {
  section: ClassSection;
  meeting: Meeting;
  frozen: boolean;
};

export const ScheduleTimetable = forwardRef<HTMLDivElement, ScheduleTimetableProps>(function ScheduleTimetable(
  { schedule, frozenSchedules = [], onEditSection },
  ref
) {
  const frozenSections = frozenSchedules.flatMap((item) => item.sections);
  const entries: TimetableEntry[] = [
    ...frozenSections.flatMap((section) => section.meetings.map((meeting) => ({ section, meeting, frozen: true }))),
    ...schedule.sections.flatMap((section) => section.meetings.map((meeting) => ({ section, meeting, frozen: false })))
  ];
  const meetings = entries;
  const visibleDays = DAYS.filter((day) => meetings.some(({ meeting }) => meeting.day === day));
  if (entries.length === 0 || visibleDays.length === 0) return null;
  const start = Math.max(6 * 60, Math.floor(Math.min(...meetings.map(({ meeting }) => meeting.start)) / 30) * 30);
  const end = Math.min(22 * 60, Math.ceil(Math.max(...meetings.map(({ meeting }) => meeting.end)) / 30) * 30);
  const timeRows = Array.from({ length: (end - start) / 30 + 1 }, (_, index) => start + index * 30);
  const totalMinutes = end - start;
  const gridTemplateColumns = `72px repeat(${visibleDays.length}, minmax(120px, 1fr))`;
  const minWidth = Math.max(520, 72 + visibleDays.length * 120);

  return (
    <div className="overflow-x-auto rounded-2xl border bg-white dark:border-white/10 dark:bg-black">
      <div ref={ref} className="bg-white dark:bg-black" style={{ minWidth }}>
        <div className="grid border-b bg-secondary/70 dark:border-white/10 dark:bg-[#050505]" style={{ gridTemplateColumns }}>
          <div className="p-3 text-xs font-medium text-muted-foreground">Time</div>
          {visibleDays.map((day) => (
            <div key={day} className="border-l p-3 text-center text-xs font-semibold">
              {day}
            </div>
          ))}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns, height: Math.max(560, (totalMinutes / 60) * 84) }}>
          <div className="relative border-r bg-secondary/30 dark:border-white/10 dark:bg-[#050505]/80">
            {timeRows.map((time) => (
              <div
                key={time}
                className="absolute left-0 right-0 border-t px-2 pt-1 text-[11px] leading-tight text-muted-foreground"
                style={{ top: `${((time - start) / totalMinutes) * 100}%` }}
              >
                {formatMinutes(time)}
              </div>
            ))}
          </div>
          {visibleDays.map((day) => (
            <div key={day} className="relative border-l dark:border-white/10">
              {timeRows.map((time) => (
                <div
                  key={time}
                  className={cn("absolute left-0 right-0 border-t", time % 60 === 0 ? "border-border" : "border-dashed border-border/70")}
                  style={{ top: `${((time - start) / totalMinutes) * 100}%` }}
                />
              ))}
              {meetings
                .filter(({ meeting }) => meeting.day === day)
                .map(({ section, meeting, frozen }, index) => (
                  <ClassBlock
                    key={`${section.id}-${meeting.day}-${meeting.start}-${meeting.end}`}
                    color={frozen ? "bg-slate-100 text-slate-700 border-slate-300 dark:bg-[#111111] dark:text-white/85 dark:border-white/15" : COLORS[schedule.sections.findIndex((item) => item.id === section.id) % COLORS.length]}
                    meeting={meeting}
                    min={start}
                    total={totalMinutes}
                    section={section}
                    frozen={frozen}
                    offset={index}
                    onEdit={onEditSection}
                  />
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

function ClassBlock({
  section,
  meeting,
  min,
  total,
  color,
  frozen,
  onEdit
}: {
  section: GeneratedSchedule["sections"][number];
  meeting: Meeting;
  min: number;
  total: number;
  color: string;
  frozen: boolean;
  offset: number;
  onEdit?: (section: ClassSection, frozen: boolean) => void;
}) {
  const top = ((meeting.start - min) / total) * 100;
  const height = ((meeting.end - meeting.start) / total) * 100;

  return (
    <button
      type="button"
      className={cn(
        "absolute left-2 right-2 overflow-hidden rounded-xl border p-2 text-left shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        onEdit ? "cursor-pointer hover:brightness-[0.98]" : "cursor-default",
        color
      )}
      style={{ top: `calc(${top}% + 4px)`, height: `calc(${height}% - 8px)` }}
      onClick={() => onEdit?.(section, frozen)}
      aria-label={`Edit ${section.subjectCode} details`}
    >
      {frozen ? <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">Frozen</div> : null}
      <ScheduleCard section={section} />
    </button>
  );
}

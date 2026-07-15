import { forwardRef, type CSSProperties } from "react";
import type { ClassSection, GeneratedSchedule, Meeting } from "@/types/schedule";
import { DAYS, formatMinutes } from "@/lib/scheduler/time";
import { ScheduleCard } from "@/components/schedule-card";
import { cn } from "@/lib/utils";

const COLORS = [
  "#dbeafe",
  "#d1fae5",
  "#fef3c7",
  "#ffe4e6",
  "#e0e7ff",
  "#ccfbf1",
  "#f5f5f4"
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
    <div className="overflow-x-auto rounded-2xl border bg-white dark:border-white/10 dark:bg-[#111318]">
      <div ref={ref} className="bg-white dark:bg-[#111318]" style={{ minWidth }}>
        <div className="grid border-b bg-secondary/70 dark:border-white/10 dark:bg-[#161a22]" style={{ gridTemplateColumns }}>
          <div className="p-3 text-xs font-medium text-muted-foreground">Time</div>
          {visibleDays.map((day) => (
            <div key={day} className="border-l p-3 text-center text-xs font-semibold">
              {day}
            </div>
          ))}
        </div>
        <div className="relative grid" style={{ gridTemplateColumns, height: Math.max(560, (totalMinutes / 60) * 84) }}>
          <div className="relative border-r bg-secondary/30 dark:border-white/10 dark:bg-[#161a22]/80">
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
                .map(({ section, meeting, frozen }, index) => {
                  const paletteColor = COLORS[schedule.sections.findIndex((item) => item.id === section.id) % COLORS.length];
                  const blockColor = frozen ? "#f1f5f9" : normalizeHexColor(section.color) ?? paletteColor;
                  return (
                  <ClassBlock
                    key={`${section.id}-${meeting.day}-${meeting.start}-${meeting.end}`}
                    colorStyle={buildBlockStyle(blockColor, frozen)}
                    meeting={meeting}
                    min={start}
                    total={totalMinutes}
                    section={section}
                    frozen={frozen}
                    offset={index}
                    onEdit={onEditSection}
                  />
                  );
                })}
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
  colorStyle,
  frozen,
  onEdit
}: {
  section: GeneratedSchedule["sections"][number];
  meeting: Meeting;
  min: number;
  total: number;
  colorStyle: CSSProperties;
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
        frozen && "dark:border-white/15"
      )}
      style={{ top: `calc(${top}% + 4px)`, height: `calc(${height}% - 8px)`, ...colorStyle }}
      onClick={() => onEdit?.(section, frozen)}
      aria-label={`Edit ${section.subjectCode} details`}
    >
      {frozen ? <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">Frozen</div> : null}
      <ScheduleCard section={section} />
    </button>
  );
}

function normalizeHexColor(value?: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : undefined;
}

function buildBlockStyle(backgroundColor: string, frozen: boolean): CSSProperties {
  const textColor = readableTextColor(backgroundColor);
  return {
    backgroundColor: frozen ? "hsl(var(--secondary))" : backgroundColor,
    borderColor: frozen ? "hsl(var(--border))" : mixWithBlack(backgroundColor, 0.08),
    color: frozen ? "hsl(var(--secondary-foreground))" : textColor
  };
}

function readableTextColor(hex: string) {
  const normalized = normalizeHexColor(hex) ?? "#dbeafe";
  const red = Number.parseInt(normalized.slice(1, 3), 16);
  const green = Number.parseInt(normalized.slice(3, 5), 16);
  const blue = Number.parseInt(normalized.slice(5, 7), 16);
  const brightness = (red * 299 + green * 587 + blue * 114) / 1000;
  return brightness > 146 ? "#0f172a" : "#f8fafc";
}

function mixWithBlack(hex: string, amount: number) {
  const normalized = normalizeHexColor(hex) ?? "#dbeafe";
  const channels = [normalized.slice(1, 3), normalized.slice(3, 5), normalized.slice(5, 7)].map((part) =>
    Math.max(0, Math.round(Number.parseInt(part, 16) * (1 - amount)))
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

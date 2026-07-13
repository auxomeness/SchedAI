import type { ClassSection } from "@/types/schedule";
import { formatMinutes } from "@/lib/scheduler/time";

interface ScheduleCardProps {
  section: ClassSection;
}

export function ScheduleCard({ section }: ScheduleCardProps) {
  const first = section.meetings[0];
  return (
    <div className="space-y-1">
      <div className="text-xs font-semibold">{section.subjectCode}</div>
      {section.section ? <div className="text-[11px] opacity-90">{section.section}</div> : null}
      {first ? (
        <div className="text-[11px] opacity-90">
          {formatMinutes(first.start)} - {formatMinutes(first.end)}
        </div>
      ) : null}
      {section.professor ? <div className="truncate text-[11px] opacity-90">{section.professor}</div> : null}
      {section.room ? <div className="truncate text-[11px] opacity-90">{section.room}</div> : null}
    </div>
  );
}

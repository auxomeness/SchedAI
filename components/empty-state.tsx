import { CalendarDays } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed bg-white/70 p-8 text-center dark:bg-[#151820]/90">
      <CalendarDays className="mb-4 h-8 w-8 text-foreground" />
      <h2 className="text-xl font-semibold">Your weekly schedule will appear here</h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Upload a schedule file, choose your subjects, set any preferences, then generate a conflict-free timetable.
      </p>
    </div>
  );
}

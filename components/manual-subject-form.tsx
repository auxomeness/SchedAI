"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ClassSection, Meeting, Weekday } from "@/types/schedule";
import { DAYS, formatMinutes } from "@/lib/scheduler/time";

const TIME_OPTIONS = Array.from({ length: 30 }, (_, index) => 7 * 60 + index * 30);

interface ManualSubjectFormProps {
  onAdd: (section: ClassSection) => void;
}

interface MeetingDraft {
  id: string;
  day: Weekday;
  start: number;
  end: number;
}

const DEFAULT_MEETING: Omit<MeetingDraft, "id"> = {
  day: "MON",
  start: 9 * 60,
  end: 10 * 60 + 30
};

export function ManualSubjectForm({ onAdd }: ManualSubjectFormProps) {
  const [courseCode, setCourseCode] = useState("");
  const [courseName, setCourseName] = useState("");
  const [section, setSection] = useState("");
  const [professor, setProfessor] = useState("");
  const [meetings, setMeetings] = useState<MeetingDraft[]>([{ ...DEFAULT_MEETING, id: "meeting-1" }]);
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => {
    return Boolean(courseCode.trim() && courseName.trim() && meetings.length && meetings.every((meeting) => meeting.end > meeting.start));
  }, [courseCode, courseName, meetings]);

  function updateMeeting(id: string, patch: Partial<MeetingDraft>) {
    setMeetings((existing) => existing.map((meeting) => (meeting.id === id ? { ...meeting, ...patch } : meeting)));
  }

  function addMeeting() {
    setMeetings((existing) => [...existing, { ...DEFAULT_MEETING, id: `meeting-${Date.now()}` }]);
  }

  function removeMeeting(id: string) {
    setMeetings((existing) => existing.filter((meeting) => meeting.id !== id));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) {
      setMessage("Enter a course code, course name, and valid meeting time.");
      return;
    }

    const normalizedCode = courseCode.trim().toUpperCase();
    const normalizedMeetings: Meeting[] = meetings.map(({ day, start, end }) => ({ day, start, end }));
    onAdd({
      id: `manual-${normalizedCode}-${section.trim() || "section"}-${Date.now()}`.replace(/\s+/g, "-"),
      subjectCode: normalizedCode,
      subjectName: courseName.trim(),
      section: section.trim() || undefined,
      professor: professor.trim() || undefined,
      meetings: normalizedMeetings
    });

    setCourseCode("");
    setCourseName("");
    setSection("");
    setProfessor("");
    setMeetings([{ ...DEFAULT_MEETING, id: `meeting-${Date.now()}` }]);
    setMessage("Subject added.");
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <UserPlus className="h-5 w-5 text-foreground" />
          <div>
            <CardTitle>Add subject manually</CardTitle>
            <CardDescription>Create a section when it is missing from the file.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="manual-course-code">Course code</Label>
              <Input id="manual-course-code" value={courseCode} onChange={(event) => setCourseCode(event.target.value)} placeholder="COURSE101" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="manual-section">Section</Label>
              <Input id="manual-section" value={section} onChange={(event) => setSection(event.target.value)} placeholder="Optional" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-course-name">Course name</Label>
            <Input id="manual-course-name" value={courseName} onChange={(event) => setCourseName(event.target.value)} placeholder="Sample Course Title" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-professor">Professor</Label>
            <Input id="manual-professor" value={professor} onChange={(event) => setProfessor(event.target.value)} placeholder="Optional" />
          </div>

          <div className="rounded-xl border bg-white/60 p-3 dark:bg-[#151820]/90">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="text-sm font-medium">Date and time</div>
              <Button type="button" size="sm" variant="outline" onClick={addMeeting}>
                <Plus className="h-4 w-4" />
                Add schedule
              </Button>
            </div>

            <div className="space-y-3">
              {meetings.map((meeting, index) => (
                <div key={meeting.id} className="grid gap-2 rounded-xl border bg-white p-2 dark:bg-[#171b24] sm:grid-cols-[1fr_1fr_1fr_auto]">
                  <Select value={meeting.day} onValueChange={(value) => updateMeeting(meeting.id, { day: value as Weekday })}>
                    <SelectTrigger aria-label={`Meeting ${index + 1} day`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day) => (
                        <SelectItem key={day} value={day}>
                          {day}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <TimeSelect value={meeting.start} onChange={(value) => updateMeeting(meeting.id, { start: value })} label={`Meeting ${index + 1} start`} />
                  <TimeSelect value={meeting.end} onChange={(value) => updateMeeting(meeting.id, { end: value })} label={`Meeting ${index + 1} end`} />

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-10"
                    disabled={meetings.length === 1}
                    onClick={() => removeMeeting(meeting.id)}
                    aria-label={`Remove meeting ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}

          <Button type="submit" variant="outline" className="w-full" disabled={!canSubmit}>
            <Plus className="h-4 w-4" />
            Add subject
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function TimeSelect({ value, onChange, label }: { value: number; onChange: (value: number) => void; label: string }) {
  return (
    <Select value={String(value)} onValueChange={(next) => onChange(Number(next))}>
      <SelectTrigger aria-label={label}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {TIME_OPTIONS.map((time) => (
          <SelectItem key={time} value={String(time)}>
            {formatMinutes(time)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

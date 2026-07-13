export type Weekday = "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN";

export interface Meeting {
  day: Weekday;
  start: number;
  end: number;
}

export interface ClassSection {
  id: string;
  subjectCode: string;
  subjectName: string;
  section?: string;
  professor?: string;
  room?: string;
  meetings: Meeting[];
}

export interface SubjectOption {
  code: string;
  name: string;
  sectionCount: number;
}

export type SelectedSectionIds = Record<string, string[]>;

export interface SchedulePreferences {
  noFriday: boolean;
  blockedDays: Weekday[];
  earliestTime?: number;
  latestTime?: number;
  protectBreak: boolean;
  breaks: BreakWindow[];
  breakStart?: number;
  breakEnd?: number;
  maxClassesPerDay?: number;
  preferCompact: boolean;
}

export interface BreakWindow {
  id: string;
  start: number;
  end: number;
}

export interface GeneratedSchedule {
  sections: ClassSection[];
  score: number;
  warnings: string[];
}

export interface NoSolutionReason {
  message: string;
  suggestion: string;
}

export interface ParseResult {
  sections: ClassSection[];
  subjects: SubjectOption[];
}

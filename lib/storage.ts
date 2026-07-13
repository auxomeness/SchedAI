import type { ClassSection, GeneratedSchedule, SchedulePreferences, SelectedSectionIds } from "@/types/schedule";

const OLD_STORAGE_KEY = "schedai-state-v1";
const PREFERENCES_KEY = "schedai-preferences-v1";
const SESSION_KEY = "schedai-session-v2";
const THEME_KEY = "schedai-theme-v1";

export interface StoredSession {
  sections: ClassSection[];
  selectedSubjects: string[];
  preferredSections: Record<string, string | undefined>;
  selectedSectionIds?: SelectedSectionIds;
  preferences: SchedulePreferences;
  schedules: GeneratedSchedule[];
  frozenSchedules: GeneratedSchedule[];
  scheduleIndex: number;
  fileName?: string;
  isDarkMode: boolean;
}

export function loadStoredPreferences(): SchedulePreferences | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    window.localStorage.removeItem(OLD_STORAGE_KEY);
    const raw = window.localStorage.getItem(PREFERENCES_KEY);
    return raw ? (JSON.parse(raw) as SchedulePreferences) : undefined;
  } catch {
    return undefined;
  }
}

export function saveStoredPreferences(preferences: SchedulePreferences) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function loadStoredSession(): StoredSession | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    window.localStorage.removeItem(OLD_STORAGE_KEY);
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoredSession) : undefined;
  } catch {
    return undefined;
  }
}

export function saveStoredSession(session: StoredSession) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(session.preferences));
  window.localStorage.setItem(THEME_KEY, session.isDarkMode ? "dark" : "light");
}

export function clearStoredSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
  window.localStorage.removeItem(PREFERENCES_KEY);
  window.localStorage.removeItem(OLD_STORAGE_KEY);
}

export function loadStoredTheme(): boolean | undefined {
  if (typeof window === "undefined") return undefined;
  const theme = window.localStorage.getItem(THEME_KEY);
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return undefined;
}

export function saveStoredTheme(isDarkMode: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(THEME_KEY, isDarkMode ? "dark" : "light");
}

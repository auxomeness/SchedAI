"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { loadStoredTheme, saveStoredTheme } from "@/lib/storage";

interface ThemeToggleProps {
  className?: string;
}

export function ThemeToggle({ className }: ThemeToggleProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const storedTheme = loadStoredTheme();
    const nextTheme = storedTheme ?? document.documentElement.classList.contains("dark");
    setIsDarkMode(nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme);
  }, []);

  function toggleTheme() {
    setIsDarkMode((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      saveStoredTheme(next);
      return next;
    });
  }

  return (
    <Button type="button" variant="secondary" className={className} onClick={toggleTheme}>
      {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      {isDarkMode ? "Light" : "Dark"}
    </Button>
  );
}

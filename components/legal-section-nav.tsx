"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface LegalSectionNavProps {
  sections: Array<{
    id: string;
    title: string;
  }>;
}

export function LegalSectionNav({ sections }: LegalSectionNavProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visible?.target.id) setActiveId(visible.target.id);
      },
      {
        rootMargin: "-20% 0px -55% 0px",
        threshold: [0.1, 0.25, 0.5]
      }
    );

    sections.forEach((section) => {
      const element = document.getElementById(section.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [sections]);

  return (
    <aside className="lg:sticky lg:top-8 lg:h-fit">
      <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Sections</p>
      <nav className="mt-5 grid gap-2">
        {sections.map((section) => {
          const isActive = activeId === section.id;

          return (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={cn(
                "rounded-xl border-l-4 border-transparent px-3 py-2 text-base font-extrabold leading-snug text-muted-foreground transition-colors hover:bg-secondary/70 hover:text-foreground",
                isActive && "border-foreground bg-secondary text-foreground shadow-sm"
              )}
            >
              {section.title}
            </a>
          );
        })}
      </nav>
    </aside>
  );
}

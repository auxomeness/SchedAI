import Link from "next/link";
import { LegalSectionNav } from "@/components/legal-section-nav";

interface LegalSection {
  id: string;
  title: string;
  body: string[];
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  intro: string;
  documentTitle: string;
  documentSummary: string;
  sections: LegalSection[];
}

export function LegalPage({ eyebrow, title, intro, documentTitle, documentSummary, sections }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-white/80 backdrop-blur-xl dark:bg-black/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="inline-flex items-baseline gap-1 text-2xl font-extrabold tracking-tight">
            <span>SchedAI</span>
            <span className="font-normal text-muted-foreground">by Arxeni</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-semibold text-muted-foreground">
            <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link href="/terms" className="hover:text-foreground">Terms</Link>
            <Link href="/" className="hover:text-foreground">Workspace</Link>
          </nav>
        </div>
      </header>

      <section className="border-b bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.20),transparent_34rem)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-24 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
            <h1 className="mt-8 max-w-4xl text-6xl font-black tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              {title}
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-muted-foreground">{intro}</p>
            <Link
              href="/"
              className="mt-10 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Back to workspace
            </Link>
          </div>
          <aside className="border-l-4 border-foreground/80 px-6 py-5">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Document</p>
            <h2 className="mt-3 text-xl font-extrabold">{documentTitle}</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{documentSummary}</p>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[300px_1fr]">
        <LegalSectionNav sections={sections.map(({ id, title }) => ({ id, title }))} />

        <div className="divide-y">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="grid gap-8 py-10 first:pt-0 lg:grid-cols-[300px_1fr]">
              <h2 className="text-3xl font-black tracking-tight">{section.title}</h2>
              <div className="space-y-5 text-base leading-8 text-muted-foreground">
                {section.body.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

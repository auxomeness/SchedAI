import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileSpreadsheet, FileText, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Imports | SchedAI",
  description: "SchedAI import guide and downloadable schedule file templates."
};

const columns = ["Subject Code", "Subject Name", "Section", "Days", "Start Time", "End Time", "Professor", "Room"];

const templateDownloads = [
  {
    label: "Excel template",
    href: "/templates/schedai-import-template.xlsx",
    icon: FileSpreadsheet,
    description: "Best option for editable schedule templates."
  },
  {
    label: "PDF template",
    href: "/templates/schedai-import-template.pdf",
    icon: FileText,
    description: "Text-based PDF example for parser-compatible tables."
  },
  {
    label: "CSV template",
    href: "/templates/schedai-import-template.csv",
    icon: FileText,
    description: "Plain text option for spreadsheet exports."
  }
];

const exampleRow = ["COURSE101", "Sample Course Title", "SEC-A", "MW", "9:00 AM", "10:30 AM", "Professor Name", "Room / Online"];

export default function ImportsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-white/80 backdrop-blur-xl dark:bg-black/80">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="inline-flex items-baseline gap-1 text-2xl font-extrabold tracking-tight">
            <span>SchedAI</span>
            <span className="font-normal text-muted-foreground">by Arxeni</span>
          </Link>
          <nav className="flex items-center gap-6 text-sm font-semibold text-muted-foreground">
            <Link href="/terms" className="hover:text-foreground">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-foreground">
              Privacy
            </Link>
            <Link href="/" className="hover:text-foreground">
              Workspace
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.20),transparent_34rem)]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Imports</p>
            <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Accepted Schedule Files
            </h1>
            <p className="mt-6 max-w-3xl text-xl leading-9 text-muted-foreground">
              SchedAI accepts simple schedule tables from text-based PDFs, CSV files, and Excel workbooks. Use the template if you want a clean file shape to fill in manually.
            </p>
            <Button asChild className="mt-10">
              <Link href="/">
                Back to workspace
              </Link>
            </Button>
          </div>
          <aside className="border-l-4 border-foreground/80 px-6 py-5">
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Template</p>
            <h2 className="mt-3 text-xl font-extrabold">One sample row, nine blank rows</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              The files include placeholder values only. Replace the sample row or fill the empty rows with your own schedule data.
            </p>
          </aside>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[320px_1fr]">
        <aside className="lg:sticky lg:top-8 lg:h-fit">
          <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Download</p>
          <div className="mt-4 grid gap-3">
            {templateDownloads.map(({ label, href, icon: Icon }) => (
              <Button key={href} asChild variant="outline" className="justify-start">
                <a href={href} download>
                  <Icon className="h-4 w-4" />
                  {label}
                </a>
              </Button>
            ))}
          </div>
        </aside>

        <div className="space-y-10">
          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight">Required table shape</h2>
            <p className="mt-3 text-base leading-8 text-muted-foreground">
              Keep one section per row. These column names are the safest format because they map directly to SchedAI's parser.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              {columns.map((column) => (
                <span key={column} className="rounded-full border bg-secondary px-3 py-1 text-sm font-semibold">
                  {column}
                </span>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <Link2 className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-tight">Google links</h2>
            <p className="mt-3 text-base leading-8 text-muted-foreground">
              You can paste a normal Google Sheets or Google Docs link in the workspace. Share the file as "Anyone with the link can view" before importing.
            </p>
            <p className="mt-3 text-base leading-8 text-muted-foreground">
              Google Sheets is recommended because SchedAI can export it as CSV. Google Docs import is beta and works best with a simple text table.
            </p>
          </section>

          <section className="overflow-hidden rounded-2xl border bg-card shadow-sm">
            <div className="border-b p-6">
              <h2 className="text-2xl font-black tracking-tight">Example row</h2>
              <p className="mt-3 text-base leading-8 text-muted-foreground">
                This is placeholder data only. Do not treat it as a real course, section, professor, or room.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] border-collapse text-left text-sm">
                <thead className="bg-foreground text-background">
                  <tr>
                    {columns.map((column) => (
                      <th key={column} className="px-4 py-3 font-bold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    {exampleRow.map((value, index) => (
                      <td key={`${value}-${index}`} className="px-4 py-3 text-muted-foreground">
                        {value}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="grid gap-4 sm:grid-cols-3">
            {templateDownloads.map(({ label, href, icon: Icon, description }) => (
              <a key={href} href={href} download className="rounded-2xl border bg-card p-5 shadow-sm transition-colors hover:bg-secondary">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-extrabold">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
                <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
                  <Download className="h-4 w-4" />
                  Download
                </span>
              </a>
            ))}
          </section>
        </div>
      </section>
    </main>
  );
}

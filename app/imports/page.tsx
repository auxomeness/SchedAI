import type { Metadata } from "next";
import Link from "next/link";
import { Download, FileSpreadsheet, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

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
const googleSheetsTemplateUrl = "https://docs.google.com/spreadsheets/d/1pojtsXh_zfO2HwHBQ09vZ3aORqIXRwWCFztP5HunI8Y/copy";

export default function ImportsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-white/80 backdrop-blur-xl dark:bg-black/80">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-col items-start justify-center gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-0">
          <Link href="/" className="inline-flex items-baseline gap-1 text-2xl font-extrabold tracking-tight">
            <span>SchedAI</span>
            <span className="font-normal text-muted-foreground">by Arxeni</span>
          </Link>
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <nav className="flex flex-wrap items-center gap-4 text-sm font-semibold text-muted-foreground sm:gap-6">
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
            <ThemeToggle className="h-9 px-3" />
          </div>
        </div>
      </header>

      <section className="border-b bg-[radial-gradient(circle_at_top_right,rgba(148,163,184,0.20),transparent_34rem)]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">Imports</p>
            <h1 className="mt-8 max-w-4xl text-4xl font-black tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Accepted Schedule Files
            </h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
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

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-[320px_1fr]">
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
          <section id="imports" className="rounded-2xl border bg-card p-6 shadow-sm">
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

          <section id="google-sheets" className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-tight">Google Sheets guide</h2>
            <p className="mt-3 text-base leading-8 text-muted-foreground">
              Google Sheets is the recommended Google import method because SchedAI can export the sheet as clean CSV data.
            </p>
            <div className="mt-5 grid gap-3 text-sm leading-7 text-muted-foreground">
              <p>1. Click the template button and choose Make a copy.</p>
              <p>2. Keep the first row headers: Subject Code, Subject Name, Section, Days, Start Time, End Time, Professor, Room.</p>
              <p>3. Fill one class section per row. Leave Section, Professor, or Room blank if unknown.</p>
              <p>4. Use day values like MW, TTH, MON, TUE, WED, THU, FRI, or SAT.</p>
              <p>5. Use clear times like 9:00 AM, 10:30 AM, 12:00 PM, 12:00 NN, or 1:30 PM. Use 12:00 PM or 12:00 NN for noon, not 12:00 AM.</p>
              <p>6. Click Share, set access to Anyone with the link can view, then copy the normal Google Sheets URL.</p>
              <p>7. In SchedAI, click Import from Google link and paste that normal URL.</p>
            </div>
            <Button asChild className="mt-6">
              <a href={googleSheetsTemplateUrl} target="_blank" rel="noreferrer">
                <FileSpreadsheet className="h-4 w-4" />
                Make a copy of the Google Sheets template
              </a>
            </Button>
          </section>

          <section id="google-docs" className="rounded-2xl border bg-card p-6 shadow-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary">
              <FileText className="h-5 w-5" />
            </div>
            <h2 className="mt-5 text-2xl font-black tracking-tight">Google Docs guide</h2>
            <p className="mt-3 text-base leading-8 text-muted-foreground">
              Google Docs import is beta. Use it only when you need a document-style schedule. Google Sheets is still more reliable.
            </p>
            <div className="mt-5 grid gap-3 text-sm leading-7 text-muted-foreground">
              <p>1. Open Google Docs and insert a real table with 8 columns.</p>
              <p>2. Put the same headers in the first table row: Subject Code, Subject Name, Section, Days, Start Time, End Time, Professor, Room.</p>
              <p>3. Add one class section per row. Do not paste screenshots or images of a table.</p>
              <p>4. Avoid merged cells, title rows above the header, extra notes inside the table, and wrapped multi-line values when possible.</p>
              <p>5. Use readable day and time values, such as TTH and 11:00 AM to 12:00 PM.</p>
              <p>6. Click Share, set access to Anyone with the link can view, then copy the normal Google Docs URL.</p>
              <p>7. In SchedAI, click Import from Google link and paste that normal URL. If it fails, move the same data into Google Sheets.</p>
            </div>
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

# SchedAI

**Author:** Karl Austin B. Pavia  
**Version:** 0.0.1

SchedAI is a personal schedule generator for university students.

It is not an enrollment system, university portal, or class management platform. It is a guide and planning tool that helps students prepare for enrollment by turning a university-provided schedule file into a clean weekly timetable.

## Purpose

I created SchedAI because planning a university schedule manually can be slow, confusing, and stressful, especially when there are many available sections to compare.

Students often need to avoid schedule conflicts, choose preferred professors, protect break or vacant times, and find the best possible weekly schedule before enrollment. SchedAI makes that process easier by parsing the schedule file, letting the student choose subjects and exact sections, then generating valid schedule combinations automatically.

The goal is to help students plan smarter before finalizing their enrollment.

## What SchedAI Does

- Upload university schedule files
- Supports text-based PDF, CSV, and Excel files
- Parses available subjects and class sections
- Lets students choose subjects
- Lets students choose exact sections, professors, rooms, and time slots
- Generates a conflict-free weekly schedule
- Prevents overlapping classes
- Supports preferences like:
  - days without class
  - earliest class time
  - latest class time
  - max classes per day
  - preferred vacant or break times
  - compact schedules
- Allows generating another valid schedule
- Allows freezing/completing a schedule and creating another one
- Exports schedules as PNG or PDF
- Saves the current session in browser storage
- Supports dark mode

## What SchedAI Is Not

SchedAI is not:

- an official enrollment system
- a university management system
- a student information system
- a replacement for official university registration
- connected to any university database

Always verify the final schedule with the official university enrollment system.

## Access

SchedAI can be run locally during development.

It is also planned to be deployed as a website, so students can access it online without setting up the project locally.

## Tech Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn-style UI components
- Client-side file parsing
- Client-side schedule generation
- Browser local storage

## Privacy

SchedAI processes files in the browser.

Uploaded files, parsed schedules, selected subjects, preferences, and generated schedules are stored in the user's browser storage. There is no account system and no university database connection.

## File Support

Supported formats:

- PDF, text-based only
- CSV
- XLSX / Excel

Scanned image PDFs are not supported.

## Development

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Validate the project:

```bash
npm run typecheck
npm run build
```

## Author

Karl Austin B. Pavia

import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Privacy Policy | SchedAI",
  description: "Privacy Policy for SchedAI."
};

const sections = [
  {
    id: "overview",
    title: "Overview",
    body: [
      "This Privacy Policy explains how SchedAI handles information when you use the application.",
      "SchedAI is designed as a privacy-conscious personal schedule planning tool. Its main features run in the browser and help students parse schedule files, select subjects and sections, and generate possible weekly schedules."
    ]
  },
  {
    id: "provided",
    title: "Information You Provide",
    body: [
      "When using SchedAI, you may provide or generate information such as uploaded university schedule files, parsed subject codes, parsed subject names, class sections, professors, rooms, days and times, selected subjects, selected sections, scheduling preferences, break or vacant time preferences, generated schedules, frozen or completed schedules, and exported PNG or PDF schedules.",
      "You control what files you upload and what schedule information you choose to keep, export, or share."
    ]
  },
  {
    id: "local-processing",
    title: "Local Processing",
    body: [
      "SchedAI is designed to process schedule files in your browser. Uploaded files and generated schedule data are handled on the client side as much as possible.",
      "SchedAI does not require an account system, login, or university database connection."
    ]
  },
  {
    id: "browser-storage",
    title: "Browser Storage",
    body: [
      "SchedAI may store your session data in your browser storage so your work is not lost when you refresh the page. This may include parsed schedules, selected subjects, selected sections, preferences, generated schedule options, frozen or completed schedules, uploaded file name, and dark mode setting.",
      "This data stays in your browser unless you clear it. You can remove saved session data by clicking Reset Session in SchedAI, clearing site data in your browser settings, or using private browsing and closing the session."
    ]
  },
  {
    id: "uploads",
    title: "Uploaded Files",
    body: [
      "SchedAI does not intentionally store uploaded schedule files on an application server. Files are used to extract schedule information for your personal planning.",
      "Because SchedAI may be hosted through a web platform such as Vercel, normal technical requests may still be handled by the hosting provider when you access the website. You should not upload files that contain sensitive personal information unless you are comfortable using them in your browser."
    ]
  },
  {
    id: "accounts",
    title: "No Account System",
    body: [
      "SchedAI does not currently provide user accounts. It does not intentionally collect names, email addresses, passwords, student numbers, official enrollment credentials, payment information, or government IDs.",
      "If future versions add accounts or server-side features, this Privacy Policy should be updated before those features are used."
    ]
  },
  {
    id: "technical-data",
    title: "Technical Data From Hosting",
    body: [
      "When SchedAI is accessed as a website, the hosting provider may automatically process standard technical data needed to deliver the site. This may include IP address, browser type, device type, request time, requested pages or assets, approximate region, and error or performance logs.",
      "This type of data is commonly processed by hosting providers for security, delivery, analytics, caching, abuse prevention, and reliability. SchedAI does not use this data to identify students personally."
    ]
  },
  {
    id: "sale",
    title: "No Sale of Personal Data",
    body: [
      "SchedAI does not sell personal data. It does not use uploaded schedule files or generated schedules for advertising sale, data brokerage, or profiling.",
      "SchedAI is designed for personal academic planning, not advertising or user tracking."
    ]
  },
  {
    id: "third-party",
    title: "Third-Party Services",
    body: [
      "SchedAI may be hosted using third-party infrastructure, such as Vercel. Third-party platforms may process technical data as part of providing hosting, deployment, security, and performance services.",
      "SchedAI may also link to external social profiles such as GitHub, LinkedIn, Facebook, or Instagram. If you click those links, you will leave SchedAI and the privacy practices of those external platforms will apply."
    ]
  },
  {
    id: "exports",
    title: "Exports",
    body: [
      "If you export a schedule as PNG or PDF, the exported file is created for your use. You are responsible for how you store, send, upload, print, or share exported schedules.",
      "SchedAI is not responsible for information you disclose by sharing exported files."
    ]
  },
  {
    id: "retention",
    title: "Data Retention",
    body: [
      "SchedAI session data stored in your browser remains there until you click Reset Session, clear browser storage, your browser removes the data, you use a private browsing session that ends, or future app updates change storage behavior.",
      "SchedAI does not maintain a central user database for schedule sessions."
    ]
  },
  {
    id: "security",
    title: "Security",
    body: [
      "SchedAI is designed to limit data exposure by processing schedule information in the browser where possible. However, no browser application or hosted website can guarantee perfect security.",
      "You should avoid uploading files that contain unnecessary sensitive information."
    ]
  },
  {
    id: "children",
    title: "Children and Students",
    body: [
      "SchedAI is intended for university students and personal academic planning.",
      "If you are under the age required by your local law to use online services independently, use SchedAI only with appropriate permission from a parent, guardian, or authorized adult."
    ]
  },
  {
    id: "choices",
    title: "Your Choices",
    body: [
      "You can control your SchedAI data by choosing what file to upload, removing the attached file, selecting or unselecting subjects and sections, editing preferences, resetting your session, clearing browser storage, not exporting or sharing schedules, or closing the browser tab.",
      "These controls are intended to keep schedule planning simple and under your control."
    ]
  },
  {
    id: "accuracy",
    title: "Accuracy of Parsed Data",
    body: [
      "SchedAI may parse schedule data incorrectly because schedule files can vary in format. Privacy-wise, this means you should review parsed information before exporting or sharing it.",
      "Do not assume the generated schedule is complete or official."
    ]
  },
  {
    id: "future",
    title: "Future Features",
    body: [
      "If SchedAI later adds accounts, analytics, cloud sync, server-side storage, databases, payments, or official integrations, this Privacy Policy should be updated to explain what data is collected, why it is collected, and how it is protected.",
      "Future changes should remain consistent with SchedAI's goal of simple, transparent schedule planning."
    ]
  },
  {
    id: "changes",
    title: "Changes to This Privacy Policy",
    body: [
      "This Privacy Policy may be updated from time to time. When changes are made, the effective date may be updated.",
      "Continued use of SchedAI after changes means you acknowledge the updated policy."
    ]
  },
  {
    id: "contact",
    title: "Contact",
    body: [
      "For privacy questions about SchedAI, contact Karl Austin B. Pavia through Arxeni."
    ]
  }
];

export default function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Privacy"
      title="Privacy Policy"
      intro="This policy explains how SchedAI handles schedule files, browser storage, exports, and technical hosting data while keeping the application focused on personal enrollment planning."
      documentTitle="SchedAI privacy policy"
      documentSummary="Effective July 13, 2026. Covers browser-side processing, local storage, uploaded files, exports, hosting data, and user choices."
      sections={sections}
    />
  );
}

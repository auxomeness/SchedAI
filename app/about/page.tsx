import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";

export const metadata: Metadata = {
  title: "Developer | SchedAI",
  description: "Developer behind SchedAI by Arxeni."
};

const sections = [
  {
    id: "developer",
    title: "Developer",
    body: [
      "SchedAI was created by Karl Austin Pavia, a full-stack developer and UI/UX-focused builder behind Arxeni.",
      "Austin builds practical digital products that simplify complex workflows and turn messy processes into clean, usable experiences. His work combines software engineering, product thinking, and interface design, with a focus on tools that feel simple, fast, and reliable."
    ]
  },
  {
    id: "problem-solving",
    title: "Problem-solving",
    body: [
      "Austin has represented his growth in competitive programming through the ICPC, the International Collegiate Programming Contest, one of the most prestigious programming competitions in the world.",
      "That environment sharpened the same skills SchedAI depends on: precision, algorithmic thinking, careful debugging, and the ability to reason through many possible combinations without losing track of the details."
    ]
  },
  {
    id: "global-hackathons",
    title: "Global hackathons",
    body: [
      "Austin also loves joining global hackathons, where he competes and collaborates with talented builders from different parts of the world.",
      "Those experiences continue to shape how he builds products: move fast, communicate clearly, solve real problems, and create tools that people can actually use."
    ]
  },
  {
    id: "schedai",
    title: "Why SchedAI",
    body: [
      "SchedAI was built from a real student problem: creating a good class schedule often means comparing many sections, professors, rooms, days, and time slots by hand.",
      "Austin designed SchedAI to make that process clearer, faster, and easier to trust by helping students generate schedule options, avoid conflicts, and plan around their preferences before enrollment."
    ]
  },
  {
    id: "arxeni",
    title: "Arxeni",
    body: [
      "Through Arxeni, Austin continues to build polished, useful applications for real-world problems.",
      "The goal is to create products that combine engineering discipline, thoughtful design, and practical value, tools that look clean, work reliably, and solve problems people recognize immediately."
    ]
  },
  {
    id: "focus",
    title: "Focus",
    body: [
      "Austin's focus is not only to write code, but to build experiences that feel intentional from the interface down to the logic behind it.",
      "SchedAI reflects that mindset: a simple product surface backed by careful parsing, conflict checking, preferences, and schedule generation."
    ]
  }
];

export default function AboutPage() {
  return (
    <LegalPage
      eyebrow="Developer"
      title="Developer"
      intro="Meet the builder behind SchedAI, Karl Austin Pavia, a full-stack developer and UI/UX-focused creator behind Arxeni."
      documentTitle="Karl Austin Pavia"
      documentSummary="Full-stack development, UI/UX engineering, competitive programming, global hackathons, and practical product building."
      sections={sections}
    />
  );
}

import type { ClassSection } from "@/types/schedule";

export const sampleSections: ClassSection[] = [
  {
    id: "sample-itmc311-a",
    subjectCode: "ITMC311",
    subjectName: "Integrative Programming and Technologies 2",
    section: "ZT33Am",
    professor: "SEREÑO",
    room: "AL211B/CS",
    meetings: [
      { day: "TUE", start: 480, end: 540 },
      { day: "THU", start: 480, end: 540 },
      { day: "TUE", start: 900, end: 990 },
      { day: "THU", start: 900, end: 990 }
    ]
  },
  {
    id: "sample-itmc312-a",
    subjectCode: "ITMC312",
    subjectName: "Information Assurance and Security 1",
    section: "ZT31Am",
    professor: "FLORES",
    room: "AL212/CSL",
    meetings: [
      { day: "MON", start: 1170, end: 1260 },
      { day: "WED", start: 1170, end: 1260 }
    ]
  },
  {
    id: "sample-phin103-a",
    subjectCode: "PHIN103",
    subjectName: "Philosophy of Religion",
    section: "N11Am",
    professor: "ANTONIO",
    room: "AR218",
    meetings: [
      { day: "MON", start: 630, end: 720 },
      { day: "WED", start: 630, end: 720 }
    ]
  }
];

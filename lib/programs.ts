// The programs, in the order the admin menus list them. Plain data, so client pages can use it
// too (lib/releases.ts RELEASE_APPS adds versions and links on the server).
export const PROGRAMS = [
  { id: "excel-to-kml", name: "Excel to KML" },
  { id: "traverse", name: "Traverse & Level" },
  { id: "slope", name: "Slope Calculator" },
  { id: "auto-draft", name: "Auto Drafting" },
  { id: "roadpro", name: "RoadPro" },
  { id: "folder-manager", name: "Project Folder Manager" },
  { id: "toolkit", name: "Survey Toolkit" },
] as const;

export type ProgramId = (typeof PROGRAMS)[number]["id"];

/** A program's name, or the id itself when it is not one of ours */
export const programName = (id: string): string => PROGRAMS.find((p) => p.id === id)?.name ?? id;

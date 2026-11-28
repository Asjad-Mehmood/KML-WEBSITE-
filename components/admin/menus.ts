// The lists the admin menu is built from. Kept apart from the tab components, so the admin page
// can draw its menu without loading every tab's code (app/admin/AdminClient.tsx loads each tab
// only when it is opened).
import { Activity, Download, LayoutDashboard, Lock, Monitor, Users } from "lucide-react";
import { PROGRAMS } from "@/lib/products/programs";

export type ToolkitSection = "overview" | "accounts" | "pcs" | "activity" | "downloads" | "access";

/** The programs under Downloads in the menu (lib/products/programs.ts) */
export const DOWNLOAD_TABS: { id: string; name: string }[] = PROGRAMS.map(({ id, name }) => ({ id, name }));

/** The programs people review (lib/content/reviews.ts REVIEW_PRODUCTS), and the Releases app each one is */
export const REVIEW_APPS = [
  { id: "excel-to-kml", name: "Excel to KML", release: "excel-to-kml" },
  { id: "traverse", name: "Traverse & Level", release: "traverse" },
  { id: "slope-calculator", name: "Slope Calculator", release: "slope" },
  { id: "auto-draft", name: "Auto Drafting", release: "auto-draft" },
  { id: "roadpro", name: "RoadPro", release: "roadpro" },
  { id: "project-folder-manager", name: "Project Folder Manager", release: "folder-manager" },
  { id: "toolkit", name: "Survey Toolkit", release: "toolkit" },
];

/** The parts of Settings: one menu item each under Settings in the sidebar */
export const SETTINGS_SECTIONS = [
  ["status", "Status"],
  ["access", "Access"],
  ["notices", "Notices"],
  ["home", "Home page"],
  ["toolkit", "Survey Toolkit"],
  ["downloads", "Downloads"],
  ["features", "App features"],
  ["traverse", "Traverse & Level"],
  ["release", "Release"],
  ["security", "Security"],
  ["system", "System"],
  ["history", "History"],
] as const;

/** The parts of the Toolkit's detail: under Survey Toolkit in the Admin menu */
export const TOOLKIT_SECTIONS: { id: ToolkitSection; label: string; icon: typeof Activity }[] = [
  { id: "overview", label: "Tools on PCs", icon: LayoutDashboard },
  { id: "accounts", label: "Accounts", icon: Users },
  { id: "pcs", label: "PCs", icon: Monitor },
  { id: "activity", label: "Activity", icon: Activity },
  { id: "downloads", label: "Downloads", icon: Download },
  { id: "access", label: "Access", icon: Lock },
];

export const ACTIVITY_APPS: { id: string; name: string; tone: string }[] = [
  { id: "excel-to-kml", name: "Excel to KML", tone: "bg-blue-500/15 text-blue-300 border-blue-500/30" },
  { id: "traverse", name: "Traverse & Level", tone: "bg-violet-500/15 text-violet-300 border-violet-500/30" },
  { id: "slope", name: "Slope Calculator", tone: "bg-cyan-500/15 text-cyan-300 border-cyan-500/30" },
  { id: "auto-draft", name: "Auto Drafting", tone: "bg-orange-500/15 text-orange-300 border-orange-500/30" },
  { id: "roadpro", name: "RoadPro", tone: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  { id: "folder-manager", name: "Folder Manager", tone: "bg-teal-500/15 text-teal-300 border-teal-500/30" },
  { id: "toolkit", name: "Survey Toolkit", tone: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  { id: "website", name: "Website", tone: "bg-slate-500/15 text-slate-300 border-slate-500/30" },
];

/** The apps that keep anything in accounts: the menu under Files */
export const FILE_APPS = [
  { id: "excel-to-kml", name: "Excel to KML" },
  { id: "traverse", name: "Traverse & Level" },
  { id: "slope", name: "Slope Calculator" },
];

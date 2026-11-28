// Project Folder Manager: a Windows dashboard for project folders. Version 7 (3 Nov 2026) is a
// Windows program with an installer, released on GitHub (Asjad-Mehmood/Project-manager) and
// updating itself; 6.2 was an HTML application in a zip (still at Project_Folder_Manager.zip,
// which the Survey Toolkit's Windows check uses). Content from version 7's README and manual.

export const PFM_VERSION = "7.0.0";
export const PFM_RELEASED = "2026-11-03";
export const PFM_NAME = "Project Folder Manager";
export const PFM_REPO = "Asjad-Mehmood/Project-manager";
export const PFM_INSTALLER = "ProjectFolderManager-Setup.exe";

export const PFM_FILES = {
  package: {
    // always the newest release; the program updates itself after that
    href: `https://github.com/${PFM_REPO}/releases/latest/download/${PFM_INSTALLER}`,
    name: PFM_INSTALLER,
    label: "Project Folder Manager for Windows",
    detail: "ProjectFolderManager-Setup.exe, the installer, 9 MB",
  },
  shots: {
    main: { src: "/project-folder-manager/pfm7-dashboard.webp", width: 1600, height: 900 },
    panel: { src: "/project-folder-manager/pfm7-panel.webp", width: 1600, height: 900 },
    start: { src: "/project-folder-manager/pfm7-start.webp", width: 1600, height: 900 },
    manual: { src: "/project-folder-manager/pfm7-manual.webp", width: 1600, height: 900 },
  },
};

// The numbered modules and the discipline each one starts with
export const PFM_MODULES: [string, string][] = [
  ["00", "Admin"],
  ["10", "Survey"],
  ["20", "Piping"],
  ["30", "Electrical"],
  ["40", "Telecom"],
  ["50", "Civil Works"],
  ["60", "Utilities"],
  ["70", "Facilities"],
  ["80", "Roads"],
  ["90", "Design & Drawings"],
  ["99", "Archive"],
];

export const PFM_FEATURES: { title: string; text: string }[] = [
  { title: "Open a drive or any folder", text: "The first time, click a drive or choose a folder; a project's master folder works best. Switch any time from the top left, where your recent folders are kept." },
  { title: "Folders by discipline", text: "Every folder inside, with its discipline colour (00 Admin to 99 Archive) and its sub-folders. VIEW shows it in the side panel, OPEN in Explorer." },
  { title: "Instant search", text: "The folder indexes itself in the background. Type to filter the list, or turn on DEEP to search every folder and file, with a discipline filter." },
  { title: "Copy, move, undo", text: "Copy, cut and paste, drag and drop, rename and delete to the Recycle Bin in the panel. Name clashes ask first, and UNDO (Ctrl+Z) takes a step back." },
  { title: "Rename in bulk", text: "LIST / EDIT puts a folder's names in a box: edit them, see a preview of every change and any problem, then apply. Quick tools number, add text, find and replace and change case." },
  { title: "Follows the disk", text: "Folders made, renamed or deleted in Explorer show up by themselves within seconds: there is nothing to scan or rebuild." },
  { title: "Six layouts, pins, drives", text: "Tree only, panel only, side by side or above and below (Alt+1 to Alt+6), pinned folders, and every drive with its free space." },
  { title: "Manual and updates", text: "MANUAL (F1) explains every part, topic by topic. It installs per user without administrator rights and updates itself." },
];

export const PFM_INSTALL: { title: string; text: string }[] = [
  { title: "Download", text: "Download ProjectFolderManager-Setup.exe and open it. No administrator rights are needed." },
  { title: "Open", text: "It installs for your Windows user, with Start menu and desktop shortcuts, and is listed in Settings → Apps." },
  { title: "Choose a folder", text: "The first time it asks what to open: click a drive, or choose a folder. Change it any time from the top left." },
  { title: "Read the manual", text: "Press F1 or MANUAL in the top bar for how to use every part." },
];

export const PFM_REQUIREMENTS = [
  "Windows 10 or 11, 64-bit",
  "No administrator rights needed: it installs for your Windows user only",
  "Settings are kept in your AppData, so the program works with folders anywhere: local drives, USB or mapped network drives",
  "Coming from 6.2? Install version 7: its start page offers to bring in your 6.2 settings",
];

export const PFM_FIXES: { q: string; a: string }[] = [
  { q: "Windows protected your PC", a: "The installer isn't code-signed yet, so SmartScreen asks first. Choose More info → Run anyway." },
  { q: "This folder is not on this PC", a: "The drive isn't connected, or the folder was moved. Connect it and press TRY AGAIN, or open another folder from the same page." },
  { q: "Search finds only folder names", a: "Turn on DEEP to search every folder and file. A new folder is indexed in the background first; INDEX in the top bar shows how far it has got." },
  { q: "A file won't open", a: "Windows has no program for that file type. The panel offers to show it in Explorer instead." },
  { q: "A move or rename failed", a: "The item is open in another program, or the folder is open in Explorer. Close it and try again; UNDO puts back what was done." },
  { q: "How do I update?", a: "It checks a few seconds after it opens and offers the new version; ⋯ → Look for an update checks now. The Survey Toolkit can update it too." },
];

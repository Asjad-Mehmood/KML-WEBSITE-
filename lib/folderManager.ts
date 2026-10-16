// Project Folder Manager: a Windows dashboard for a project's master folder.
// Content from the program itself (Project_Folder_Manager.hta, v6.2) and its
// READ_ME.txt, both downloadable from /project-folder-manager.

export const PFM_VERSION = "6.2";
export const PFM_RELEASED = "2026-10-16";
export const PFM_NAME = "Project Folder Manager";

export const PFM_FILES = {
  package: {
    href: "/project-folder-manager/Project_Folder_Manager.zip",
    name: "Project_Folder_Manager.zip",
    label: "Project Folder Manager",
    detail: "Project_Folder_Manager.exe, the .hta, READ_ME.txt and the icon in a zip, 65 KB",
  },
  shots: {
    main: { src: "/project-folder-manager/folder-manager.webp", width: 1600, height: 900 },
    panel: { src: "/project-folder-manager/folder-manager-panel.webp", width: 1600, height: 900 },
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
  { title: "Every module at a glance", text: "The project's numbered folders, from 00 Admin to 99 Archive, each with its discipline colour, how many sub-folders it has and a check that it is on the disk." },
  { title: "View or open", text: "VIEW shows a folder's contents in the panel beside the list; OPEN takes you to it in Explorer, or opens a file in its own program." },
  { title: "Instant search", text: "Press INDEX once for this project, the whole drive or all drives. After that every search is instant, with a discipline filter and a DEEP search." },
  { title: "Copy, cut, paste, delete", text: "Select several items and copy or move them between folders. Name clashes ask: replace, keep both or skip, once or for all. Delete goes to the Recycle Bin." },
  { title: "Rename in bulk", text: "LIST / EDIT puts a folder's names in a box: edit the lines and APPLY RENAMES. Names with characters Windows doesn't allow are caught first." },
  { title: "Drives and free space", text: "DRIVES shows every drive on the PC with its free space and a usage bar; click one to open it in the panel." },
  { title: "Six layouts", text: "Tree only, panel only, side by side or one above the other (Alt+1 to Alt+6). It remembers the one you used last." },
  { title: "Any project", text: "Click the title at the top left to name it for your project. SCAN adds new folders, FIX NAMES finds a renamed one and MISSING hides what isn't there." },
];

export const PFM_INSTALL: { title: string; text: string }[] = [
  { title: "Unzip", text: "Extract Project_Folder_Manager.zip to a folder of its own, for example D:\\Project Folder Manager." },
  { title: "Open", text: "Double-click Project_Folder_Manager.exe. Keep the .exe and the .hta together in that folder." },
  { title: "Set the root", text: "Paste your project folder into ROOT PATH and press SET, or use BROWSE to pick it." },
  { title: "Index once", text: "Press INDEX once. After that every search is instant." },
];

export const PFM_REQUIREMENTS = [
  "Windows 10 or 11. It runs on Windows' own HTML application host (mshta.exe), so there is nothing else to install",
  "Your project's master folder on this PC or a mapped drive",
  "Settings and the search index are saved next to the program (Project_Folder_Manager_config.txt and Project_Folder_Manager_index.txt)",
  "To update, replace only the .hta file",
];

export const PFM_FIXES: { q: string; a: string }[] = [
  { q: "Windows protected your PC", a: "The program isn't code-signed, so SmartScreen asks first. Choose More info → Run anyway." },
  { q: "Project_Folder_Manager.hta was not found", a: "Keep Project_Folder_Manager.exe and Project_Folder_Manager.hta together in the same folder, then open the .exe again." },
  { q: "The modules show as missing", a: "The root path points somewhere else. Paste the project folder into ROOT PATH and press SET, or use BROWSE." },
  { q: "Search finds nothing", a: "Press INDEX once first. It can take a few minutes the first time; STOP keeps what was found so far." },
  { q: "A file won't open", a: "Windows has no program for that file type. The manager offers to show it in Explorer instead." },
  { q: "A move or rename failed", a: "The item is open in another program, or the folder is open in Explorer. Close it and try again." },
];

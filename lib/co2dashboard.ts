// CO2 Project Dashboard: a Windows dashboard for the CO2 Sequestration Project's
// master folder. Content from the program itself (CO2_Dashboard.hta, v6.1), which
// is downloadable from /co2-dashboard with its launcher and icon.

export const CO2_VERSION = "6.1";
export const CO2_RELEASED = "2026-10-16";
export const CO2_NAME = "CO2 Project Dashboard";

export const CO2_FILES = {
  package: {
    href: "/co2-dashboard/CO2_Dashboard.zip",
    name: "CO2_Dashboard.zip",
    label: "CO2 Project Dashboard",
    detail: "CO2_Dashboard.exe, CO2_Dashboard.hta and the icon in a zip, 64 KB",
  },
  shots: {
    main: { src: "/co2-dashboard/dashboard.webp", width: 1600, height: 900 },
    panel: { src: "/co2-dashboard/dashboard-panel.webp", width: 1600, height: 900 },
  },
};

// The project's numbered modules and the discipline each one starts with
export const CO2_MODULES: [string, string][] = [
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

export const CO2_FEATURES: { title: string; text: string }[] = [
  { title: "Every module at a glance", text: "The numbered folders from 00 Admin to 99 Archive, each with its discipline colour, how many sub-folders it has and a check that it is on the disk." },
  { title: "View or open", text: "VIEW shows a folder's contents in the panel beside the list; OPEN takes you to it in Explorer, or opens a file in its own program." },
  { title: "Instant search", text: "Press INDEX once for this project, the whole drive or all drives. After that every search is instant, with a discipline filter and a DEEP search." },
  { title: "Copy, cut, paste, delete", text: "Select several items and copy or move them between folders. Name clashes ask: replace, keep both or skip, once or for all. Delete goes to the Recycle Bin." },
  { title: "Rename in bulk", text: "LIST / EDIT puts a folder's names in a box: edit the lines and APPLY RENAMES. Names with characters Windows doesn't allow are caught first." },
  { title: "Drives and free space", text: "DRIVES shows every drive on the PC with its free space and a usage bar; click one to open it in the panel." },
  { title: "Six layouts", text: "Tree only, panel only, side by side or one above the other (Alt+1 to Alt+6). The dashboard remembers the one you used last." },
  { title: "Stays in step with the disk", text: "SCAN adds new top-level folders, FIX NAMES finds a module whose folder was renamed, REBUILD reads the list fresh from this PC and MISSING hides what isn't there." },
];

export const CO2_INSTALL: { title: string; text: string }[] = [
  { title: "Unzip", text: "Extract CO2_Dashboard.zip to a folder of its own, for example D:\\CO2 Dashboard." },
  { title: "Keep together", text: "CO2_Dashboard.exe, CO2_Dashboard.hta and the icon stay in the same folder." },
  { title: "Open", text: "Double-click CO2_Dashboard.exe. The dashboard opens full screen." },
  { title: "Set the root", text: "FIND looks for the project on drives C: to H:, or BROWSE to the project's master folder and press SET." },
];

export const CO2_REQUIREMENTS = [
  "Windows 10 or 11. The dashboard runs on Windows' own HTML application host (mshta.exe), so there is nothing else to install",
  "The project's master folder on this PC or a mapped drive, by default D:\\04_ CO2_Sequestration Project",
  "Settings and the search index are saved next to the program (CO2_dashboard_config.txt and CO2_dashboard_index.txt)",
];

export const CO2_FIXES: { q: string; a: string }[] = [
  { q: "Windows protected your PC", a: "The program isn't code-signed, so SmartScreen asks first. Choose More info → Run anyway." },
  { q: "CO2_Dashboard.hta was not found", a: "Keep CO2_Dashboard.exe and CO2_Dashboard.hta together in the same folder, then open the .exe again." },
  { q: "The modules show as missing", a: "The root path points somewhere else. Use FIND, or BROWSE to the master folder and press SET." },
  { q: "Search finds nothing", a: "Press INDEX once first. It can take a few minutes the first time; STOP keeps what was found so far." },
  { q: "A file won't open", a: "Windows has no program for that file type. The dashboard offers to show it in Explorer instead." },
  { q: "A move or rename failed", a: "The item is open in another program, or the folder is open in Explorer. Close it and try again." },
];

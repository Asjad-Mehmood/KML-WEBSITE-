// Professional Traverse & Level Adjustment Software: our Windows app for
// traverse and level books. Content from its user manual (version 1.0,
// downloadable from /traverse).

export const TRAVERSE_NAME = "Professional Traverse & Level Adjustment Software";
export const TRAVERSE_SHORT = "Traverse & Level";
export const TRAVERSE_VERSION = "1.0";
export const TRAVERSE_RELEASED = "2026-10-09";

export const TRAVERSE_FILES = {
  // The Windows setup. While href is null the page says "coming soon"; put
  // the file in public/traverse/ and set href to turn the download on.
  setup: {
    href: null as string | null,
    name: "Professional-Traverse-Level-Adjustment-Setup-1.0.exe",
    label: "Windows setup",
    detail: "Setup for Windows, version 1.0",
  },
  manualPdf: { href: "/traverse/Traverse_Level_User_Manual.pdf", name: "Traverse_Level_User_Manual.pdf", label: "User manual", detail: "PDF, 15 pages, 1.7 MB" },
  manual: { href: "/traverse/Traverse_Level_User_Manual.pptx", name: "Traverse_Level_User_Manual.pptx", label: "User manual", detail: "PowerPoint, 15 slides, 1.5 MB" },
  video: { href: "/traverse/traverse-intro.mp4", poster: "/traverse/intro-cover.webp", duration: "PT34S" },
  clips: [
    { href: "/traverse/traverse-title.mp4", poster: "/traverse/title-cover.webp", w: 672, h: 448, aspect: "aspect-[3/2]", wide: true, title: "Title animation" },
    { href: "/traverse/traverse-logo.mp4", poster: "/traverse/logo-poster.webp", w: 448, h: 672, aspect: "aspect-square", wide: false, title: "Logo animation" },
  ],
};

export const TRAVERSE_FEATURES: { title: string; text: string }[] = [
  { title: "Traverse book with a live plan", text: "Closed loop, closed on control or open. Type angles or bearings and distances; the stations are drawn as you type." },
  { title: "Level book and profile", text: "Backsight, intermediate and foresight on one row per change point, with the rise and fall drawn as a profile." },
  { title: "Traverse calculation", text: "Azimuth, latitude, departure and raw coordinates for every leg. An open traverse never claims a closing error." },
  { title: "Four adjustment methods", text: "Bowditch, Transit, weighted least squares, or no adjustment, with the correction on each leg." },
  { title: "Level adjustment", text: "ΣBS − ΣFS checked against the RL difference, misclosure against your tolerance, adjusted RLs for every point." },
  { title: "QA / QC and standards", text: "Pass, warning or fail against your own project limits: linear misclosure, closure ratio, angular and level tolerance." },
  { title: "Registers and plot", text: "Raw and adjusted E, N and RL in one register, and a full plan of the adjusted and unadjusted lines." },
  { title: "Report and export", text: "A printable report, an Excel workbook, CSV import for both books, and the whole job saved as one file." },
];

// The 13 screens of the program, in the order of its menu. page = the page
// of the user manual that explains it; img = public/traverse/screens/<img>.webp
export const TRAVERSE_SCREENS: { group: string; items: { no: string; title: string; text: string; img: string; page: number }[] }[] = [
  {
    group: "Field",
    items: [
      { no: "01", title: "Project", text: "Name, number, client, surveyor, checker, instrument, datum and benchmark, with a revision history.", img: "project", page: 2 },
      { no: "02", title: "Traverse book", text: "Type, angle convention, adjustment, start and end control, and the observation book with a live plan.", img: "traverse-book", page: 4 },
      { no: "03", title: "Level book", text: "Starting and closing RL, BS / IS / FS readings and the level profile.", img: "level-book", page: 5 },
    ],
  },
  {
    group: "Reduce",
    items: [
      { no: "04", title: "Traverse calc", text: "Each leg with azimuth, latitude, departure and raw coordinates.", img: "traverse-calc", page: 6 },
      { no: "05", title: "Adjustment", text: "Misclosure, closure ratio, corrections and final adjusted coordinates.", img: "adjustment", page: 7 },
      { no: "06", title: "Level adjust", text: "Misclosure against the allowable tolerance and adjusted reduced levels.", img: "level-adjust", page: 8 },
    ],
  },
  {
    group: "Deliver",
    items: [
      { no: "07", title: "Registers", text: "Raw and adjusted coordinates and reduced levels, ready to copy to a drawing.", img: "registers", page: 9 },
      { no: "08", title: "QA / QC", text: "Pass, warning or fail for the traverse and the level run.", img: "qa-qc", page: 10 },
      { no: "09", title: "Traverse plot", text: "Adjusted and unadjusted lines, station names and north. Drag and zoom.", img: "plot", page: 11 },
      { no: "10", title: "Report", text: "Project, traverse and level results to print, or save as HTML.", img: "report", page: 12 },
      { no: "11", title: "Import / export", text: "CSV in for both books with a column map; Excel workbook, CSV and project out.", img: "import-export", page: 13 },
    ],
  },
  {
    group: "System",
    items: [
      { no: "12", title: "Standards", text: "Angle display, units, decimals and every tolerance. Add a user or sign out.", img: "standards", page: 14 },
      { no: "13", title: "Reference tests", text: "Built-in checks that confirm the traverse and level arithmetic.", img: "reference-tests", page: 15 },
    ],
  },
];

export const TRAVERSE_STEPS: { title: string; text: string }[] = [
  { title: "Install", text: "Run the setup, then open the desktop shortcut." },
  { title: "Create your user", text: "The program stays locked until you create a user name and password. Next time, sign in with them." },
  { title: "Start a project", text: "Fill in Project Manager, or press Load sample to try the demonstration traverse and level run." },
  { title: "Enter the books", text: "Type the traverse legs and the level readings, or import them from CSV." },
  { title: "Adjust and check", text: "Choose the adjustment, then read the misclosure and the QA / QC result." },
  { title: "Deliver", text: "Copy the registers, print the report or export the Excel workbook. Save project keeps the job as a file." },
];

export const TRAVERSE_NOTES = [
  "The plans and plots are guides, not certified drawings.",
  "A mathematical close is not an acceptance decision: you and your checker sign off the survey.",
  "Tolerances are your project limits, set in 12 Standards, not a universal survey class.",
  "Reference tests confirm the calculation engine, not the field work.",
  "Personal uses counts how often this computer opens the program. It is stored only on that computer.",
];

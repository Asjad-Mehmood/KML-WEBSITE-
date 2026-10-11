// Professional Traverse & Level Adjustment Software by SurveyX Digital. Version 2.0 is a web
// app at /traverse/app (accounts and jobs on this website) plus a portable Windows program.
// Content from its user manual (version 2.0, downloadable from /traverse).

export const TRAVERSE_NAME = "Professional Traverse & Level Adjustment Software";
export const TRAVERSE_SHORT = "Traverse & Level";
export const TRAVERSE_VERSION = "2.0";
export const TRAVERSE_RELEASED = "2026-10-11";

// The web app, served from public/traverse/app (built from traverse-app/)
export const TRAVERSE_APP = "/traverse/app";

export const TRAVERSE_FILES = {
  // The Windows program. While href is null the page says "coming soon"; put
  // the file in public/traverse/ and set href to turn the download on.
  setup: {
    href: "/traverse/Traverse-Level-Adjustment-2.0.exe" as string | null,
    name: "Traverse-Level-Adjustment-2.0.exe",
    label: "Windows program",
    detail: "Portable program for Windows 10 and 11 (64-bit), version 2.0, 3.8 MB",
  },
  manualPdf: { href: "/traverse/Traverse-Level-User-Manual.pdf", name: "Traverse-Level-User-Manual.pdf", label: "User manual", detail: "PDF, 30 pages, 6.6 MB" },
  manual: { href: "/traverse/Traverse-Level-User-Manual.pptx", name: "Traverse-Level-User-Manual.pptx", label: "User manual", detail: "PowerPoint, 51 slides, 7.1 MB" },
  video: { href: "/traverse/traverse-intro.mp4", poster: "/traverse/intro-cover.webp", duration: "PT34S" },
  clips: [
    { href: "/traverse/traverse-title.mp4", poster: "/traverse/title-cover.webp", w: 672, h: 448, aspect: "aspect-[3/2]", wide: true, title: "Title animation" },
    { href: "/traverse/traverse-logo.mp4", poster: "/traverse/logo-poster.webp", w: 448, h: 672, aspect: "aspect-square", wide: false, title: "Logo animation" },
  ],
};

// The practice files that come with the manual (public/traverse/samples/)
export const TRAVERSE_SAMPLES: { href: string; name: string; text: string }[] = [
  { href: "/traverse/samples/sample-traverse-site-coordinates.csv", name: "sample-traverse-site-coordinates.csv", text: "Site coordinates of the example traverse. The first lines give the known points to type in step 1." },
  { href: "/traverse/samples/sample-level-book.csv", name: "sample-level-book.csv", text: "The example level book: a closed loop on BM-01, RL 4.215." },
  { href: "/traverse/samples/sample-data.xlsx", name: "sample-data.xlsx", text: "The same two samples in Excel, ready to copy and paste." },
  { href: "/traverse/samples/sample-traverse-report.pdf", name: "sample-traverse-report.pdf", text: "The PDF report the example traverse produces." },
  { href: "/traverse/samples/sample-level-report.pdf", name: "sample-level-report.pdf", text: "The PDF report the example level book produces." },
];

export const TRAVERSE_FEATURES: { title: string; text: string }[] = [
  { title: "Coordinate traverse", text: "Station, backsight, the points measured on site and the closing point. Closed or open, typed or pasted from Excel." },
  { title: "Bowditch, Transit or Equal", text: "Spread the misclosure your way and check the precision against your 1 : N, with the correction on every point." },
  { title: "Levelling", text: "Rise & Fall or Height of Instrument, arithmetic checks, misclosure against your allowable and adjusted RLs." },
  { title: "Signed PDF reports", text: "Report details, closure check, input and output coordinates, bearings, sketch and signature boxes." },
  { title: "Your dashboard", text: "Every traverse and level run saved to your exceltokml.com account, with status, search, copy and activity." },
  { title: "Share with your team", text: "Send a job to a checker, engineer or client by email. They open a copy from their own dashboard." },
  { title: "Traverse simulator", text: "Watch a total station observe a traverse with realistic errors, then adjust it. Made for training." },
  { title: "Offline, dark mode, phone", text: "Works without internet after your first login, has a dark mode, and fits a phone on site." },
];

// The screens of version 2.0, in the order of the manual. page = the page of the
// user manual that explains it; img = public/traverse/screens/<img>.webp
export const TRAVERSE_SCREENS: { group: string; items: { no: string; title: string; text: string; img: string; page: number }[] }[] = [
  {
    group: "Start",
    items: [
      { no: "01", title: "Front page", text: "What the software does, with Register and Log in. The clock and the light / dark switch sit at the top.", img: "v2-front", page: 3 },
      { no: "02", title: "Your account", text: "Register once with your name, email and password. It is the same account as exceltokml.com.", img: "v2-register", page: 5 },
      { no: "03", title: "Dashboard", text: "Every saved traverse and level run, with its status and key result, plus jobs shared with you.", img: "v2-dashboard", page: 9 },
    ],
  },
  {
    group: "Traverse",
    items: [
      { no: "04", title: "Known points and result", text: "Job name, known station, backsight and closing point. Accepted or Rejected updates as you type.", img: "v2-traverse", page: 11 },
      { no: "05", title: "Site coordinates and plan", text: "The points as measured, the adjustment method and the plan of the adjusted and measured lines.", img: "v2-traverse-plan", page: 13 },
      { no: "06", title: "Bearings and report", text: "Whole-circle bearings and distances from the output coordinates, the PDF report and a coordinates CSV.", img: "v2-traverse-bearings", page: 16 },
    ],
  },
  {
    group: "Levelling and reports",
    items: [
      { no: "07", title: "Level book", text: "Start and closing benchmarks, then BS, IS and FS on one row per point. Import a CSV or paste from Excel.", img: "v2-level", page: 19 },
      { no: "08", title: "Levelling result", text: "Misclosure against the allowable, reduced levels, corrections, adjusted RLs and the arithmetic checks.", img: "v2-level-result", page: 20 },
      { no: "09", title: "PDF reports", text: "Traverse and levelling reports with your report details and boxes for Surveyed, Checked and Approved by.", img: "v2-reports", page: 18 },
    ],
  },
  {
    group: "Simulator and sharing",
    items: [
      { no: "10", title: "Traverse simulator", text: "Choose a link or loop, the instrument accuracy and a scenario, then watch the total station observe it.", img: "v2-simulator", page: 22 },
      { no: "11", title: "Simulator result", text: "Misclosure and precision, the field book with every random error, and Adjust in Traverse tool.", img: "v2-simulator-result", page: 23 },
      { no: "12", title: "Share a job", text: "Type a colleague's email. They find the job under Shared with me; Remove stops sharing.", img: "v2-share", page: 24 },
    ],
  },
  {
    group: "Anywhere",
    items: [
      { no: "13", title: "Dark mode", text: "One click on the moon for night work. Your choice is remembered on that device.", img: "v2-dark", page: 26 },
      { no: "14", title: "On your phone", text: "Every screen fits a phone, and the app keeps working offline after your first login.", img: "v2-phone", page: 27 },
    ],
  },
];

export const TRAVERSE_STEPS: { title: string; text: string }[] = [
  { title: "Open the app", text: "Open the web app in Chrome, Edge, Safari or Firefox, or run the Windows program." },
  { title: "Register or log in", text: "Use your exceltokml.com account, or create one free. After your first login the app also opens offline." },
  { title: "Type the known points", text: "Station, backsight and closing point for a traverse; start and closing benchmark for a level run." },
  { title: "Enter the site data", text: "Type the points or the level book, paste the rows from Excel, or import a CSV." },
  { title: "Check and adjust", text: "Choose Bowditch, Transit or Equal, or Rise & Fall or HI, and read Accepted or Rejected at once." },
  { title: "Save, report and share", text: "Save the job to your dashboard, download the PDF report and share it with the people who need it." },
];

export const TRAVERSE_NOTES = [
  "A mathematical close is not an acceptance decision: you and your checker sign off the survey.",
  "Never lower the required precision just to make a traverse pass. Check the closing point, then each point against the field book.",
  "The plan sketch and the plots are guides, not certified drawings.",
  "Jobs saved in the web app go to your exceltokml.com account. Jobs saved offline upload by themselves when you are back online.",
  "The Windows program keeps its own accounts and jobs on that PC; they are not shared with the web app.",
  "Logging out of the app also logs you out of exceltokml.com. Change your password from your account page on this website.",
];

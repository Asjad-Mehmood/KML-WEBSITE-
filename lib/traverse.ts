// Professional Traverse & Level Adjustment Software by SurveyX Digital. Version 2.1 is a web
// app at /traverse/app (accounts and jobs on this website) plus a Windows program that opens the
// same web app in its own window. The program is built and released from Asjad-Mehmood/Traiverse.
// Content from its user manual (version 2.1, downloadable from /traverse).

export const TRAVERSE_NAME = "Professional Traverse & Level Adjustment Software";
export const TRAVERSE_SHORT = "Traverse & Level";
export const TRAVERSE_VERSION = "2.1";
export const TRAVERSE_RELEASED = "2026-10-23";

// The web app, served from public/traverse/app (built from traverse-app/)
export const TRAVERSE_APP = "/traverse/app";

// Where the Windows program is released (installer, latest.json, release notes)
export const TRAVERSE_RELEASES = "https://github.com/Asjad-Mehmood/Traiverse/releases";
export const TRAVERSE_RELEASES_API = "https://api.github.com/repos/Asjad-Mehmood/Traiverse/releases/latest";
export const TRAVERSE_INSTALLER = "TraverseLevel-Setup.exe";

export const TRAVERSE_FILES = {
  // The Windows installer, from the latest release of Asjad-Mehmood/Traiverse (public), the
  // same way Excel to KML's installer comes from its releases repository. While href is null
  // the page says "coming soon".
  setup: {
    href: `${TRAVERSE_RELEASES}/latest/download/${TRAVERSE_INSTALLER}` as string | null,
    name: TRAVERSE_INSTALLER,
    label: "Windows program",
    detail: "Installer for Windows 10 and 11. Adds Start menu and desktop shortcuts, needs no administrator rights and updates itself",
  },
  manualPdf: { href: "/traverse/Traverse-Level-User-Manual.pdf", name: "Traverse-Level-User-Manual.pdf", label: "User manual", detail: "PDF, 41 pages, 5.5 MB" },
  manual: { href: "/traverse/Traverse-Level-User-Manual.pptx", name: "Traverse-Level-User-Manual.pptx", label: "User manual", detail: "PowerPoint, 41 slides, 4.4 MB" },
  // the intro (with sound), and a silent, lighter copy that loops on the home page card
  // (WebM copies for browsers without H.264)
  video: {
    href: "/traverse/traverse-promo.mp4",
    webm: "/traverse/traverse-promo.webm",
    poster: "/traverse/traverse-promo-cover.webp",
    duration: "PT30S",
    loop: "/traverse/traverse-promo-loop.mp4",
    loopWebm: "/traverse/traverse-promo-loop.webm",
  },
};

// The practice files that come with the manual (public/traverse/samples/)
export const TRAVERSE_SAMPLES: { href: string; name: string; text: string }[] = [
  { href: "/traverse/samples/sample-traverse-site-coordinates.csv", name: "sample-traverse-site-coordinates.csv", text: "Site coordinates of the example traverse. The first lines give the known points to type in step 1." },
  { href: "/traverse/samples/sample-level-book.csv", name: "sample-level-book.csv", text: "The example level book: a closed loop on BM-01, RL 4.215." },
  { href: "/traverse/samples/sample-field-book.csv", name: "sample-field-book.csv", text: "The same site as a field book: angles and distances with two side shots and levels. The first lines give the known points and the closing leg." },
  { href: "/traverse/samples/sample-data.xlsx", name: "sample-data.xlsx", text: "The three samples in Excel, ready to copy and paste." },
  { href: "/traverse/samples/sample-traverse-report.pdf", name: "sample-traverse-report.pdf", text: "The PDF report the example traverse produces." },
  { href: "/traverse/samples/sample-field-book-report.pdf", name: "sample-field-book-report.pdf", text: "The PDF report of the field book: angular and level checks, angles, side shots, latitude and longitude." },
  { href: "/traverse/samples/sample-field-book.kml", name: "sample-field-book.kml", text: "The field book traverse and its side shots for Google Earth." },
  { href: "/traverse/samples/sample-level-report.pdf", name: "sample-level-report.pdf", text: "The PDF report the example level book produces." },
];

export const TRAVERSE_FEATURES: { title: string; text: string }[] = [
  { title: "Coordinates or field book", text: "The points as measured on site, or the field book itself: angles or bearings and distances, with side shots and levels. Closed, open, or open on a closing point." },
  { title: "Bowditch, Transit, Equal or least squares", text: "Spread the misclosure your way, with angular, linear and level checks against your tolerances, or adjust a field book by least squares with error ellipses." },
  { title: "Levelling", text: "Rise & Fall or Height of Instrument, arithmetic checks, misclosure against your allowable and adjusted RLs." },
  { title: "Signed PDF reports", text: "Report details, closure check, field book, input and output coordinates, bearings, sketch and signature boxes. Also CSV and Google Earth." },
  { title: "Your dashboard", text: "Every traverse and level run saved to your exceltokml.com account, with status, search, copy and activity. Works offline after your first login." },
  { title: "Share with your team", text: "Send a job to a checker, engineer or client by email. They open a copy from their own dashboard." },
  { title: "Traverse simulator", text: "Watch a total station observe a traverse with realistic errors, then adjust it. Made for training." },
  { title: "Qatar National Grid", text: "The grid's scale factor is worked out where the traverse is, and every point gets its WGS84 latitude and longitude, as in Excel to KML." },
];

// The screens of version 2.1, in the order of the manual. page = the page of the
// user manual that explains it; img = public/traverse/screens/<img>.webp
export const TRAVERSE_SCREENS: { group: string; items: { no: string; title: string; text: string; img: string; page: number }[] }[] = [
  {
    group: "Start",
    items: [
      { no: "01", title: "Front page", text: "What the software does, with Register and Log in. The clock and the light / dark switch sit at the top.", img: "v2-front", page: 4 },
      { no: "02", title: "Your account", text: "Register once with your name, email and password. It is the same account as exceltokml.com.", img: "v2-register", page: 5 },
      { no: "03", title: "Dashboard", text: "Every saved traverse and level run, with its status and key result, plus jobs shared with you.", img: "v2-dashboard", page: 37 },
    ],
  },
  {
    group: "Traverse",
    items: [
      { no: "04", title: "Known points and result", text: "Site coordinates or Angles & distances, the known points, and Accepted or Rejected as you type.", img: "v2-traverse", page: 7 },
      { no: "05", title: "Site coordinates and plan", text: "The points as measured, the adjustment method and the plan of the adjusted and measured lines.", img: "v2-traverse-plan", page: 13 },
      { no: "06", title: "Bearings, angles and side shots", text: "Whole-circle bearings against the observed distances, the balanced angles and the side shots from the adjusted stations.", img: "v2-traverse-bearings", page: 25 },
    ],
  },
  {
    group: "Angles & distances",
    items: [
      { no: "07", title: "Field book", text: "Angles turned from the backsight and distances, side shots and levels, with the angular and level checks.", img: "v2-fieldbook", page: 22 },
      { no: "08", title: "Least squares", text: "Angles and distances adjusted together by their weights, with residuals, error ellipses and the chi-square test.", img: "v2-lsq", page: 27 },
      { no: "09", title: "Qatar National Grid", text: "The scale factor worked out for the job, and WGS84 latitude and longitude for every point, as in Excel to KML.", img: "v2-qng", page: 28 },
    ],
  },
  {
    group: "Levelling and reports",
    items: [
      { no: "10", title: "Level book", text: "Start and closing benchmarks, then BS, IS and FS on one row per point. Import a CSV or paste from Excel.", img: "v2-level", page: 32 },
      { no: "11", title: "Levelling result", text: "Misclosure against the allowable, reduced levels, corrections, adjusted RLs and the arithmetic checks.", img: "v2-level-result", page: 33 },
      { no: "12", title: "PDF reports", text: "Traverse and levelling reports with your report details and boxes for Surveyed, Checked and Approved by.", img: "v2-reports", page: 21 },
    ],
  },
  {
    group: "Simulator and sharing",
    items: [
      { no: "13", title: "Traverse simulator", text: "Choose a link or loop, the instrument accuracy and a scenario, then watch the total station observe it.", img: "v2-simulator", page: 35 },
      { no: "14", title: "Simulator result", text: "Misclosure and precision, the field book with every random error, and Adjust in Traverse tool.", img: "v2-simulator-result", page: 36 },
      { no: "15", title: "Share a job", text: "Type a colleague's email. They find the job under Shared with me; Remove stops sharing.", img: "v2-share", page: 38 },
    ],
  },
  {
    group: "Anywhere",
    items: [
      { no: "16", title: "Dark mode", text: "One click on the moon for night work. Your choice is remembered on that device.", img: "v2-dark", page: 39 },
      { no: "17", title: "On your phone", text: "Every screen fits a phone, and the app keeps working offline after your first login.", img: "v2-phone", page: 6 },
    ],
  },
];

export const TRAVERSE_STEPS: { title: string; text: string }[] = [
  { title: "Open the app", text: "Open the web app in Chrome, Edge, Safari or Firefox, or run the Windows program." },
  { title: "Register or log in", text: "Use your exceltokml.com account, or create one free. After your first login the app also opens offline." },
  { title: "Type the known points", text: "Station, backsight and closing point for a traverse; start and closing benchmark for a level run." },
  { title: "Enter the site data", text: "Type the measured coordinates or the field book (angles and distances), or the level book; paste the rows from Excel, or import a CSV." },
  { title: "Check and adjust", text: "Choose Bowditch, Transit, Equal or least squares, or Rise & Fall or HI, and read Accepted or Rejected at once." },
  { title: "Save, report and share", text: "Save the job to your dashboard, download the PDF report and share it with the people who need it." },
];

export const TRAVERSE_NOTES = [
  "A mathematical close is not an acceptance decision: you and your checker sign off the survey.",
  "Never lower the required precision just to make a traverse pass. Check the closing point, then each point against the field book.",
  "The plan sketch and the plots are guides, not certified drawings.",
  "Jobs saved in the web app go to your exceltokml.com account. Jobs saved offline upload by themselves when you are back online.",
  "The Windows program is the web app in its own window: log in with the same account and you see the same jobs. Open it once with internet; after that it also opens offline.",
  "Logging out of the app also logs you out of exceltokml.com. Change your password from your account page on this website.",
];

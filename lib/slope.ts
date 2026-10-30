// Slope Calculator: slope, gradient and the level at every chainage, for surveyors and site
// engineers. A Flutter app built and released from Asjad-Mehmood/Slope-calculator-: a Windows
// program (installer on its GitHub releases, updates itself) and the same app on the web at
// /slope-calculation/app (public/slope-calculation/app, made there with tool/web_build.sh; don't
// edit those files here). Calculations are kept in the exceltokml.com account (lib/slopeJobs.ts).

export const SLOPE_NAME = "Slope Calculator";
export const SLOPE_VERSION = "1.0.0";
export const SLOPE_RELEASED = "2026-10-30";

export const SLOPE_PAGE = "/slope-calculation";
export const SLOPE_APP = "/slope-calculation/app";

export const SLOPE_RELEASES = "https://github.com/Asjad-Mehmood/Slope-calculator-/releases";
export const SLOPE_RELEASES_API = "https://api.github.com/repos/Asjad-Mehmood/Slope-calculator-/releases/latest";
export const SLOPE_INSTALLER = "SlopeCalculator-Setup.exe";

export const SLOPE_FILES = {
  setup: {
    href: `${SLOPE_RELEASES}/latest/download/${SLOPE_INSTALLER}`,
    name: SLOPE_INSTALLER,
    label: "Windows program",
    detail: "Installer for Windows 10 and 11. Start menu and desktop shortcuts, no administrator rights needed, updates itself",
  },
  shots: {
    calculator: { src: "/slope-calculation/screens/calculator.webp", width: 1440, height: 900 },
    crossfall: { src: "/slope-calculation/screens/crossfall.webp", width: 1440, height: 900 },
    level: { src: "/slope-calculation/screens/level.webp", width: 1440, height: 900 },
    phone: { src: "/slope-calculation/screens/phone.webp", width: 780, height: 1688 },
  },
  icon: "/slope-calculation/icon-512.png",
};

/** The four lines beside the icons in the hero */
export const SLOPE_HIGHLIGHTS = ["Slope in 1 metre and slope %", "Level at every chainage, any interval", "Live profile with a chainage probe", "Excel, PDF and CSV reports"];

export const SLOPE_FEATURES: { title: string; text: string }[] = [
  { title: "Slope and gradient", text: "Start and end level and chainage give the rise or fall, the slope per metre, the slope % and 1 in N, with rising, falling or level said in words." },
  { title: "Level at every chainage", text: "Stations on round chainages or counted from the start, at 5, 10, 20, 25, 50 or 100 m or any interval, with the level and the change from the start." },
  { title: "Live profile", text: "The longitudinal profile is drawn as you type. Slide the probe or type a chainage to read the level anywhere between the ends." },
  { title: "Crossfall", text: "Levels left and right of the centreline from the crossfall % and offset, falling or rising away, with the cross-section drawn." },
  { title: "Digital level run", text: "Watch a level run along your slope: setups, backsights, intermediates and foresights booked by HI or Rise & Fall, with the arithmetic check and closing error." },
  { title: "Optical level trainer", text: "An E-pattern staff to read through the telescope. Watch the readings or practise and get marked. Made for training." },
  { title: "Reports", text: "Excel with the project plate, summary, chainage levels, crossfall, level book and a QA/QC checklist; a PDF with the profile and sign-off boxes; CSV; print." },
  { title: "Saved in your account", text: "Keep calculations in your exceltokml.com account and open them on Windows, in the browser or on a phone. Saving works offline and is sent when you are back online." },
];

export const SLOPE_STEPS: { title: string; text: string }[] = [
  { title: "Enter the line", text: "Start level Y1, end level Y2, start chainage X1 and end chainage X2. Chainages can be typed as 1250 or 1+250." },
  { title: "Read the result", text: "Slope %, slope per metre, 1 in N and the rise or fall, with a sentence that says it in words." },
  { title: "Check the stations", text: "The level at every chainage on the interval you choose, on the profile and in the table." },
  { title: "Fill the project plate", text: "Project, client, drawing number, revision, prepared and checked by: printed on every report." },
  { title: "Export or save", text: "Excel, PDF or CSV, or save it to your account to open again on any device." },
];

export const SLOPE_FAQ: { q: string; a: string }[] = [
  { q: "Is it free?", a: "Yes. The web app and the Windows program are free. A free exceltokml.com account is needed to download the program and to keep calculations in your account; the calculator itself works without one." },
  { q: "Web app or Windows program?", a: "They are the same app. The web app runs in any modern browser, on a phone too, and can be installed from the browser. The Windows program runs in its own window and updates itself." },
  { q: "Does it work offline?", a: "Yes. Once opened, the web app keeps its files and opens without a connection. Calculations you save offline wait on the device and are sent to your account when you are back online." },
  { q: "How is the slope worked out?", a: "M = (Y2 − Y1) ÷ (X2 − X1): the rise or fall over the horizontal length. Slope % is M × 100 and the gradient is 1 in 1 ÷ |M|. Levels at the stations follow the straight line from Y1 to Y2." },
  { q: "Which chainage formats can I type?", a: "Plain metres (1250, 1250.5) or kilometre + metres (1+250, 1+250.500). Negative chainages work too." },
  { q: "If Windows warns about the installer", a: "The program isn't code-signed yet, so Windows SmartScreen may say it protected your PC the first time. Choose More info, then Run anyway." },
];

// Auto Drafting: field-coded survey points to a finished CAD drawing. A Windows program (Flutter)
// built and released from Asjad-Mehmood/auto-draft-app: the installer is on its GitHub releases
// and the program updates itself. Used with the SurveyX Digital account (sign-in, activity), like
// Slope Calculator. The code tables below follow docs/CODES.md in that repository (made there from
// the app's own code list); keep them the same when the default codes change.

export const AUTO_DRAFT_NAME = "Auto Drafting";
export const AUTO_DRAFT_VERSION = "1.0.1";
/** The first release's date (empty would show the product as "Coming soon") */
export const AUTO_DRAFT_RELEASED = "2026-11-15";

export const AUTO_DRAFT_PAGE = "/auto-draft";
export const AUTO_DRAFT_CODES_PAGE = "/auto-draft/codes";

export const AUTO_DRAFT_REPO = "Asjad-Mehmood/auto-draft-app";
export const AUTO_DRAFT_RELEASES = `https://github.com/${AUTO_DRAFT_REPO}/releases`;
export const AUTO_DRAFT_RELEASES_API = `https://api.github.com/repos/${AUTO_DRAFT_REPO}/releases/latest`;
export const AUTO_DRAFT_INSTALLER = "AutoDraft-Setup.exe";

const shot = (name: string, width = 1360, height = 860) => ({ src: `/auto-draft/screens/${name}.webp`, width, height });

export const AUTO_DRAFT_FILES = {
  setup: {
    href: `${AUTO_DRAFT_RELEASES}/latest/download/${AUTO_DRAFT_INSTALLER}`,
    name: AUTO_DRAFT_INSTALLER,
    label: "Windows program",
    detail: "Installer for Windows 10 and 11. Start menu and desktop shortcuts, no administrator rights needed, updates itself",
  },
  shots: {
    contours: shot("contours"),
    sheet: shot("sheet"),
    problems: shot("problems"),
    codes: shot("codes"),
    instrument: shot("instrument"),
    kml: shot("kml"),
    tin: shot("tin"),
    sheetPdf: shot("sheet-pdf", 1323, 936),
  },
  icon: "/auto-draft/icon-512.png",
  /** The 43-second intro: open the survey, it draws itself, the checks, contours, and the files it saves */
  video: {
    href: "/auto-draft/auto-draft-intro.mp4",
    webm: "/auto-draft/auto-draft-intro.webm",
    poster: "/auto-draft/auto-draft-intro-cover.webp",
    duration: "PT43S",
    uploadDate: "2026-11-16",
  },
  sample: {
    href: "/auto-draft/Auto-Draft-Sample-Survey.csv",
    name: "Auto-Draft-Sample-Survey.csv",
    detail: "67 coded points: roads, a plot with buildings, a drain, a fence, trees and poles",
  },
};

/** The four lines beside the icons at the top of the page */
export const AUTO_DRAFT_HIGHLIGHTS = ["Lines joined by their field codes", "Symbols, levels and layers", "Contours that bend at breaklines", "DXF, PDF and KML"];

export const AUTO_DRAFT_FEATURES: { title: string; text: string }[] = [
  {
    title: "Open the day's survey",
    text: "CSV, TXT or Excel with any column order, or the total station's own file: Leica GSI-8 and GSI-16, Sokkia SDR and Nikon RAW, coordinates or observations.",
  },
  {
    title: "Lines from the codes",
    text: "RE1, WL2, BLD1 CLS: points with the same code and number become one line, surveyed in any order. Start, end, close, rectangles and curves come from the code too.",
  },
  {
    title: "Symbols, levels, layers",
    text: "Trees, poles, manholes and benchmarks get their symbols; levels are written beside the points; every feature is on its own layer, in its own colour and line type.",
  },
  {
    title: "Problems found before you save",
    text: "Unknown codes, one-point lines, jumps, duplicate numbers and missing levels are listed. Click one to see it on the drawing and fix the code in one click.",
  },
  {
    title: "Contours",
    text: "A ground surface (TIN) from the points with levels, bending at road edges, banks and drains. Roofs and wires are left out. Every 5th contour is labelled.",
  },
  {
    title: "A sheet ready to print",
    text: "A4 to A0 at your scale with the frame, coordinate grid, legend, north arrow, scale bar and your firm's title block, in the DXF and as a PDF.",
  },
  {
    title: "DXF for every CAD program",
    text: "DXF R12 at real coordinates opens in AutoCAD, AutoCAD LT, Civil 3D, BricsCAD, QGIS and Global Mapper. 3D lines and the TIN for Civil 3D when you want them.",
  },
  {
    title: "Your own codes",
    text: "Rename codes, add your own, choose the layer, colour, line type and symbol, then save the list and share it with the team so everyone's drawings match.",
  },
];

export const AUTO_DRAFT_STEPS: { title: string; text: string }[] = [
  { title: "Code in the field", text: "Type the code in the total station's code field as you survey: RE1 for road edge 1, TR for a tree, BLD1 CLS to close a building." },
  { title: "Open the file", text: "Drag the file onto Auto Drafting or click Open. The columns are found for you; check them once." },
  { title: "Fix the problems", text: "The Problems list shows what doesn't add up. Fix a code, and the drawing follows. Ctrl+Z undoes anything." },
  { title: "Choose the sheet", text: "Scale, paper and title block: project, client, drawing number, surveyor and date." },
  { title: "Save", text: "DXF for CAD, PDF to print or send, KML for Google Earth. The drawing that took a day is done in minutes." },
];

export const AUTO_DRAFT_FAQ: { q: string; a: string }[] = [
  { q: "Is it free?", a: "Yes. You sign in with a free SurveyX Digital account (the same one as Excel to KML, Traverse & Level and Slope Calculator) the first time you open it; create one in a minute with your email or Google." },
  { q: "Do my survey files go to the internet?", a: "No. Your points, drawings and code lists stay on your PC. The app only signs you in and notes each file you save: its name, its kind (DXF, PDF or KML) and how many points and lines it has, so we know how the program is used." },
  { q: "Does it work offline?", a: "Yes, after the first sign-in. It remembers you and opens without a connection." },
  { q: "Which CAD programs open the DXF?", a: "AutoCAD and AutoCAD LT (any version), Civil 3D, BricsCAD, ZWCAD, DraftSight, QGIS and Global Mapper. It is a DXF R12 file, the version every program reads." },
  { q: "My codes are different from yours", a: "Change them in the Codes tab: rename a code, add your own or delete one, with its layer, colour, line type and symbol. Save the list to a file and load it on the other PCs in the office." },
  { q: "Which total station files can it read?", a: "Leica GSI-8 and GSI-16, Sokkia SDR (SDR33 style) and Nikon RAW, with coordinates or with angles and distances from known stations. Anything that exports CSV or TXT works too. Send us a file it doesn't read and we will add it." },
  { q: "If Windows warns about the installer", a: "The program isn't code-signed yet, so Windows SmartScreen may say it protected your PC the first time. Choose More info, then Run anyway." },
];

// ---------------------------------------------------------------- the code guide

export const AUTO_DRAFT_CONTROLS: { word: string; also?: string; example: string; text: string }[] = [
  { word: "ST", also: "START", example: "RE1 ST", text: "Starts a new line here; the line before it ends" },
  { word: "END", example: "RE1 END", text: "This is the line's last point" },
  { word: "CLS", also: "CLOSE", example: "BLD1 CLS", text: "Closes the shape back to its first point" },
  { word: "RECT", example: "BLD2 RECT", text: "On the 3rd corner: the 4th corner is added (a rectangle) and the shape closed" },
  { word: "ARC", example: "WL1 ARC", text: "A curve starts here" },
  { word: "EARC", also: "ENDARC", example: "WL1 EARC", text: "The curve ends here; EARC ARC starts the next curve at once" },
];

export interface AutoDraftCode {
  code: string;
  name: string;
  layer: string;
  /** AutoCAD colour number */
  color: number;
  /** line codes: the line type; point codes: the symbol */
  look: string;
  contours: "breakline" | "points used" | "left out";
}

export const AUTO_DRAFT_LINE_CODES: AutoDraftCode[] = [
  { code: "BB", name: "Bottom of bank (toe)", layer: "TOE_OF_BANK", color: 2, look: "Dashed", contours: "breakline" },
  { code: "BLD", name: "Building", layer: "BUILDING", color: 140, look: "Continuous", contours: "left out" },
  { code: "CL", name: "Centre line", layer: "CENTRE_LINE", color: 6, look: "Center", contours: "breakline" },
  { code: "CV", name: "Culvert / bridge", layer: "CULVERT", color: 150, look: "Continuous", contours: "points used" },
  { code: "DR", name: "Drain", layer: "DRAIN", color: 4, look: "Continuous", contours: "breakline" },
  { code: "EP", name: "Edge of pavement", layer: "PAVEMENT_EDGE", color: 1, look: "Continuous", contours: "breakline" },
  { code: "FN", name: "Fence", layer: "FENCE", color: 3, look: "Dashed", contours: "points used" },
  { code: "FP", name: "Footpath", layer: "FOOTPATH", color: 8, look: "Continuous", contours: "breakline" },
  { code: "GT", name: "Gate", layer: "GATE", color: 30, look: "Continuous", contours: "points used" },
  { code: "HT", name: "Overhead power line", layer: "POWER_LINE", color: 1, look: "Dash-dot", contours: "left out" },
  { code: "KB", name: "Kerb", layer: "KERB", color: 30, look: "Continuous", contours: "breakline" },
  { code: "NL", name: "Nala / canal edge", layer: "NALA", color: 4, look: "Continuous", contours: "breakline" },
  { code: "PB", name: "Plot boundary", layer: "PLOT_BOUNDARY", color: 6, look: "Dash-dot", contours: "points used" },
  { code: "PIPE", name: "Pipe line", layer: "PIPE", color: 4, look: "Hidden", contours: "left out" },
  { code: "RE", name: "Road edge", layer: "ROAD_EDGE", color: 1, look: "Continuous", contours: "breakline" },
  { code: "RLY", name: "Railway", layer: "RAILWAY", color: 8, look: "Dash-dot", contours: "points used" },
  { code: "SH", name: "Shoulder", layer: "SHOULDER", color: 40, look: "Dashed", contours: "breakline" },
  { code: "TB", name: "Top of bank", layer: "TOP_OF_BANK", color: 2, look: "Continuous", contours: "breakline" },
  { code: "TRK", name: "Track / kacha road", layer: "TRACK", color: 42, look: "Dashed", contours: "breakline" },
  { code: "WE", name: "Water edge (pond)", layer: "WATER_EDGE", color: 4, look: "Dashed", contours: "breakline" },
  { code: "WL", name: "Wall", layer: "WALL", color: 7, look: "Continuous", contours: "breakline" },
];

export const AUTO_DRAFT_POINT_CODES: AutoDraftCode[] = [
  { code: "BM", name: "Benchmark", layer: "BENCHMARK", color: 6, look: "Benchmark", contours: "points used" },
  { code: "CP", name: "Control point / station", layer: "CONTROL", color: 6, look: "Control point", contours: "points used" },
  { code: "EPL", name: "Electric pole", layer: "ELECTRIC_POLE", color: 1, look: "Electric pole", contours: "points used" },
  { code: "HP", name: "Hand pump", layer: "HAND_PUMP", color: 4, look: "Hand pump", contours: "points used" },
  { code: "KM", name: "Kilometre stone", layer: "KM_STONE", color: 7, look: "Kilometre stone", contours: "points used" },
  { code: "LP", name: "Light pole", layer: "LIGHT_POLE", color: 2, look: "Light pole", contours: "points used" },
  { code: "MH", name: "Manhole", layer: "MANHOLE", color: 4, look: "Manhole", contours: "points used" },
  { code: "NGL", name: "Natural ground level", layer: "SPOT_LEVEL", color: 8, look: "Spot level", contours: "points used" },
  { code: "SB", name: "Sign board", layer: "SIGN", color: 2, look: "Sign board", contours: "points used" },
  { code: "SP", name: "Spot level", layer: "SPOT_LEVEL", color: 8, look: "Spot level", contours: "points used" },
  { code: "TBM", name: "Temporary benchmark", layer: "BENCHMARK", color: 6, look: "Benchmark", contours: "points used" },
  { code: "TF", name: "Transformer", layer: "TRANSFORMER", color: 1, look: "Transformer", contours: "points used" },
  { code: "TP", name: "Telephone pole", layer: "TELEPHONE_POLE", color: 30, look: "Telephone pole", contours: "points used" },
  { code: "TR", name: "Tree", layer: "TREE", color: 3, look: "Tree", contours: "points used" },
  { code: "TW", name: "Tubewell", layer: "TUBEWELL", color: 4, look: "Tubewell", contours: "points used" },
  { code: "VLV", name: "Valve", layer: "VALVE", color: 4, look: "Valve", contours: "points used" },
  { code: "WEL", name: "Well", layer: "WELL", color: 4, look: "Well", contours: "points used" },
];

/** A worked example: what is typed in the field, point by point, and what it draws */
export const AUTO_DRAFT_EXAMPLE: { point: string; code: string; means: string }[] = [
  { point: "1", code: "TBM", means: "Temporary benchmark symbol, with its level" },
  { point: "2", code: "RE1 ST", means: "Road edge 1 starts" },
  { point: "3", code: "RE1", means: "…road edge 1 continues" },
  { point: "4", code: "RE2 ST", means: "Road edge 2 starts (the other side)" },
  { point: "5", code: "RE1 ARC", means: "Road edge 1: a curve starts" },
  { point: "6", code: "RE1", means: "…a point on the curve" },
  { point: "7", code: "RE1 EARC", means: "…the curve ends" },
  { point: "8", code: "BLD1", means: "Building 1, first corner" },
  { point: "9", code: "BLD1", means: "…second corner" },
  { point: "10", code: "BLD1 RECT", means: "…third corner: the fourth is added and the building closed" },
  { point: "11", code: "WL1 GT1", means: "On wall 1 and gate 1 at once" },
  { point: "12", code: "TR NEEM", means: "Tree symbol; NEEM kept as a remark" },
];

/** AutoCAD colour numbers as they look on screen (dark background), for the code guide */
export const ACI_SWATCH: Record<number, string> = {
  1: "#ff0000",
  2: "#ffff00",
  3: "#00ff00",
  4: "#00ffff",
  6: "#ff00ff",
  7: "#ffffff",
  8: "#808080",
  30: "#ff8000",
  40: "#ffbf00",
  42: "#cc9900",
  140: "#00bfff",
  150: "#0080ff",
};

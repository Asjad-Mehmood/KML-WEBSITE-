// RoadPro: the AutoCAD road builder plugin. Content from the RoadPro v3.0
// user guide and shortcut sheet (both downloadable from /roadpro).

export const ROADPRO_VERSION = "3.0";
export const ROADPRO_RELEASED = "2026-10-07";

export const ROADPRO_FILES = {
  plugin: { href: "/roadpro/RoadPro.zip", name: "RoadPro.zip", label: "RoadPro plugin", detail: "RoadPro.lsp in a zip, 48 KB" },
  guidePdf: { href: "/roadpro/RoadPro_User_Guide.pdf", name: "RoadPro_User_Guide.pdf", label: "User guide", detail: "PDF, 19 pages, 390 KB" },
  guide: { href: "/roadpro/RoadPro_User_Guide.pptx", name: "RoadPro_User_Guide.pptx", label: "User guide", detail: "PowerPoint, 19 slides, 215 KB" },
  shortcuts: { href: "/roadpro/RoadPro_Shortcuts.xlsx", name: "RoadPro_Shortcuts.xlsx", label: "Shortcut keys", detail: "Excel sheet, 7 KB" },
  video: { href: "/roadpro/roadpro-demo.mp4", poster: "/roadpro/demo-cover.webp", duration: "PT2M58S" },
};

export const ROADPRO_FEATURES: { title: string; text: string }[] = [
  { title: "Road and edges", text: "Width both sides of the centre line, CL linetype, surface hatch and chainage." },
  { title: "Turning radius", text: "Every bend filleted automatically, 10 m at the centre line by default." },
  { title: "Barricades", text: "Red and white units with a black outline, left, right or median, counted for ordering." },
  { title: "Widening, tapers, junctions", text: "Add an extra lane (RDW), change the width (RDT) or join a new road with kerb returns (RDJ)." },
  { title: "Signs and markings", text: "Sign posts and schedule, white edge and lane lines, lane arrows and paint quantities." },
  { title: "Radius and sections", text: "C1 curve data and S1 straight data labelled on the plan." },
  { title: "Cross sections", text: "Layers, crossfall, barricade and sign heights, with dimensions." },
  { title: "Report and Excel", text: "Tables in the drawing plus a CSV file for Excel, saved next to the DWG." },
];

export const ROADPRO_INSTALL: { title: string; text: string }[] = [
  { title: "APPLOAD", text: "Type APPLOAD in the AutoCAD command line." },
  { title: "Load", text: "Select RoadPro.lsp and click Load." },
  { title: "Startup", text: "Contents → add it to the Startup Suite so it loads in every session." },
  { title: "RDP", text: "Type RDP to open the RoadPro dialog." },
];

export const ROADPRO_REQUIREMENTS = [
  "Full AutoCAD, Civil 3D or Map 3D 2013 or newer (AutoCAD LT is not supported)",
  "Type all sizes in metres. For millimetre drawings choose Millimeters in the dialog",
  "Save the DWG first: the Excel report is saved in the drawing's folder",
];

export const ROADPRO_COMMANDS: { short: string; full: string; text: string }[] = [
  { short: "RDP", full: "ROADPRO", text: "Build a complete road from a centre line (the main command)" },
  { short: "RDR", full: "ROADREPORT", text: "Report tables and an Excel file for any RoadPro road" },
  { short: "RDRAD", full: "ROADRADIUS", text: "Add radius, TC / CT and curve data (C1, C2 …) to the plan" },
  { short: "RDSEC", full: "ROADSECTIONS", text: "Add straight section labels (S1, S2 …) with length, area and bearing" },
  { short: "RDX", full: "ROADXSEC", text: "Cross sections: typical, at one chainage, or every interval" },
  { short: "RDW", full: "ROADWIDEN", text: "Lane widening: an extra lane between two chainages that comes back, with straight or curve tapers. Each side can have its own chainages and radius" },
  { short: "RDT", full: "ROADTAPER", text: "Road taper: wider (+) or narrower (−) between two chainages; the new width continues to the road end. Each side can have its own chainages and radius" },
  { short: "RDJ", full: "ROADJUNCTION", text: "Junction / tie-in: join a new road with kerb-return radius, opened edge, corner surface, barricades, STOP / GIVE WAY and turning-area markings" },
  { short: "RDM", full: "ROADMARK", text: "Road markings: white edge lines and lane line (broken 3 m / 6 m, solid on bends and junction approaches). Draw again to refresh, or remove" },
  { short: "—", full: "ROADPRORESET", text: "Restore all settings to the defaults (no shortcut on purpose, so you can't reset by accident)" },
];

export const ROADPRO_KEYS: { key: string; text: string }[] = [
  { key: "U", text: "Undo the whole road in one step" },
  { key: "F2", text: "Command history: the summary and the Excel file path" },
  { key: "Enter", text: "Finish the centre line, or skip a prompt such as placing tables" },
  { key: "Esc", text: "Cancel the command" },
];

export const ROADPRO_STEPS: { title: string; text: string }[] = [
  { title: "Set options", text: "RDP opens the dialog. The defaults are ready: press OK." },
  { title: "Centre line", text: "Pick points (arcs allowed, Enter to finish) or select an existing line." },
  { title: "Auto build", text: "Radius, edges, centre line, surface, barricades and chainage are drawn." },
  { title: "Signs and ends", text: "Signs with IDs, tie-in or road closed, lane arrows." },
  { title: "Report", text: "Summary on screen, Excel file saved, place the tables." },
  { title: "Cross section", text: "Pick a point to place the typical section." },
];

export const ROADPRO_DEFAULTS: [string, string][] = [
  ["Road width", "7.30 m"],
  ["Turning radius", "10 m at the centre line"],
  ["Barricade unit", "2.0 × 0.5 m, 0.5 m from the edge"],
  ["Chainage", "every 20 m"],
  ["Speed limit", "30 km/h"],
  ["Crossfall", "2.5%"],
  ["Widening / taper", "3.65 m / 30 m"],
  ["Pavement layers", "50 / 200 / 150 mm"],
];

export const ROADPRO_LAYERS: [string, string][] = [
  ["ROAD-CL", "Centre line, CL linetype"],
  ["ROAD-EDGE", "Left and right edges"],
  ["ROAD-SURFACE", "Surface hatch"],
  ["ROAD-BARRIER-RED / WHITE / OUTLINE", "Barricade fills and black outline"],
  ["ROAD-CHAINAGE", "Ticks and labels"],
  ["ROAD-CURVE", "Radius, TC / CT, C1"],
  ["ROAD-SECTION", "Straights S1, S2"],
  ["ROAD-SIGN*", "Posts, plates, symbols"],
  ["ROAD-MARKING*", "Lane arrows"],
  ["ROAD-TIEIN", "Tie-in line and E / N"],
  ["ROAD-REPORT", "Tables and legend"],
  ["ROAD-XSEC*", "Cross section parts"],
  ["ROAD-WIDENING", "Widening and taper labels"],
  ["ROAD-JUNCTION", "Junction labels, corner R"],
];

export const ROADPRO_REPORT = [
  "Summary: general, geometry, barricades, signs, road ends, chainage",
  "Curve data: TC / CT chainage, radius, arc, deflection, E / N",
  "Road sections: every straight and curve with length, edges and area",
  "Setting-out: E / N of the centre line and both edges at every chainage",
  "Sign schedule: ID, sign, chainage, side, facing and post E / N",
  "Widening, taper and junction setting-out: new edge offset, kerb returns TC / IP / CT with E / N",
  "Road markings: edge and lane line lengths and paint area in m²",
];

export const ROADPRO_FIXES: { q: string; a: string }[] = [
  { q: "Unknown command RDP", a: "Load RoadPro.lsp with APPLOAD. It needs full AutoCAD, not LT." },
  { q: "The road is 1000 times too small or too big", a: "Choose Millimeters under Drawing units for millimetre drawings." },
  { q: "Turning radius is too small", a: "At the centre line, the radius must be more than half the road width." },
  { q: "The black outline isn't visible", a: "That's the dark screen background. It still plots black." },
  { q: "The Excel file couldn't be saved", a: "Close the old CSV in Excel, then run RDR again." },
  { q: "Dimension text is the wrong size", a: "Set the dimension style's text height to 0." },
  { q: "The junction isn't formed", a: "Start the branch on the main road's centre line, away from widened or tapered edges." },
  { q: "The widening runs outside the road", a: "Start must be at least the taper-in length, and End + taper out must stay within the road." },
  { q: "A chainage isn't accepted", a: "Type 100 or 0+100. Versions before 3.0 take plain metres only." },
  { q: "Where is the Excel file?", a: "Next to the DWG, named like ROAD-01_RoadPro_Report.csv. Press F2 to see the full path." },
];

// What changed in this version, shown near the top of /roadpro
export const ROADPRO_WHATS_NEW: { title: string; text: string }[] = [
  { title: "Junctions (RDJ)", text: "Join a new road anywhere: kerb returns, opened edge, corner surface, barricades and STOP / GIVE WAY, with TC / IP / CT setting-out." },
  { title: "Road markings (RDM)", text: "White edge lines and lane line, solid on bends and junction approaches, with line lengths and paint area in the report." },
  { title: "Each side its own way", text: "Widening and tapers on both sides with their own chainages and radius, and every radius marked on the plan." },
  { title: "Type chainage your way", text: "Chainage boxes take 100 or 0+100." },
];

// The user guide: page count and the pages shown in "Look inside the user
// guide" on /roadpro (rendered from the PDF at 1280 × 720 into
// ROADPRO_GUIDE_DIR/page-NN.webp; a new folder per version, so no cached
// image of an older guide is shown)
export const ROADPRO_GUIDE_PAGE_COUNT = 19;
export const ROADPRO_GUIDE_DIR = "/roadpro/guide-v3";
export const ROADPRO_GUIDE_PAGES: { page: number; title: string; text: string }[] = [
  { page: 1, title: "RoadPro at a glance", text: "Type RDP to start: the plan view built by one command." },
  { page: 2, title: "One command builds the road", text: "Edges, radius, barricades, widening, junctions, signs and markings." },
  { page: 5, title: "Six steps", text: "From the centre line to the finished drawing, with a tip for each step." },
  { page: 9, title: "Signs placed for you", text: "Road works, speed limit, bend ahead, STOP, give way, keep right." },
  { page: 15, title: "Junctions and tie-ins", text: "New in 3.0: join a branch road with kerb returns and STOP / GIVE WAY." },
  { page: 16, title: "Road markings", text: "New in 3.0: edge and lane lines, turning-area markings and paint quantities." },
  { page: 17, title: "Report and Excel file", text: "Summary, curve data, setting-out, sign schedule and markings in a CSV." },
  { page: 19, title: "Quick reference card", text: "Every shortcut and default value on one page to print." },
];

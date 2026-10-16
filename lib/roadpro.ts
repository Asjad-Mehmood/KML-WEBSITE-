// RoadPro: the AutoCAD road builder plugin. Content from the RoadPro v3.3
// user guide and shortcut sheet (both downloadable from /roadpro).

export const ROADPRO_VERSION = "3.3";
export const ROADPRO_RELEASED = "2026-10-12";

export const ROADPRO_FILES = {
  plugin: { href: "/roadpro/RoadPro.zip", name: "RoadPro.zip", label: "RoadPro plugin", detail: "RoadPro.lsp and install notes in a zip, 60 KB" },
  guidePdf: { href: "/roadpro/RoadPro_User_Guide.pdf", name: "RoadPro_User_Guide.pdf", label: "User guide", detail: "PDF, 38 pages, 347 KB" },
  guide: { href: "/roadpro/RoadPro_User_Guide.pptx", name: "RoadPro_User_Guide.pptx", label: "User guide", detail: "PowerPoint, 38 slides, 204 KB" },
  shortcuts: { href: "/roadpro/RoadPro_Shortcuts.xlsx", name: "RoadPro_Shortcuts.xlsx", label: "Shortcut keys", detail: "Excel sheet, 7 KB" },
  video: { href: "/roadpro/roadpro-demo.mp4", poster: "/roadpro/demo-cover.webp", duration: "PT2M58S" },
};

export const ROADPRO_FEATURES: { title: string; text: string }[] = [
  { title: "Road and edges", text: "Width both sides of the centre line, CL linetype, surface hatch and chainage." },
  { title: "Turning radius", text: "Every bend filleted automatically, 10 m at the centre line by default." },
  { title: "Edges and median", text: "Red and white barricades, traffic cones or kerb stone along the road, around junction corners or on any single line, a paved shoulder, and a median of barricades or cones. All counted for ordering." },
  { title: "Widening, tapers, junctions", text: "Add an extra lane (RDW), change the width (RDT) or join a new road with kerb returns, an auxiliary lane and an island (RDJ)." },
  { title: "Signs and markings", text: "Signs sized by speed limit, delineator posts on curves, centre and edge lines, lane arrows and paint quantities." },
  { title: "Radius and sections", text: "C1 curve data and S1 straight data labelled on the plan." },
  { title: "Cross sections", text: "Layers, crossfall, shoulder, barricade, cone or kerb, and sign heights, with dimensions." },
  { title: "Report and Excel", text: "Tables in the drawing plus a CSV file for Excel, saved next to the DWG." },
];

export const ROADPRO_INSTALL: { title: string; text: string }[] = [
  { title: "APPLOAD", text: "Type APPLOAD in the AutoCAD command line." },
  { title: "Load", text: "Select RoadPro.lsp and click Load." },
  { title: "Startup", text: "Contents → add it to the Startup Suite so it loads in every session." },
  { title: "RDP", text: "Type RDP to open the RoadPro dialog." },
];

export const ROADPRO_REQUIREMENTS = [
  "Full AutoCAD, Civil 3D or Map 3D 2014 or newer (AutoCAD LT is not supported)",
  "Type all sizes in metres. For millimetre drawings choose Millimeters in the dialog",
  "Save the DWG first: the Excel report is saved in the drawing's folder",
];

export const ROADPRO_COMMANDS: { short: string; full: string; text: string }[] = [
  { short: "RDP", full: "ROADPRO", text: "Build a complete road from a centre line (the main command)" },
  { short: "RDR", full: "ROADREPORT", text: "Report tables and an Excel file for any RoadPro road" },
  { short: "RDRAD", full: "ROADRADIUS", text: "Add radius, TC / CT and curve data (C1, C2 …) to the plan" },
  { short: "RDSEC", full: "ROADSECTIONS", text: "Add straight section labels (S1, S2 …) with length, area and bearing" },
  { short: "RDX", full: "ROADXSEC", text: "Cross sections: typical, at one chainage, or every interval" },
  { short: "RDW", full: "ROADWIDEN", text: "Lane widening: an extra lane between two chainages that comes back, with straight or curve tapers. Each side can have its own chainages and radius. Barricades, cones and kerb stone move to the new edge" },
  { short: "RDT", full: "ROADTAPER", text: "Road taper: wider (+) or narrower (−) between two chainages; the new width continues to the road end. Each side can have its own chainages and radius. Barricades, cones and kerb stone move to the new edge" },
  { short: "RDJ", full: "ROADJUNCTION", text: "Junction / tie-in: join a new road with kerb-return radius, opened edge, corner surface, corner treatment (barricades, traffic cones or kerb stone, or the same as the main road), STOP / GIVE WAY and turning-area markings. Optional auxiliary lane (long approach taper, storage, short departure taper) and a kerbed or painted splitter island" },
  { short: "RDM", full: "ROADMARK", text: "Road markings: yellow L4 edge lines, white L1 lane / centre line with its pattern set by speed, L2 / L2A at bends, gaps at junctions, broken L5 beside auxiliary lanes. Draw again to refresh, or remove" },
  { short: "RDL", full: "ROADLINE", text: "New in 3.3. A single run of barricades, traffic cones or kerb stone along any line, polyline, arc, spline, circle or ellipse: on the line, left, right or both sides, between two distances along it, with a quantity label. No road needed" },
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
  ["Turning radius", "Match existing, or manual (10 m at the centre line)"],
  ["Edge / centre", "Barricades / centre lines"],
  ["Paved shoulder", "0.50 m"],
  ["Barricade unit", "2.0 × 0.5 m, 0.5 m from the edge"],
  ["Chainage", "every 20 m"],
  ["Speed limit", "30 km/h"],
  ["Sign sizes", "By speed (Oman HDS 2017)"],
  ["Crossfall", "2.5%"],
  ["Widening / taper", "3.65 m / 30 m"],
  ["Auxiliary lane", "3.65 m, tapers 60 m / 30 m, storage 30 m"],
  ["Junction corners", "Same as the main road edge"],
  ["Single line (RDL)", "0.50 m offset, 2.00 m units or cone spacing"],
  ["Pavement layers", "50 / 200 / 150 mm"],
];

export const ROADPRO_LAYERS: [string, string][] = [
  ["ROAD-CL", "Centre line, CL linetype"],
  ["ROAD-EDGE", "Left and right edges"],
  ["ROAD-SURFACE", "Surface hatch"],
  ["ROAD-BARRIER-RED / WHITE / OUTLINE", "Barricade fills and black outline"],
  ["ROAD-CONE / ROAD-CONE-BAND", "Traffic cones and their white band"],
  ["ROAD-KERB", "Kerb stone units"],
  ["ROAD-CHAINAGE", "Ticks and labels"],
  ["ROAD-CURVE", "Radius, TC / CT, C1"],
  ["ROAD-SECTION", "Straights S1, S2"],
  ["ROAD-SIGN*", "Posts, plates, symbols"],
  ["ROAD-MARKING*", "Lane arrows"],
  ["ROAD-TIEIN", "Tie-in line and E / N"],
  ["ROAD-REPORT", "Tables and legend"],
  ["ROAD-XSEC*", "Cross section parts"],
  ["ROAD-WIDENING", "Widening and taper labels"],
  ["ROAD-JUNCTION", "Junction labels, corner R, RDL labels"],
];

export const ROADPRO_REPORT = [
  "Summary: general, geometry, barricades, signs, road ends, chainage",
  "Curve data: TC / CT chainage, radius, arc, deflection, E / N",
  "Road sections: every straight and curve with length, edges and area",
  "Setting-out: E / N of the centre line and both edges at every chainage",
  "Sign schedule: ID, sign, chainage, side, facing and post E / N",
  "Widening, taper and junction setting-out: new edge offset, kerb returns TC / IP / CT with E / N",
  "Quantities: barricades red / white, traffic cones (nos) and kerb stone (m) per side, and the paved shoulder area",
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
  { q: "The island lanes are too narrow", a: "RoadPro warns when a lane beside the island is under 2.75 m. Make the island narrower or the branch road wider." },
  { q: "RDL placed nothing", a: "From / To is outside the line length, or the spacing is longer than the line. Set To = 0 for the line end." },
  { q: "Where is the Excel file?", a: "Next to the DWG, named like ROAD-01_RoadPro_Report.csv. Press F2 to see the full path." },
];

// What changed in this version, shown near the top of /roadpro
export const ROADPRO_WHATS_NEW: { title: string; text: string }[] = [
  { title: "RDL: a single line", text: "A new command: one run of barricades, traffic cones or kerb stone along any line, polyline, arc, spline, circle or ellipse. Centred, left, right or both sides, from / to a distance, with a quantity label." },
  { title: "Junction corner treatment", text: "RDJ lines the kerb returns with barricades, traffic cones or kerb stone, or the same as the main road. The count is printed and added to the road." },
  { title: "Cones and kerb follow changes", text: "Lane widening (RDW) and road tapers (RDT) now move traffic cones and kerb stone to the new edge, not only barricades, and take removed units out of the count." },
  { title: "Kerb units and cone band", text: "Kerb stone is drawn as separate units, cones get their white reflective band, and the report gives cones (nos) and kerb (m) for each side." },
];

// Shown under "New in": moving up from the last version
export const ROADPRO_UPGRADE_NOTE =
  "Upgrading from 3.2? Load the new RoadPro.lsp with APPLOAD and replace the old file in the Startup Suite. Your saved settings are kept, and roads drawn with 3.2 work with every 3.3 command.";

// Where the sign and marking values come from, shown under "New in"
export const ROADPRO_STANDARDS_NOTE =
  "Sign sizes, warning distances and road markings follow the Oman Highway Design Standards 2017, Section 19 (GCC Manual based). For projects in Qatar, check them against the Qatar Traffic Control Manual (QTCM). Every value can be changed in the dialogs.";

// The user guide: page count and the pages shown in "Look inside the user
// guide" on /roadpro (rendered from the PDF at 1280 × 720 into
// ROADPRO_GUIDE_DIR/page-NN.webp; a new folder per version, so no cached
// image of an older guide is shown)
export const ROADPRO_GUIDE_PAGE_COUNT = 38;
export const ROADPRO_GUIDE_DIR = "/roadpro/guide-v33";
export const ROADPRO_GUIDE_PAGES: { page: number; title: string; text: string }[] = [
  { page: 1, title: "RoadPro user manual", text: "Every command and every setting, step by step from start to finish." },
  { page: 3, title: "One centre line in, a complete road out", text: "Edges, cones or kerb, signs, markings, junction, chainage and the report." },
  { page: 4, title: "What is new in 3.3", text: "The RDL single line, junction corners, and cones and kerb that follow widening." },
  { page: 14, title: "Barricades, cones or kerb stone", text: "How to set the edge treatment along a road, at a junction or on one line." },
  { page: 26, title: "Junctions and tie-ins", text: "Join a branch road with kerb returns, signs and STOP / GIVE WAY." },
  { page: 28, title: "Junction corners", text: "New: barricades, cones or kerb stone around the kerb returns." },
  { page: 30, title: "RDL: a single line", text: "New: a lane closure, work zone or kerb along any line, without building a road." },
  { page: 37, title: "Quick reference card", text: "Every shortcut and default value on one page to print." },
];

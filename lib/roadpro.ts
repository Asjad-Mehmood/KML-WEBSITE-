// RoadPro: the AutoCAD road builder plugin. Content from the RoadPro v3.4
// user guide and shortcut sheet (both downloadable from /roadpro).

export const ROADPRO_VERSION = "3.4";
export const ROADPRO_RELEASED = "2026-10-23";

export const ROADPRO_FILES = {
  plugin: { href: "/roadpro/RoadPro.zip", name: "RoadPro.zip", label: "RoadPro plugin", detail: "RoadPro.lsp, the RP_PAVER hatch pattern and install notes in a zip, 83 KB" },
  guidePdf: { href: "/roadpro/RoadPro_User_Guide.pdf", name: "RoadPro_User_Guide.pdf", label: "User guide", detail: "PDF, 47 pages, 712 KB" },
  guide: { href: "/roadpro/RoadPro_User_Guide.pptx", name: "RoadPro_User_Guide.pptx", label: "User guide", detail: "PowerPoint, 47 slides, 596 KB" },
  shortcuts: { href: "/roadpro/RoadPro_Shortcuts.xlsx", name: "RoadPro_Shortcuts.xlsx", label: "Shortcut keys", detail: "Excel sheet, 8 KB" },
  video: { href: "/roadpro/roadpro-demo.mp4", poster: "/roadpro/demo-cover.webp", duration: "PT2M58S" },
  // a one-minute tour of the user manual, with sound
  manualVideo: { href: "/roadpro/roadpro-manual-tour.mp4", poster: "/roadpro/manual-tour-cover.webp", duration: "PT1M" },
};

export const ROADPRO_FEATURES: { title: string; text: string }[] = [
  { title: "Lanes and corridor", text: "Single or dual carriageway, lanes set by hand or automatically, a flush or raised median, sidewalks and walkways with a paver hatch, drains and utility strips." },
  { title: "Turning radius", text: "Every bend filleted automatically, 10 m at the centre line by default, and any radius changed later with RDER." },
  { title: "Edges and median", text: "Red and white barricades, traffic cones or kerb stone along the road, around junction corners or on any single line, a paved shoulder, and a median of barricades or cones. All counted for ordering." },
  { title: "Widening, tapers, junctions", text: "Add an extra lane (RDW), change the width (RDT) or join a new road with kerb returns, an auxiliary lane and an island (RDJ)." },
  { title: "Signs and markings", text: "Signs sized by speed limit, delineator posts on curves, centre and edge lines, lane arrows and paint quantities." },
  { title: "Radius and sections", text: "C1 curve data and S1 straight data labelled on the plan." },
  { title: "Cross sections", text: "Layers, crossfall, shoulder, barricade, cone or kerb, and sign heights, with dimensions." },
  { title: "Report, Excel and LandXML", text: "Tables in the drawing plus a CSV file for Excel, saved next to the DWG, and the centre line as LandXML for Civil 3D." },
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
  { short: "RDL", full: "ROADLINE", text: "A single run of barricades, traffic cones or kerb stone along any line, polyline, arc, spline, circle or ellipse: on the line, left, right or both sides, between two distances along it, with a quantity label. No road needed" },
  { short: "RDC", full: "ROADCORRIDOR", text: "New in 3.4. Lanes, median, sidewalks, walkways, drains and utility corridors of a road: single or dual carriageway, lanes by hand (left and right can differ) or automatic, with lane lines and arrows" },
  { short: "RDU", full: "ROADUPDATE", text: "New in 3.4. Redraw a road's corridor and markings after edits" },
  { short: "RDER", full: "ROADEDITRADIUS", text: "New in 3.4. Change a curve radius after the road is built: the curve is re-fitted between the same straights and the road rebuilt with its own settings" },
  { short: "RDB", full: "ROADREBUILD", text: "New in 3.4. Rebuild the road after editing its centre line by hand (grips, Properties or PEDIT)" },
  { short: "RDLX", full: "ROADLANDXML", text: "New in 3.4. Export the centre line as a LandXML 1.2 alignment for Civil 3D (Insert → LandXML)" },
  { short: "RDLXI", full: "ROADLANDXMLIN", text: "New in 3.4. Import LandXML alignments as polylines, ready for RDP" },
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
  ["Lane / median width", "3.65 m / 3.00 m"],
  ["Sidewalk / walkway", "2.00 m / 2.50 m"],
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
  ["ROAD-MEDIAN (-KERB)", "Median fill or hatch and kerbs"],
  ["ROAD-SIDEWALK / ROAD-WALKWAY", "Sidewalks and walkways, paver hatch"],
  ["ROAD-DRAIN / ROAD-UTILITY", "Drainage and utility corridor provisions"],
  ["ROAD-LANDXML", "Imported LandXML alignments"],
];

export const ROADPRO_REPORT = [
  "Summary: general, geometry, barricades, signs, road ends, chainage",
  "Curve data: TC / CT chainage, radius, arc, deflection, E / N",
  "Road sections: every straight and curve with length, edges and area",
  "Setting-out: E / N of the centre line and both edges at every chainage",
  "Sign schedule: ID, sign, chainage, side, facing and post E / N",
  "Widening, taper, junction and corridor: new edge offsets, kerb returns TC / IP / CT with E / N, and lanes, median, sidewalks, walkways, drains and utilities (length and area)",
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
  { q: "Walkways show herringbone, not the paver", a: "RP_PAVER.pat couldn't be written or found. Copy it from the zip to an AutoCAD Support folder." },
  { q: "RDER refuses a curve", a: "A curve that touches another curve, or sits at the line end, needs a straight each side. Edit the centre line by hand, then run RDB." },
  { q: "A Civil 3D alignment isn't converted", a: "Use the LandXML route: Insert → LandXML in Civil 3D with RDLX / RDLXI, or explode a copy of the alignment to a polyline." },
  { q: "Where is the Excel file?", a: "Next to the DWG, named like ROAD-01_RoadPro_Report.csv. Press F2 to see the full path." },
];

// What changed in this version, shown near the top of /roadpro
export const ROADPRO_WHATS_NEW: { title: string; text: string }[] = [
  { title: "The full corridor", text: "Single or dual carriageway, lanes by hand or automatic (indicative only), a flush or raised median, sidewalks and walkways, drains and utility corridors. In plan, cross section and report (RDC / RDU)." },
  { title: "Interlocking paver hatch", text: "Sidewalks and walkways get an I-shape paver hatch (RP_PAVER) that turns with the road; herringbone or any other pattern as options." },
  { title: "Edit the radius later", text: "RDER changes any curve radius after the road is built and rebuilds it with its own settings. RDB rebuilds after you edit the centre line by hand." },
  { title: "Civil 3D and LandXML", text: "Export the centre line as LandXML 1.2 (RDLX), import LandXML alignments (RDLXI), or select a Civil 3D alignment in RDP. Alignments are checked first." },
];

// Shown under "New in": moving up from the last version, and how 3.4 was tested
export const ROADPRO_UPGRADE_NOTE =
  "Upgrading? Load the new RoadPro.lsp with APPLOAD and replace the old file in the Startup Suite. Your settings are kept, and roads drawn with 3.2 or 3.3 work with every 3.4 command. Version 3.4 passed 105 automated checks in an AutoLISP emulator but hasn't yet been run in AutoCAD or Civil 3D, so try it on a copy of a drawing first. Lane counts, drains and utility corridors are geometric provisions for the design engineer to confirm.";

// Where the sign and marking values come from, shown under "New in"
export const ROADPRO_STANDARDS_NOTE =
  "Sign sizes, warning distances and road markings follow the Oman Highway Design Standards 2017, Section 19 (GCC Manual based). For projects in Qatar, check them against the Qatar Traffic Control Manual (QTCM) and QHDM. Every value can be changed in the dialogs.";

// The user guide: page count and the pages shown in "Look inside the user
// guide" on /roadpro (rendered from the PDF at 1280 × 720 into
// ROADPRO_GUIDE_DIR/page-NN.webp; a new folder per version, so no cached
// image of an older guide is shown)
export const ROADPRO_GUIDE_PAGE_COUNT = 47;
export const ROADPRO_GUIDE_DIR = "/roadpro/guide-v34";
export const ROADPRO_GUIDE_PAGES: { page: number; title: string; text: string }[] = [
  { page: 1, title: "RoadPro user manual", text: "Every command and every setting, step by step from start to finish." },
  { page: 38, title: "The full corridor in one build", text: "New: dual carriageway, raised median, sidewalks, walkways, drains and utilities." },
  { page: 39, title: "Carriageway and lanes", text: "New: lanes by hand or automatic from the design volume." },
  { page: 41, title: "Beyond the road edge", text: "New: sidewalks, walkways, drains and utility corridors, each side on its own." },
  { page: 43, title: "Interlocking paver hatch", text: "New: an I-shape paver on sidewalks and walkways that follows the road." },
  { page: 44, title: "Change a radius later", text: "New: RDER re-fits a curve and rebuilds the road; RDB after hand edits." },
  { page: 45, title: "Civil 3D and LandXML", text: "New: export and import alignments, or select one in RDP." },
  { page: 37, title: "Quick reference card", text: "Every shortcut and default value on one page to print." },
];

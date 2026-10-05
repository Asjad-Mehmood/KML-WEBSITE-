// RoadPro: the AutoCAD road builder plugin. Content from the RoadPro v2.6
// user guide and shortcut sheet (both downloadable from /roadpro).

export const ROADPRO_VERSION = "2.6";
export const ROADPRO_RELEASED = "2026-10-05";

export const ROADPRO_FILES = {
  plugin: { href: "/roadpro/RoadPro.zip", name: "RoadPro.zip", label: "RoadPro plugin", detail: "RoadPro.lsp in a zip, 37 KB" },
  guidePdf: { href: "/roadpro/RoadPro_User_Guide.pdf", name: "RoadPro_User_Guide.pdf", label: "User guide", detail: "PDF, 16 pages, 515 KB" },
  guide: { href: "/roadpro/RoadPro_User_Guide.pptx", name: "RoadPro_User_Guide.pptx", label: "User guide", detail: "PowerPoint, 16 slides, 190 KB" },
  shortcuts: { href: "/roadpro/RoadPro_Shortcuts.xlsx", name: "RoadPro_Shortcuts.xlsx", label: "Shortcut keys", detail: "Excel sheet, 7 KB" },
  video: { href: "/roadpro/roadpro-demo.mp4", poster: "/roadpro/demo-cover.webp", duration: "PT2M58S" },
};

export const ROADPRO_FEATURES: { title: string; text: string }[] = [
  { title: "Road and edges", text: "Width both sides of the centre line, CL linetype, surface hatch and chainage." },
  { title: "Turning radius", text: "Every bend filleted automatically, 10 m at the centre line by default." },
  { title: "Barricades", text: "Red and white units with a black outline, left, right or median, counted for ordering." },
  { title: "Widening and tapers", text: "Add an extra lane (RDW) or change the width (RDT) at any chainage." },
  { title: "Signs and markings", text: "Sign posts and plates with IDs, lane arrows, chevrons and a sign schedule." },
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
  { short: "RDW", full: "ROADWIDEN", text: "Lane widening: an extra lane between two chainages that comes back, with straight or curve tapers" },
  { short: "RDT", full: "ROADTAPER", text: "Road taper: wider (+) or narrower (−) between two chainages; the new width continues to the road end" },
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
];

export const ROADPRO_REPORT = [
  "Summary: general, geometry, barricades, signs, road ends, chainage",
  "Curve data: TC / CT chainage, radius, arc, deflection, E / N",
  "Road sections: every straight and curve with length, edges and area",
  "Setting-out: E / N of the centre line and both edges at every chainage",
  "Sign schedule: ID, sign, chainage, side, facing and post E / N",
  "Widening and taper setting-out at match points and stations",
];

export const ROADPRO_FIXES: { q: string; a: string }[] = [
  { q: "Unknown command RDP", a: "Load RoadPro.lsp with APPLOAD. It needs full AutoCAD, not LT." },
  { q: "The road is 1000 times too small or too big", a: "Choose Millimeters under Drawing units for millimetre drawings." },
  { q: "Turning radius is too small", a: "At the centre line, the radius must be more than half the road width." },
  { q: "The black outline isn't visible", a: "That's the dark screen background. It still plots black." },
  { q: "The Excel file couldn't be saved", a: "Close the old CSV in Excel, then run RDR again." },
  { q: "Dimension text is the wrong size", a: "Set the dimension style's text height to 0." },
  { q: "Where is the Excel file?", a: "Next to the DWG, named like ROAD-01_RoadPro_Report.csv. Press F2 to see the full path." },
];

// Pages shown in "Look inside the user guide" on /roadpro (images rendered
// from the PDF at 1280 × 720 into public/roadpro/guide/page-NN.webp)
export const ROADPRO_GUIDE_PAGES: { page: number; title: string; text: string }[] = [
  { page: 1, title: "RoadPro at a glance", text: "Type RDP to start: the plan view built by one command." },
  { page: 2, title: "One command builds the road", text: "Edges, radius, barricades, widening, signs, sections and the report." },
  { page: 5, title: "Six steps", text: "From the centre line to the finished drawing, with a tip for each step." },
  { page: 9, title: "Signs placed for you", text: "Road works, speed limit, bend ahead, STOP, give way, keep right." },
  { page: 11, title: "Cross sections", text: "Typical, at one chainage or every interval, with crossfall and heights." },
  { page: 12, title: "Lane widening", text: "Tapers, match points and fillets: the three ways to join the new lane." },
  { page: 14, title: "Report and Excel file", text: "Summary, curve data, setting-out and the sign schedule in a CSV." },
  { page: 16, title: "Quick reference card", text: "Every shortcut and default value on one page to print." },
];

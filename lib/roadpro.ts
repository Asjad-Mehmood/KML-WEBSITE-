// RoadPro: the AutoCAD road builder plugin. Content from the RoadPro v3.6
// user guide, notes and shortcut sheet (all downloadable from /roadpro).

// The AutoCAD plugin's own version (RoadPro.lsp, the plugin-only zip, what the Survey Toolkit installs)
export const ROADPRO_VERSION = "3.6.1";
export const ROADPRO_RELEASED = "2026-11-11";

// The newest RoadPro release (RoadPro Setup: RoadPro Hub and the plugin). 3.6.2 brought the new Hub
// and its update notice; the plugin inside is still 3.6.1. The release's tag on GitHub.
export const ROADPRO_RELEASE = "3.6.2";
export const ROADPRO_RELEASE_DATE = "2026-11-12";

// RoadPro Setup: installs RoadPro Hub and the plugin, then keeps them up to date (from 3.6.1).
// Built by the Road-pro repository's release workflow. GitHub's newest full release (3.6.2 on):
// a release marked pre-release is skipped by "latest", so publish each one as Latest.
export const ROADPRO_REPO = "Asjad-Mehmood/Road-pro";
export const ROADPRO_SETUP_URL = `https://github.com/${ROADPRO_REPO}/releases/latest/download/RoadPro_Setup.exe`;

export const ROADPRO_FILES = {
  setup: { href: ROADPRO_SETUP_URL, name: "RoadPro_Setup.exe", label: "RoadPro Setup", detail: "Installs RoadPro Hub and the AutoCAD plugin, and keeps them up to date. Windows, 8.6 MB" },
  plugin: { href: "/roadpro/RoadPro.zip", name: "RoadPro.zip", label: "Plugin only (zip)", detail: "RoadPro.lsp, the RP_PAVER hatch pattern and install notes, to load with APPLOAD. No automatic updates. 124 KB" },
  guidePdf: { href: "/roadpro/RoadPro_User_Guide.pdf", name: "RoadPro_User_Guide.pdf", label: "User guide", detail: "PDF, 52 pages, 6.0 MB (version 3.6)" },
  guide: { href: "/roadpro/RoadPro_User_Guide.pptx", name: "RoadPro_User_Guide.pptx", label: "User guide", detail: "PowerPoint of the 3.5 guide, 44 slides, 5.1 MB" },
  shortcuts: { href: "/roadpro/RoadPro_Shortcuts.xlsx", name: "RoadPro_Shortcuts.xlsx", label: "Shortcut keys", detail: "Excel sheet, 11 KB" },
  video: { href: "/roadpro/roadpro-demo.mp4", poster: "/roadpro/demo-cover.webp", duration: "PT2M58S" },
  // a one-minute tour of the user manual, with sound
  manualVideo: { href: "/roadpro/roadpro-manual-tour.mp4", poster: "/roadpro/manual-tour-cover.webp", duration: "PT1M" },
};

export const ROADPRO_FEATURES: { title: string; text: string }[] = [
  { title: "Lanes and corridor", text: "Single or dual carriageway, lanes set by hand or automatically, a flush or raised median, sidewalks and walkways with a paver hatch, drains and utility strips." },
  { title: "Turning radius", text: "Every bend filleted automatically, 10 m at the centre line by default, and any radius changed later with RDER." },
  { title: "Edges and median", text: "Red and white barricades, traffic cones or kerb stone along the road, around junction corners or on any single line, a paved shoulder, and a median of barricades or cones. All counted for ordering." },
  { title: "Widening, tapers, junctions", text: "Add an extra lane (RDW), change the width (RDT) or join a new road with kerb returns, an auxiliary lane, an island and sight triangles (RDJ), by hand or from the Saudi Arabia standard." },
  { title: "Roundabouts", text: "Twelve FHWA and NCHRP 672 designs, from mini to multilane with spiral marking: islands, apron, splitter islands, crossings, signs and setting-out (RDRB, or a junction type in RDJ)." },
  { title: "Asphalt or concrete pavement", text: "Flexible or concrete JPCP / JRCP with dowels, tie bars and mesh: the joint plan, the layers in section and the volumes and steel in the report (RDPV)." },
  { title: "Live update", text: "Grip-edit, move, rotate or stretch a centre line and the road rebuilds itself, with its widenings, tapers, junctions and roundabouts." },
  { title: "Signs and markings", text: "Signs sized by speed limit, delineator posts on curves, centre and edge lines, lane arrows and paint quantities." },
  { title: "Radius and sections", text: "C1 curve data and S1 straight data labelled on the plan." },
  { title: "Cross sections", text: "Layers, crossfall, shoulder, barricade, cone or kerb, and sign heights, with dimensions." },
  { title: "Report, Excel and LandXML", text: "Tables in the drawing plus a CSV file for Excel, saved next to the DWG, and the centre line as LandXML for Civil 3D." },
];

export const ROADPRO_INSTALL: { title: string; text: string }[] = [
  { title: "Run RoadPro_Setup.exe", text: "No administrator rights needed. It installs RoadPro Hub and the AutoCAD plugin, and replaces any older RoadPro by itself." },
  { title: "Start AutoCAD", text: "RoadPro loads in every drawing. If an update is waiting, AutoCAD says so at start-up; RDHUB opens RoadPro Hub." },
  { title: "RDP", text: "Type RDP to open the RoadPro dialog. RDHELP lists every command; MENUBAR = 1 shows the RoadPro menu." },
  { title: "Updates", text: "RoadPro Hub checks for a new version when you open it and once a day: one click downloads, checks and installs it, and keeps the previous version." },
];

/** Without the setup: the plugin zip, loaded once with APPLOAD (no automatic updates) */
export const ROADPRO_ZIP_INSTALL =
  "Plugin only: unzip RoadPro.zip, type APPLOAD in AutoCAD, load RoadPro.lsp once and close. It copies itself to %APPDATA%\\RoadPro and joins the Startup Suite. Civil 3D: once in each profile you use.";

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
  { short: "RDW", full: "ROADWIDEN", text: "Lane widening: an extra lane between two chainages that comes back, with straight or curve tapers. Each side can have its own chainages and radius. Barricades, cones and kerb stone move to the new edge" },
  { short: "RDT", full: "ROADTAPER", text: "Road taper: wider (+) or narrower (−) between two chainages; the new width continues to the road end. Each side can have its own chainages and radius. Barricades, cones and kerb stone move to the new edge" },
  { short: "RDJ", full: "ROADJUNCTION", text: "Junction / tie-in: join a new road with kerb-return radius, opened edge, corner surface, corner treatment (barricades, traffic cones or kerb stone, or the same as the main road), STOP / GIVE WAY and turning-area markings. Optional auxiliary lane (long approach taper, storage, short departure taper) and a kerbed or painted splitter island. The Saudi Arabia standard (SHC 301 / MOMRA) fills the corner radius, auxiliary lane, tapers, storage and island from the road class and design vehicle, sight triangles are drawn, sidewalks and drains wrap round the corners, and the junction type can be a roundabout" },
  { short: "RDRB", full: "ROADROUNDABOUT", text: "A roundabout on a road: pick a point or chainage, choose one of twelve FHWA 2000 / NCHRP 672 designs (inscribed radius, circulatory width, apron, entry and exit radii, splitter islands, lanes and speed, all editable) and draw or select the side roads" },
  { short: "RDPV", full: "ROADPAVEMENT", text: "Asphalt or concrete JPCP / JRCP pavement for a built road: joints on plan, layers, dowels, tie bars and mesh in the section, volumes and steel in the report" },
  { short: "RDM", full: "ROADMARK", text: "Road markings: yellow L4 edge lines, white L1 lane / centre line with its pattern set by speed, L2 / L2A at bends, gaps at junctions, broken L5 beside auxiliary lanes. Draw again to refresh, or remove" },
  { short: "RDL", full: "ROADLINE", text: "A single run of barricades, traffic cones or kerb stone along any line, polyline, arc, spline, circle or ellipse: on the line, left, right or both sides, between two distances along it, with a quantity label. No road needed" },
  { short: "RDC", full: "ROADCORRIDOR", text: "Lanes, median, sidewalks, walkways, drains and utility corridors of a road: single or dual carriageway, lanes by hand (left and right can differ) or automatic, with lane lines and arrows" },
  { short: "RDU", full: "ROADUPDATE", text: "Redraw a road's corridor and markings after edits" },
  { short: "RDER", full: "ROADEDITRADIUS", text: "Change a curve radius after the road is built: the curve is re-fitted between the same straights and the road rebuilt with its own settings, widenings, tapers, junctions and roundabouts included" },
  { short: "RDB", full: "ROADREBUILD", text: "Rebuild the road after editing its centre line by hand, replaying its widenings, tapers, junctions and roundabouts" },
  { short: "RDLIVE", full: "ROADLIVE", text: "Live update on or off (on by default): edit a centre line with grips, MOVE, ROTATE, STRETCH or PEDIT and the road rebuilds when the command ends. One U undoes it" },
  { short: "RDLX", full: "ROADLANDXML", text: "Export the centre line as a LandXML 1.2 alignment for Civil 3D (Insert → LandXML)" },
  { short: "RDLXI", full: "ROADLANDXMLIN", text: "Import LandXML alignments as polylines, ready for RDP" },
  { short: "RDINSTALL", full: "ROADPROINSTALL", text: "Install RoadPro permanently again (it does this by itself the first time it is loaded)" },
  { short: "RDUNINSTALL", full: "ROADPROUNINSTALL", text: "Take RoadPro out of the Startup Suite. Drawings are not changed" },
  { short: "RDHELP", full: "ROADHELP", text: "List every command" },
  { short: "RDHUB", full: "ROADPROHUB", text: "New in 3.6.1. Open RoadPro Hub: check for and install updates, repair, the user guide and the shortcut keys" },
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
  ["Pavement type", "Flexible (asphalt); concrete JPCP / JRCP as options"],
  ["Junction standard", "Manual; Saudi Arabia (SHC 301 / MOMRA) as an option"],
  ["Roundabout", "FHWA 2000 urban double lane, spiral marking"],
  ["Live update", "On (RDLIVE)"],
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
  ["ROAD-ROUNDABOUT / ROAD-RB-ISLAND / ROAD-RB-APRON", "Roundabout kerb and lines, central and splitter islands, truck apron"],
  ["ROAD-SIGHT", "Junction sight triangles"],
  ["ROAD-CONC-JOINT", "Concrete pavement joints and label"],
  ["ROAD-XSEC-PCC / -EARTH / -STEEL", "Concrete slab, earthwork, dowels, tie bars and mesh in the section"],
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
  "Concrete pavement: concrete, base and earthwork volumes, joint lengths, dowels and tie bars (number and weight), mesh and total steel, neat with no wastage",
  "Roundabouts and junction sight triangles: radii, ICD, setting-out and the sight distances used",
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
  { q: "RoadPro doesn't load in a new drawing", a: "Load RoadPro.lsp with APPLOAD once more, or type RDINSTALL. If AutoCAD asks about loading it, choose Always load. In Civil 3D, install once in each profile you use." },
  { q: "Editing the centre line didn't update the road", a: "Check that live update is on (RDLIVE). Roads built with 3.4 or earlier need one rebuild (RDB) first; then edits, widenings and junctions follow." },
  { q: "Where is the Excel file?", a: "Next to the DWG, named like ROAD-01_RoadPro_Report.csv. Press F2 to see the full path." },
];

// What changed in this version, shown near the top of /roadpro
export const ROADPRO_WHATS_NEW: { title: string; text: string }[] = [
  { title: "Automatic updates", text: "RoadPro Setup installs RoadPro Hub, which checks for a new RoadPro when you open it and once a day: one click downloads it, checks its size and SHA-256 and installs it, plugin included. The previous version is kept." },
  { title: "RDHUB", text: "A new command opens RoadPro Hub from AutoCAD: updates, repair, the user guide and shortcut keys. AutoCAD also says at start-up when an update is waiting." },
  { title: "Clean junction tie-in", text: "RDJ: the side road starts where the kerb returns end, with one mouth surface joined to the main road, no overlaps or black wedges, also on skewed junctions and with an auxiliary lane and island." },
  { title: "Roundabouts on a road", text: "RDRB: 2-way, T left, T right or 4-way, side roads drawn, picked or automatic, the main road cut cleanly at the ring and full marking on every approach." },
  { title: "Edits follow", text: "After a grip edit the bend is refitted tangent at its radius, so barricades, edges and corridor follow; moving a centre line keeps junction and roundabout side roads attached." },
  { title: "Professional cross sections", text: "RDX draws to the corridor limit with three dimension rows (components, roadside and carriageway, total width) and a table of offsets and finished levels." },
];

// Shown under "New in": moving up from the last version, and how 3.5 was tested
export const ROADPRO_UPGRADE_NOTE =
  "Upgrading? Run RoadPro Setup: it replaces the older RoadPro by itself and from then on updates RoadPro for you. With the plugin zip, load the new RoadPro.lsp with APPLOAD once. Your settings are kept and roads drawn with earlier versions keep working. Version 3.6 passed a full regression of 3.5 plus 34 new drawing checks. The Saudi junction values, roundabout sizes and concrete quantities are typical values for the design engineer to check against the project standard.";

// Where the sign and marking values come from, shown under "New in"
export const ROADPRO_STANDARDS_NOTE =
  "Sign sizes, warning distances and road markings follow the Oman Highway Design Standards 2017, Section 19 (GCC Manual based); junctions can use the Saudi Arabia SHC 301 / MOMRA values and roundabouts FHWA 2000 or NCHRP 672. For projects in Qatar, check them against the Qatar Traffic Control Manual (QTCM) and QHDM. Every value can be changed in the dialogs.";

// The user guide: page count and the pages shown in "Look inside the user
// guide" on /roadpro (rendered from the PDF at 1280 × 720 into
// ROADPRO_GUIDE_DIR/page-NN.webp; a new folder per version, so no cached
// image of an older guide is shown)
export const ROADPRO_GUIDE_PAGE_COUNT = 52;
export const ROADPRO_GUIDE_DIR = "/roadpro/guide-v36";
export const ROADPRO_GUIDE_PAGES: { page: number; title: string; text: string }[] = [
  { page: 1, title: "RoadPro user guide", text: "Every command and every setting, step by step from start to finish." },
  { page: 2, title: "What's new in 3.6", text: "Every point of the error report fixed, plus 3-way and 4-way roundabouts." },
  { page: 45, title: "Junction tie-in", text: "New: one clean mouth, with nothing running into the main road." },
  { page: 46, title: "Roundabout on a road", text: "New: the road is cut at the ring and the side roads start at the fillets." },
  { page: 47, title: "3-way and 4-way roundabouts", text: "New: the side road legs are drawn for you." },
  { page: 49, title: "Move a centre line", text: "New: junctions and roundabouts follow the road." },
  { page: 50, title: "Cross section to the corridor limit", text: "New: named dimensions and a level table." },
  { page: 42, title: "Command reference", text: "Every shortcut on one page." },
];

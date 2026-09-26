// What each tag on the "Built for Everyday Surveying & Mapping" cards means.
// Every statement here describes what the converter actually does, so check
// the app before changing one.

export interface FeatureDetail {
  title: string;
  summary: string;
  /** How it works in Excel to KML */
  points: string[];
  /** Optional key facts, shown as a small table */
  specs?: [string, string][];
  tip?: string;
}

export const FEATURE_DETAILS: Record<string, FeatureDetail> = {
  // ── Official Regional Map Grids ────────────────────────────────────────
  "Dubai DLTM": {
    title: "Dubai Local Transverse Mercator (DLTM)",
    summary:
      "The grid Dubai Municipality uses for survey and land records. Because it sits directly on WGS 84, converting it to Google Earth needs no datum shift at all.",
    specs: [
      ["EPSG code", "3997"],
      ["Projection", "Transverse Mercator"],
      ["Central meridian", "55°20′ E"],
      ["Scale factor", "1.0"],
      ["False easting / northing", "500,000 m / 0 m"],
      ["Datum", "WGS 84"],
      ["Used in", "Dubai emirate"],
    ],
    points: [
      "Search “Dubai”, “DLTM” or “3997” in the coordinate system list and pick it once.",
      "Eastings and northings are turned into latitude and longitude with no shift applied, since the grid is already on WGS 84.",
      "Points that fall outside Dubai are flagged after conversion — the usual sign of a wrong grid or swapped columns.",
    ],
    tip: "Old Dubai drawings on the pre-DLTM local grid need that older system instead; check one known mark first.",
  },
  "Qatar National Grid": {
    title: "Qatar National Grid (QNG, QND95)",
    summary:
      "Qatar's national survey grid, on the Qatar National Datum 1995. It uses its own ellipsoid, so a published seven-parameter shift is applied to reach WGS 84.",
    specs: [
      ["EPSG code", "2932"],
      ["Projection", "Transverse Mercator"],
      ["Origin", "24°27′ N, 51°13′ E"],
      ["Scale factor", "0.99999"],
      ["False easting / northing", "200,000 m / 300,000 m"],
      ["Datum", "QND95 (International 1924 ellipsoid)"],
      ["Tie to WGS 84", "7-parameter shift, about 1–2 m"],
    ],
    points: [
      "Search “Qatar”, “QNG” or “2932” and pick it once.",
      "The seven-parameter datum shift to WGS 84 is applied automatically.",
      "For tighter results on a project, add known control points under Site calibration and check what is left over on each.",
    ],
  },
  "Pakistan UTM 42N": {
    title: "UTM zone 42N (WGS 84) — Pakistan",
    summary:
      "Universal Transverse Mercator zone 42 north, covering 66°E to 72°E. It takes in Karachi and central Pakistan; the rest of the country falls in zones 41N and 43N.",
    specs: [
      ["EPSG code", "32642"],
      ["Projection", "Transverse Mercator (UTM)"],
      ["Central meridian", "69° E"],
      ["Scale factor", "0.9996"],
      ["False easting", "500,000 m"],
      ["Datum", "WGS 84"],
      ["Zone limits", "66° E – 72° E"],
    ],
    points: [
      "Choose the zone by longitude: 41N (60–66°E) for western Balochistan, 42N (66–72°E) for Karachi and Sindh, 43N (72–78°E) for Lahore, Islamabad and the north-east.",
      "Not sure of the zone? Type a rough latitude and longitude in “Near this” and the list narrows to systems that cover that spot.",
      "Points outside the chosen zone are flagged after conversion.",
    ],
  },
  "Saudi Arabia UTM 38N": {
    title: "UTM zone 38N (WGS 84) — Saudi Arabia",
    summary:
      "Universal Transverse Mercator zone 38 north, covering 42°E to 48°E — central Saudi Arabia including Riyadh. The kingdom spans zones 36N to 40N.",
    specs: [
      ["EPSG code", "32638"],
      ["Projection", "Transverse Mercator (UTM)"],
      ["Central meridian", "45° E"],
      ["Scale factor", "0.9996"],
      ["False easting", "500,000 m"],
      ["Datum", "WGS 84"],
      ["Zone limits", "42° E – 48° E"],
    ],
    points: [
      "Pick the zone by longitude: 37N (36–42°E) for Jeddah and Makkah, 38N (42–48°E) for Riyadh, 39N (48–54°E) for Dammam and the Eastern Province.",
      "Search “38N” or “32638”, or use “Near this” with a rough latitude and longitude.",
      "Points outside the zone are flagged after conversion.",
    ],
  },

  "Offline Grid List": {
    title: "5,800+ Coordinate Systems, Offline",
    summary:
      "Every coordinate system is stored inside the program — national grids, UTM zones, state planes and geographic systems — so nothing is looked up online and it works on site without a connection.",
    points: [
      "Search by grid name, country or EPSG code, for example “Qatar”, “British National Grid” or “32639”.",
      "Every projection family is covered: transverse Mercator, Lambert conic, oblique Mercator, stereographic, Cassini and the rest.",
      "The shift from the grid's own datum to WGS 84, which Google Earth uses, is applied automatically wherever one is published.",
      "A note warns when a system's eastings and northings are not in metres, or when it is latitude and longitude rather than a grid.",
    ],
  },
  "Near This Search": {
    title: "Find a Grid by Location",
    summary:
      "Not sure which zone a job is in? Type a rough latitude and longitude and the list narrows to the systems whose published area of use covers that spot.",
    specs: [["Example", "25.29, 51.53 → systems used around Doha"]],
    points: [
      "Uses each system's official area of use from the EPSG dataset.",
      "Handy for picking the right UTM zone or state plane zone without looking it up.",
    ],
  },
  "Accuracy Badges": {
    title: "Accuracy Badges",
    summary:
      "Each system in the list shows how closely its datum is tied to WGS 84 — the datum Google Earth uses — so you know how far to trust a conversion before relying on it.",
    specs: [
      ["Within 1 m", "already on or aligned with WGS 84"],
      ["1 to 2 m", "published seven-parameter shift applied"],
      ["5 to 10 m", "published three-parameter shift applied"],
      ["1 to 3 m", "officially needs a national grid file; a published seven-parameter shift is used instead"],
      ["No published tie", "old local datum with no official link to WGS 84"],
    ],
    points: [
      "Anything worse than a metre or two is worth proving against a known mark before you trust it.",
      "Site calibration with your own control points can tighten a loosely tied grid for one project.",
    ],
  },
  "Out-of-Area Check": {
    title: "Out-of-Area Check",
    summary:
      "After converting, any point that lands outside where the chosen grid is used is counted and flagged. That is what a wrong zone or swapped easting and northing columns look like.",
    points: [
      "The check uses the grid's official area of use, so it works for all 5,800+ systems.",
      "Fix the zone or the column order and convert again — nothing is saved until you choose to.",
    ],
    tip: "Check one mark you know before sending a file out; it catches most set-up mistakes in seconds.",
  },

  // ── Elevations & Levels ───────────────────────────────────────────────
  "Ground Pins": {
    title: "Ground Pins",
    summary:
      "Every point is placed on Google Earth's terrain at its exact latitude and longitude, so pins line up with the satellite image and the ground surface.",
    points: [
      "The measured level still travels inside the file as the third coordinate, so a saved KML can be read back into a spreadsheet without losing heights.",
      "Point symbols give each kind of point its own marker — a benchmark gets a target, a tree gets a tree — guessed from the wording in your sheet.",
      "Each kind of point goes into its own folder in Google Earth, so you can switch benchmarks, trees or pegs on and off.",
      "Labels can be held back until the camera comes down below a height you choose, so a busy site doesn't turn into a pile of text.",
    ],
  },
  "Elevation in Balloons": {
    title: "Elevation in Balloons",
    summary:
      "Click any pin in Google Earth and its balloon shows the point's details — station, coordinates and level — straight from your sheet.",
    points: [
      "Balloon contents lets you tick exactly which columns a client sees: level, code, remarks, or every column as read.",
      "Levels are shown as measured in your sheet, not the terrain height from Google Earth.",
      "Attach site photos and they appear inside the same balloon.",
    ],
  },
  "Level Profile": {
    title: "Level Profile & Level Checks",
    summary:
      "Along any line of points — a road centreline, a kerb, a pipe run — the tool works out running chainage, the level at each point and the grade between them.",
    points: [
      "Chainage is measured point to point on the ground; grade is the rise over that run.",
      "The profile can be saved as a sheet, and chainage-and-offset can be worked out for every other point against a centreline.",
      "Quality checks flag a level that jumps compared with its neighbours, points shot twice, and rows with no level.",
    ],
  },

  // ── Auto-Detects Spreadsheet Columns ─────────────────────────────────
  "Excel & CSV": {
    title: "Excel & CSV Input",
    summary:
      "Copy rows in Excel and paste them straight in, or open a CSV, TXT or TSV file. The tool also opens existing KML, KMZ and DXF files.",
    points: [
      "Paste the heading row along with the data and the columns are picked up by name.",
      "Batch mode converts many CSV sheets in one go.",
      "Type points by hand for the odd benchmark off a level book or a corner read from a drawing.",
    ],
  },
  "Auto Column Map": {
    title: "Automatic Column Mapping",
    summary:
      "Column headings are recognised by name, so you don't have to rearrange your sheet before converting it.",
    specs: [
      ["Point", "Station, Stn, Name, BM, TBM"],
      ["Easting", "Easting, East, E, X"],
      ["Northing", "Northing, North, N, Y"],
      ["Level", "Elevation, Elev, Level, RL, Z, Height"],
      ["Lat / Long", "Latitude, Lat, Longitude, Long"],
    ],
    points: [
      "Any other columns — code, remarks, date — are kept and can be shown in the Google Earth balloon.",
      "The table of points read is shown before saving, so you can check it against your sheet.",
    ],
  },
  "Raw Dumps": {
    title: "Raw Instrument Dumps (No Headings)",
    summary:
      "Field exports from total stations and GPS controllers often have no heading row. Tell the tool the column order once and it reads them as they are.",
    specs: [
      ["Column orders include", "P·E·N·Z, P·N·E·Z, E·N·Z, N·E·Z, P·E·N, P·N·E"],
      ["Save back for", "Leica GSI-16, Trimble P,E,N,Z,Code / P,N,E,Z,Code"],
    ],
    points: [
      "Pick the column order from the list when the sheet has no heading row.",
      "Converted points can also be saved back in instrument formats for stake-out.",
    ],
  },

  // ── Local Site Calibration ────────────────────────────────────────────
  "Scale Match": {
    title: "Scale Match (Site Calibration)",
    summary:
      "Ties a job to control points whose true coordinates you know. The tool fits the best shift, rotation and one scale factor from your sheet onto them by least squares.",
    points: [
      "Two control points give an exact fit; three or more also show how well each one agrees with the rest.",
      "The fit can then be applied to every point in the job before saving.",
      "Works for a project site grid (for example a 1000, 1000 start) and for a national grid that is slightly off alike.",
    ],
  },
  "True North": {
    title: "Rotation onto the Map Grid",
    summary:
      "A site grid is often set out with its own north. Calibration finds the rotation that turns it onto the chosen map grid, so the job sits the right way round in Google Earth.",
    points: [
      "The rotation is solved from your control points together with the shift and scale — nothing to enter by hand.",
      "Map grids have their own grid north, which differs slightly from true north away from the central meridian; latitude and longitude in the saved file are true geographic positions.",
    ],
  },
  "Under 1 mm": {
    title: "Precision You Can Check",
    summary:
      "The calculation itself adds no error you could measure — far below a millimetre. How well the result fits the ground depends on your control, and the tool shows you that directly.",
    points: [
      "After fitting, each control point lists what is left over, and the worst one is highlighted.",
      "A control point that doesn't agree stands out at once, so a mistyped or disturbed mark is caught before the file goes to a client.",
    ],
    tip: "Use at least three well-spread control points so there is something left over to check.",
  },

  // ── Boundary Lines & Land Area ────────────────────────────────────────
  "Boundary Traverse": {
    title: "Boundary Lines",
    summary:
      "Join points up to draw a plot boundary, a fence, a kerb line or a pipe run in Google Earth.",
    points: [
      "Draw one line for each code (for example all BOUNDARY points, then all FENCE points), or one line through every point in order.",
      "Choose to close the shape back to its first point for plots and boundaries.",
      "Lines are saved in their own folder alongside the points.",
    ],
  },
  Perimeter: {
    title: "Perimeter & Line Lengths",
    summary:
      "The length of each line — and the total — is worked out on the ground, point to point.",
    points: [
      "Shown in the tool for every line and in the line's balloon in Google Earth.",
      "For a closed boundary, the length is the full perimeter back to the first point.",
    ],
  },
  Hectares: {
    title: "Land Area",
    summary:
      "Close a boundary and its area is calculated for you, in square metres and hectares.",
    specs: [
      ["Units", "m² and hectares (1 ha = 10,000 m²)"],
      ["Shown in", "the tool and the line's Google Earth balloon"],
    ],
    points: [
      "Area comes from the closed shape's corner points in order, so keep boundary points in the order they run round the plot.",
    ],
  },

  // ── Attach Site Inspection Photos ─────────────────────────────────────
  "Click-to-View": {
    title: "Click-to-View Photos",
    summary:
      "Attach a photo for each mark and it opens when the pin is clicked in Google Earth.",
    points: [
      "A photo is matched to a point by file name: TREE-01.jpg lands on the point named TREE-01. If your sheet has a PHOTO column, the name there is used instead.",
      "A mark photographed more than once (NAME-1, NAME-2) keeps all its photos.",
      "Phone photos carry their own GPS position; the tool warns when one was taken further from its mark than a distance you set (30 m by default).",
    ],
  },
  "Popup Balloons": {
    title: "Popup Balloons",
    summary:
      "The balloon that opens on a pin shows the photo together with the point's details, so a client sees the mark and its numbers in one place.",
    points: [
      "Choose which columns appear under Balloon contents.",
      "Photos are shrunk before packing so the file stays small enough to email.",
    ],
  },
  "All-in-One KMZ": {
    title: "All-in-One KMZ",
    summary:
      "A KMZ is a KML with the pictures packed inside it. One file carries the points, lines and photos, and opens on any computer or phone with Google Earth.",
    points: [
      "When photos are attached, Save KMZ packs everything into that one file.",
      "Nothing depends on files left behind on your PC, so the client sees exactly what you saw.",
    ],
  },
};

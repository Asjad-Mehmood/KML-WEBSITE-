// The app tutorial: the full walkthrough at /tutorial and its four-step
// summary on the home page. Screenshots are of the web app with the built-in
// sample job (12 points on Dubai DLTM), in public/tutorial/.

export interface TutorialStep {
  id: string;
  title: string;
  /** One line for the home page card */
  short: string;
  image: string;
  width: number;
  height: number;
  alt: string;
  body: string[];
  tips?: string[];
}

export const MAIN_STEPS: TutorialStep[] = [
  {
    id: "load-points",
    title: "Load your points",
    short: "Open an Excel or CSV file, paste rows from Excel, or type points by hand.",
    image: "/tutorial/load-points.webp",
    width: 1600,
    height: 1000,
    alt: "Points in: the sample sheet loaded, with the points table and a preview of where they land",
    body: [
      "Open the app and choose Points in. Click Open (or press Ctrl+O) to load an Excel (.xlsx) or CSV file, click Paste to drop in rows copied from Excel, or open Type points by hand for a few points.",
      "The first row should name your columns. The app recognises the usual survey headings — Station or Point, Code, Easting, Northing, Elevation, Remarks — and also Latitude and Longitude if your sheet already has them.",
      "The table on the right shows every row it read, and the preview underneath shows where the points land. The status bar at the bottom counts rows read, points ready and rows left out.",
    ],
    tips: [
      "New to the app? Click Try the sample to load a ready-made job and follow along.",
      "Rows the app can't use are listed in the log with the reason, so nothing disappears silently.",
    ],
  },
  {
    id: "choose-grid",
    title: "Choose your coordinate system",
    short: "Pick the grid your eastings and northings are on — 5,800+ systems, searchable.",
    image: "/tutorial/choose-grid.webp",
    width: 1410,
    height: 940,
    alt: "Coordinate system panel showing WGS 84 / Dubai Local TM selected, with its area of use and definition",
    body: [
      "Go to Coordinate system and tell the app which grid your eastings and northings are on. Search by grid name, country, EPSG code or AutoCAD code — for example Dubai, Qatar, 32639 or British National Grid.",
      "Not sure which one? Type a rough latitude and longitude for the site and the list narrows to the grids used there.",
      "The panel shows the grid's area of use and how closely its datum ties to WGS 84, the datum Google Earth uses. Every system is stored inside the app, so nothing is looked up online.",
    ],
    tips: [
      "Eastings and northings on the wrong grid are the most common cause of points landing in the wrong place — if they look shifted or in another country, check this step first.",
    ],
  },
  {
    id: "prove-grid",
    title: "Prove the grid with a known mark",
    short: "Check one point you trust before you rely on the rest.",
    image: "/tutorial/prove-grid.webp",
    width: 894,
    height: 560,
    alt: "Check against a known point: fields for a known easting, northing, latitude and longitude",
    body: [
      "Under Coordinate system, use Check against a known point: type the grid and the latitude/longitude of one mark whose values you both trust — a benchmark or control point — and click Check.",
      "The app shows how far off the conversion is. If it is within your tolerance, the step bar turns green. If not, the grid, zone or datum is probably wrong.",
      "If your job is on a local site grid, use Site calibration instead to fit the job onto two or more control points.",
    ],
  },
  {
    id: "save",
    title: "Save for Google Earth",
    short: "Save KMZ with photos and logo, KML, Excel, a PDF report, CSV or DXF.",
    image: "/tutorial/save.webp",
    width: 820,
    height: 820,
    alt: "Save menu: Google Earth KMZ, Google Earth KML, Excel workbook, Survey report PDF and more formats",
    body: [
      "Click Save KMZ for the usual Google Earth file: points, coloured markers, photos and your logo in one file. Open the arrow next to it for the other formats.",
      "Google Earth KML is a single plain file. Excel workbook gives you your grid and the converted latitude and longitude side by side. Survey report (PDF) adds a site plan, the checks, every point and a photo record. Under More formats you'll find CSV, DXF for AutoCAD and instrument files.",
      "Double-click the saved KMZ or KML and it opens in Google Earth, in the right place, with each point's details in its balloon.",
    ],
    tips: ["Check what goes into the file shows exactly which points, columns and photos will be saved before you save."],
  },
];

export const MORE_FEATURES: TutorialStep[] = [
  {
    id: "quality-checks",
    title: "Quality checks",
    short: "Catch duplicates, stacked points and odd levels.",
    image: "/tutorial/quality-checks.webp",
    width: 894,
    height: 760,
    alt: "Quality checks panel",
    body: [
      "Finds points shot twice, points on top of each other, odd levels and missing levels before anything goes out. The step bar shows Quality checks: all clear when there is nothing to look at.",
      "Against design loads the design sheet and shows how far each point is from where it should be.",
    ],
  },
  {
    id: "symbols",
    title: "Symbols and labels",
    short: "A marker, colour and folder for every code.",
    image: "/tutorial/symbols.webp",
    width: 894,
    height: 760,
    alt: "Symbols and labels panel with a marker and colour per code",
    body: [
      "Each code gets its own marker, colour and folder in Google Earth — trees, manholes, benchmarks and so on. Your choices are kept for the next job, and Symbol library holds your codes so every job looks the same.",
    ],
  },
  {
    id: "site-photos",
    title: "Site photos",
    short: "A photo of each mark, in its balloon.",
    image: "/tutorial/site-photos.webp",
    width: 894,
    height: 760,
    alt: "Site photos panel",
    body: [
      "Add a photo of each mark. A photo is matched to a point when its file name matches the point name (for example TBM-01.jpg), and it shows in the point's balloon in Google Earth. KMZ keeps the photos inside the file, so it works when you send it on.",
    ],
  },
  {
    id: "lines-areas",
    title: "Lines and areas",
    short: "Boundaries and routes with lengths and areas.",
    image: "/tutorial/lines-areas.webp",
    width: 894,
    height: 760,
    alt: "Lines and areas panel",
    body: [
      "Join points into lines and areas — plot boundaries, kerb lines, pipe runs — with lengths and areas worked out and shown in Google Earth.",
    ],
  },
  {
    id: "site-calibration",
    title: "Site calibration",
    short: "Fit a local site grid onto trusted control.",
    image: "/tutorial/site-calibration.webp",
    width: 894,
    height: 760,
    alt: "Site calibration panel",
    body: [
      "For jobs on a local or arbitrary site grid: give two or more control points with trusted coordinates and the app fits the whole job onto them, showing the fit on each control point.",
    ],
  },
  {
    id: "map",
    title: "Preview on the map",
    short: "See every point and colour before saving.",
    image: "/tutorial/map.webp",
    width: 1470,
    height: 1000,
    alt: "Map view with coloured markers and a legend of codes",
    body: [
      "The Map tab shows every point with its marker and colour, and a legend of what the colours mean. Load satellite adds imagery underneath when you are online. Balloon contents chooses what each balloon shows, and Filter what is saved picks which points go into the file.",
    ],
  },
];

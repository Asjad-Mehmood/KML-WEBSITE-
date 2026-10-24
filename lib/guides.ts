// How-to guides at /guides/<slug> (the page files live in app/guides/<slug>/page.tsx)
export type GuideCategory = "Getting started" | "Coordinates" | "Checking the work" | "Deliverables" | "Traverse and levelling" | "Roads in AutoCAD";

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory;
  published: string; // ISO date
  /** The program the guide is about, for its closing panel (Excel to KML when left out) */
  product?: "traverse" | "roadpro";
}

export const GUIDE_CATEGORIES: GuideCategory[] = ["Getting started", "Coordinates", "Checking the work", "Deliverables", "Traverse and levelling", "Roads in AutoCAD"];

export const GUIDES: Guide[] = [
  {
    slug: "survey-points-to-google-earth",
    title: "How to Put Survey Points from Excel into Google Earth",
    description:
      "Step by step from a spreadsheet of eastings, northings and levels to pins in Google Earth: pick the grid, check a known point, save KML or KMZ.",
    category: "Getting started",
    published: "2026-09-26",
  },
  {
    slug: "total-station-csv-to-kmz-with-photos",
    title: "Total Station CSV to KMZ with Site Photos",
    description:
      "Turn a raw total station export into one KMZ file with a photo in every point's balloon — naming photos, matching them to points and adding boundary lines.",
    category: "Getting started",
    published: "2026-09-26",
  },
  {
    slug: "easting-northing-to-latitude-longitude",
    title: "How to Convert Easting and Northing to Latitude and Longitude",
    description:
      "Converting grid coordinates to latitude and longitude: coordinate systems, UTM zones, datums, units, and the mistakes that put points in the wrong place.",
    category: "Coordinates",
    published: "2026-09-26",
  },
  {
    slug: "find-your-utm-zone",
    title: "How to Find Your UTM Zone",
    description:
      "Work out the UTM zone and hemisphere for any site from its longitude, with the zones for the Gulf, Pakistan, India and other common regions.",
    category: "Coordinates",
    published: "2026-09-26",
  },
  {
    slug: "site-calibration-local-grid",
    title: "Site Calibration: Tie a Local Site Grid to Real Coordinates",
    description:
      "Put a project grid (such as a 1000/1000 start) or a slightly-off national grid in the right place using known control points.",
    category: "Coordinates",
    published: "2026-09-26",
  },
  {
    slug: "kml-vs-kmz",
    title: "KML vs KMZ: Which Should You Send?",
    description:
      "What the difference is between KML and KMZ, when each one is the right file to send, and why photos and custom markers need a KMZ.",
    category: "Deliverables",
    published: "2026-09-26",
  },
  {
    slug: "boundaries-and-land-area-in-google-earth",
    title: "Draw Boundaries and Calculate Land Area in Google Earth",
    description:
      "Join survey points into boundary lines by code, close them into plots, and get lengths and areas in square metres and hectares.",
    category: "Deliverables",
    published: "2026-09-26",
  },
  {
    slug: "survey-points-to-dxf-autocad",
    title: "Export Survey Points to DXF for AutoCAD",
    description:
      "Save your points as a DXF drawing with 3D points, name labels and a layer for each code, on the grid your drawing uses.",
    category: "Deliverables",
    published: "2026-09-26",
  },
  {
    slug: "prepare-survey-spreadsheet",
    title: "How to Lay Out a Survey Spreadsheet for Conversion",
    description:
      "Which headings are recognised, what to do with a sheet that has no heading row, and the small layout habits that stop points going missing.",
    category: "Getting started",
    published: "2026-09-26",
  },
  {
    slug: "convert-many-sheets-at-once",
    title: "Convert Many Survey Sheets to Google Earth at Once",
    description:
      "Batch conversion: turn a folder of CSV and Excel sheets into one Google Earth file each, with a summary of what every sheet held.",
    category: "Getting started",
    published: "2026-09-26",
  },
  {
    slug: "save-survey-jobs",
    title: "Keep a Survey Job and Carry On Later",
    description:
      "Save the whole job — points, grid, symbols, photos and settings — under a name, open it on another computer, or send it to a colleague.",
    category: "Getting started",
    published: "2026-09-26",
  },
  {
    slug: "latitude-longitude-to-utm",
    title: "How to Convert Latitude and Longitude to UTM",
    description:
      "Turn a sheet of latitude and longitude into UTM or national grid eastings and northings, and save them to Excel, CSV or DXF.",
    category: "Coordinates",
    published: "2026-09-26",
  },
  {
    slug: "convert-between-coordinate-systems",
    title: "Convert Coordinates from One Grid to Another",
    description:
      "Move eastings and northings from an old national grid to UTM, or between any two grids, without losing the original values.",
    category: "Coordinates",
    published: "2026-09-26",
  },
  {
    slug: "dms-to-decimal-degrees",
    title: "Degrees, Minutes and Seconds to Decimal Degrees in Excel",
    description:
      "Convert coordinates like 25°12'30.5\"N to 25.208472 with one Excel formula, and why a DMS column must be converted before mapping.",
    category: "Coordinates",
    published: "2026-09-26",
  },
  {
    slug: "kml-to-excel",
    title: "Convert KML or KMZ to Excel with Coordinates",
    description:
      "Get the placemarks out of a Google Earth file into a table of names, latitude, longitude and height, and onto your own grid.",
    category: "Coordinates",
    published: "2026-09-26",
  },
  {
    slug: "survey-quality-checks",
    title: "Check a Survey for Duplicate Points and Level Busts",
    description:
      "Catch the mistakes that survive a visual check before you send the file: points shot twice, points on top of each other, levels that jump.",
    category: "Checking the work",
    published: "2026-09-26",
  },
  {
    slug: "compare-survey-with-design",
    title: "Compare As-Built Survey Points with Design Coordinates",
    description:
      "Match what was shot against the design sheet station by station, flag anything outside tolerance, and save the comparison.",
    category: "Checking the work",
    published: "2026-09-26",
  },
  {
    slug: "setting-out-bearing-and-distance",
    title: "Bearing and Distance from a Setup Point: a Setting-Out Sheet",
    description:
      "Set up on any point and list every other point by bearing, distance and level difference, then save the list as a setting-out sheet.",
    category: "Checking the work",
    published: "2026-09-26",
  },
  {
    slug: "survey-points-to-shapefile-qgis-arcgis",
    title: "Survey Points to Shapefile and GeoJSON for QGIS and ArcGIS",
    description:
      "Save survey points, lines and areas as a zipped Shapefile or a GeoJSON file with every column kept, ready to open in GIS.",
    category: "Deliverables",
    published: "2026-09-26",
  },
  {
    slug: "survey-points-to-gpx",
    title: "Survey Points to GPX for a Handheld GPS",
    description:
      "Put your control points and boundaries on a handheld GPS as waypoints and routes, with levels, to find them in the field.",
    category: "Deliverables",
    published: "2026-09-26",
  },
  {
    slug: "points-to-total-station-leica-trimble",
    title: "Send Points to a Total Station: Leica GSI and Trimble Files",
    description:
      "Save design or control points as a Leica GSI-16 file or a Trimble comma file to upload to the instrument for setting out.",
    category: "Deliverables",
    published: "2026-09-26",
  },
  {
    slug: "point-codes-and-symbols-in-google-earth",
    title: "Colour-Coded Markers by Point Code in Google Earth",
    description:
      "Give trees, manholes, benchmarks and every other code its own marker and folder, and keep the choices for every job.",
    category: "Deliverables",
    published: "2026-09-26",
  },
  {
    slug: "chainage-offset-and-level-profile",
    title: "Chainage, Offset and Level Profile Along a Centreline",
    description:
      "Give every point its chainage along a road, pipe or kerb line and its offset left or right, and save a level profile with grades.",
    category: "Deliverables",
    published: "2026-09-26",
  },
  // Traverse & Level and RoadPro
  {
    slug: "bowditch-traverse-adjustment",
    title: "How to Adjust a Closed Traverse by the Bowditch Rule",
    description:
      "A worked example of a four-station closed loop: balance the angles, work out bearings and coordinate changes, find the misclosure and spread it by the Bowditch (compass) rule.",
    category: "Traverse and levelling",
    published: "2026-10-24",
    product: "traverse",
  },
  {
    slug: "level-book-rise-and-fall-height-of-instrument",
    title: "Reducing a Level Book: Rise and Fall vs Height of Instrument",
    description:
      "Reduce the same level book both ways, run the arithmetic checks, compare the misclosure with the allowable and spread it over the set-ups.",
    category: "Traverse and levelling",
    published: "2026-10-24",
    product: "traverse",
  },
  {
    slug: "traverse-misclosure-and-precision",
    title: "Traverse Misclosure and Precision: What 1 : 10,000 Means",
    description:
      "Angular and linear misclosure, how the precision ratio is worked out, typical limits, and what to check before you adjust a traverse that fails.",
    category: "Traverse and levelling",
    published: "2026-10-24",
    product: "traverse",
  },
  {
    slug: "draw-a-road-in-autocad",
    title: "How to Draw a Complete Road in AutoCAD from a Centre Line",
    description:
      "From one polyline to a finished road plan with RoadPro: edges, turning radius, barricades or kerb, chainage, signs, markings, a cross section and an Excel report.",
    category: "Roads in AutoCAD",
    published: "2026-10-24",
    product: "roadpro",
  },
  {
    slug: "road-junction-and-turning-lane-autocad",
    title: "Road Junctions, Widening and Turning Lanes in AutoCAD",
    description:
      "Join a new road to an existing one with kerb returns and an auxiliary lane, add a lane between two chainages and taper a road, with RoadPro's RDJ, RDW and RDT.",
    category: "Roads in AutoCAD",
    published: "2026-10-24",
    product: "roadpro",
  },
  {
    slug: "road-quantities-and-setting-out-report",
    title: "Road Quantities and Setting-Out Data from AutoCAD to Excel",
    description:
      "What RoadPro's report lists: barricade, cone and kerb quantities, signs, marking paint, curve data and the setting-out coordinates of the centre line and edges.",
    category: "Roads in AutoCAD",
    published: "2026-10-24",
    product: "roadpro",
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);

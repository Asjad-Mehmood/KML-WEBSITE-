// How-to guides at /guides/<slug> (the page files live in app/guides/<slug>/page.tsx)
export type GuideCategory = "Getting started" | "Coordinates" | "Deliverables";

export interface Guide {
  slug: string;
  title: string;
  description: string;
  category: GuideCategory;
  published: string; // ISO date
}

export const GUIDE_CATEGORIES: GuideCategory[] = ["Getting started", "Coordinates", "Deliverables"];

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
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);

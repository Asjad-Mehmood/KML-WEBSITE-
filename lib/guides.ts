// How-to guides at /guides/<slug> (the page files live in app/guides/<slug>/page.tsx)
export interface Guide {
  slug: string;
  title: string;
  description: string;
  published: string; // ISO date
}

export const GUIDES: Guide[] = [
  {
    slug: "survey-points-to-google-earth",
    title: "How to Put Survey Points from Excel into Google Earth",
    description:
      "Step by step from a spreadsheet of eastings, northings and levels to pins in Google Earth: pick the grid, check a known point, save KML or KMZ.",
    published: "2026-09-26",
  },
  {
    slug: "total-station-csv-to-kmz-with-photos",
    title: "Total Station CSV to KMZ with Site Photos",
    description:
      "Turn a raw total station export into one KMZ file with a photo in every point's balloon — naming photos, matching them to points and adding boundary lines.",
    published: "2026-09-26",
  },
  {
    slug: "easting-northing-to-latitude-longitude",
    title: "How to Convert Easting and Northing to Latitude and Longitude",
    description:
      "Converting grid coordinates to latitude and longitude: coordinate systems, UTM zones, datums, units, and the mistakes that put points in the wrong place.",
    published: "2026-09-26",
  },
];

export const guideBySlug = (slug: string) => GUIDES.find((g) => g.slug === slug);

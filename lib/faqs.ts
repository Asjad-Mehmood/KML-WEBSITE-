// Shared by the FAQ section and its FAQPage structured data, so the two never drift apart

export interface FaqItem {
  id: number;
  category: "grids" | "import" | "earth" | "security";
  categoryLabel: string;
  q: string;
  a: string;
}

export const FAQS: FaqItem[] = [
  {
    id: 1,
    category: "grids",
    categoryLabel: "Coordinate Grids",
    q: "How do I find my regional government map grid?",
    a: "You can search by country name (like Dubai, Qatar, Pakistan, Saudi Arabia, UK) or standard EPSG number (like EPSG:3997, EPSG:2932, EPSG:32642). If you use AutoCAD Civil 3D, you can type the same drawing zone code. The tool automatically handles the math so your points land in the exact real-world spot on Google Earth.",
  },
  {
    id: 2,
    category: "grids",
    categoryLabel: "Coordinate Grids",
    q: "How does local site calibration work if my project has its own coordinate system?",
    a: "If your site uses a local total station grid (such as a 1000, 1000 base), enter 3 or more known government control benchmarks. The software calculates scale correction and True North rotation, showing you the exact millimeter differences on each mark before exporting to Google Earth.",
  },
  {
    id: 3,
    category: "import",
    categoryLabel: "Excel & CSV",
    q: "Can I import raw survey data from total stations without headers?",
    a: "Yes. Field data collectors from Leica, Trimble, Topcon, and Sokkia often export comma-separated numbers without column headers. The importer lets you verify which column is Point ID, Easting, Northing, and Elevation before processing.",
  },
  {
    id: 4,
    category: "import",
    categoryLabel: "Excel & CSV",
    q: "Is there a limit on how many survey points I can convert at once?",
    a: "No. The desktop application handles 10,000+ points in under a second. You can paste large Excel sheets or drag in multi-megabyte CSV files containing entire highway traverses, cadastral boundary pegs, or topographic contour grids.",
  },
  {
    id: 5,
    category: "earth",
    categoryLabel: "Google Earth 3D",
    q: "How do 3D elevations and height extrusions display in Google Earth?",
    a: "You can choose to place survey pins directly on ground terrain, or extrude vertical 3D lines rising from the ground up to your measured Z height. This makes slope changes, structure heights, and cut-and-fill depths clearly visible in 3D.",
  },
  {
    id: 6,
    category: "earth",
    categoryLabel: "Google Earth 3D",
    q: "Can I connect points to draw boundary property lines and calculate land area?",
    a: "Yes. By grouping survey points with feature codes (like BOUNDARY, FENCE, or LOT), the software draws closed 3D polygon outlines in Google Earth and automatically calculates boundary perimeter length and total ground area in square metres and hectares.",
  },
  {
    id: 7,
    category: "security",
    categoryLabel: "Privacy & PC",
    q: "Does this tool upload my survey coordinates or site photos to the internet?",
    a: "No. All coordinate parsing, geodetic math, and KML/KMZ packaging runs 100% locally on your PC. No coordinates, client project details, or site photos are ever sent to external cloud servers.",
  },
  {
    id: 8,
    category: "security",
    categoryLabel: "Privacy & PC",
    q: "Why does Windows SmartScreen show an unrecognized app prompt on first run?",
    a: "Windows SmartScreen routinely shows this safety prompt on newly released open-source software that doesn't purchase an expensive commercial code-signing certificate. Click \"More info\" and then \"Run anyway\". You can also verify the official SHA-256 binary hash on GitHub.",
  },
];

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
    a: "You can search by country name (like Qatar, Dubai, Pakistan, Saudi Arabia, UK) or standard EPSG number (like EPSG:2932, EPSG:3997, EPSG:32642). If you use AutoCAD Civil 3D, you can type the same drawing zone code. The tool automatically handles the math so your points land in the exact real-world spot on Google Earth.",
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
    q: "How do elevations show in Google Earth?",
    a: "Each point is placed on Google Earth's terrain at its exact position, and its measured level appears in the balloon when you click it. The level is also kept inside the file, so it can be read back into a spreadsheet. Along a line of points you can get a level profile with chainage and grade, and the quality checks flag any level that jumps compared with its neighbours.",
  },
  {
    id: 6,
    category: "earth",
    categoryLabel: "Google Earth 3D",
    q: "Can I connect points to draw boundary property lines and calculate land area?",
    a: "Yes. By grouping survey points with feature codes (like BOUNDARY, FENCE, or LOT), the software draws closed boundary outlines in Google Earth and automatically calculates boundary perimeter length and total ground area in square metres and hectares.",
  },
  {
    id: 7,
    category: "security",
    categoryLabel: "Privacy & PC",
    q: "Is my survey data uploaded to the internet?",
    a: "The conversion itself — reading your sheet, the coordinate maths and building the KML or KMZ — always runs on your own computer or in your browser. In the web app, the files you open and save are kept in your account so you can download them again from your dashboard, where you can also delete them. The Windows app sends only a short activity record (file name, number of points, coordinate system and export format), never your coordinates or photos.",
  },
  {
    id: 8,
    category: "security",
    categoryLabel: "Privacy & PC",
    q: "Why does Windows SmartScreen show an unrecognized app prompt on first run?",
    a: "Windows SmartScreen routinely shows this safety prompt on new software that isn't signed with an expensive commercial code-signing certificate yet. Click \"More info\" and then \"Run anyway\". You can also check the installer's SHA-256 against the one shown on the download page.",
  },
  {
    id: 9,
    category: "security",
    categoryLabel: "Privacy & PC",
    q: "Does Excel to KML work on a Mac?",
    a: "Use the web app: it runs in Safari, Chrome, Edge or Firefox on a Mac, a Linux computer, a tablet or a phone, with the same converter, grids and exports, and nothing to install. The installed program is for Windows 10 and 11.",
  },
];

/** The home page's FAQ: questions about every program, not just Excel to KML. The /faq page
 *  and each program's page keep the full lists. */
export const HOME_FAQS: { q: string; a: string; href?: string }[] = [
  {
    q: "Are the programs free?",
    a: "Yes. Excel to KML, RoadPro, Traverse & Level, Slope Calculator and Project Folder Manager are free to download and use. You only need a free account, which also keeps your downloads, converted files and Traverse & Level jobs together in your dashboard.",
  },
  {
    q: "Which coordinate systems does Excel to KML support?",
    a: "More than 5,800 EPSG grids: national grids such as the Qatar National Grid, Dubai Local TM and the British National Grid, every UTM zone and the US State Plane zones. Search by country, name or EPSG number. If your site has its own local grid, site calibration fits it to three or more known control points first.",
    href: "/convert",
  },
  {
    q: "Which versions of AutoCAD does RoadPro work with?",
    a: "Full AutoCAD, Civil 3D or Map 3D 2014 or newer. AutoCAD LT is not supported. Load RoadPro.lsp once with APPLOAD (add it to the Startup Suite to load it every time) and type RDP to start.",
    href: "/roadpro",
  },
  {
    q: "How does Traverse & Level adjust a traverse?",
    a: "Enter site coordinates, or the angles and distances from your field book, and close on a known point. It checks the misclosure against the precision you ask for and adjusts by Bowditch, Transit, Equal or least squares. Level books are reduced by Rise & Fall or Height of Instrument with the arithmetic checks, and both give a signed PDF report.",
    href: "/traverse",
  },
  {
    q: "Does Project Folder Manager need installing?",
    a: "No. Unzip it and open Project_Folder_Manager.exe, keeping the .exe and the .hta together. It runs on Windows' own HTML application host, so there is nothing else to install. Point it at your project's master folder and press INDEX once for instant search.",
    href: "/project-folder-manager",
  },
  {
    q: "I use a Mac. Can I still use Excel to KML?",
    a: "Yes: open the web app in Safari, Chrome, Edge or Firefox. It is the same converter, with every grid and export, and there is nothing to install. The installed program, RoadPro, Traverse & Level's Windows program and Project Folder Manager are for Windows; Traverse & Level also runs in the browser.",
    href: "/app",
  },
  {
    q: "Why does Windows say it protected my PC?",
    a: "Our programs aren't signed with a paid code-signing certificate yet, so Windows SmartScreen asks before a new program runs for the first time. Choose More info, then Run anyway.",
  },
];

/** The shorter FAQ on the home page: the first question of each topic. The /faq page keeps every one. */
export function faqHighlights(): FaqItem[] {
  const seen = new Set<string>();
  return FAQS.filter((f) => (seen.has(f.category) ? false : (seen.add(f.category), true)));
}

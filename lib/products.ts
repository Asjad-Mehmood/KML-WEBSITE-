// Our other software, besides the Excel to KML app itself. Everything that
// promotes them reads this list: the home page hero tabs, the menu, the
// footer and the sitemap. To add a tool, add an entry here and
// give it a page at its href.
import { ROADPRO_VERSION } from "@/lib/roadpro";
import { TRAVERSE_FILES, TRAVERSE_SHORT, TRAVERSE_VERSION } from "@/lib/traverse";
import { PFM_FILES, PFM_NAME, PFM_VERSION } from "@/lib/folderManager";
import { SLOPE_APP, SLOPE_FILES, SLOPE_NAME, SLOPE_PAGE, SLOPE_VERSION } from "@/lib/slope";

export interface Product {
  id: string;
  name: string;
  /** Where it runs, e.g. "AutoCAD plugin" */
  platform: string;
  version: string;
  /** Short line for badges and cards */
  tagline: string;
  /** One or two sentences for the spotlight */
  description: string;
  /** Page on this site */
  href: string;
  /** Link to the demo (optional) */
  demoHref?: string;
  image: { src: string; width: number; height: number; alt: string };
  /** A short silent loop shown in place of the image (the image is its poster) */
  video?: { src: string; webm?: string };
  highlights: string[];
  /** Shows "Coming soon" instead of "New" (not downloadable yet) */
  comingSoon?: boolean;
  /** Shows a "New" label until this date (YYYY-MM-DD) */
  newUntil?: string;
  /** Show a tab in the home page hero, after Excel to KML */
  inHero?: boolean;
  /** The screenshot in the hero's window frame (16:10) and its title bar. The frame is filled
      from the top left unless position (CSS object-position) says which part to keep. */
  shot?: { src: string; width: number; height: number; alt: string; title: string; position?: string };
  /** Show a link in the main menu */
  inNav?: boolean;
}

export const PRODUCTS: Product[] = [
  {
    id: "roadpro",
    name: "RoadPro",
    platform: "AutoCAD plugin",
    version: ROADPRO_VERSION,
    tagline: "A complete road in AutoCAD from one command",
    description:
      "Draw the centre line and RoadPro adds the edges, turning radius, barricades, cones or kerb stone, signs, road markings, chainage, cross section and an Excel report, and joins new roads with junctions and turning lanes. New in 3.4: lanes, median, sidewalks, drains and utilities, radius editing and LandXML for Civil 3D. Free plugin for AutoCAD, Civil 3D and Map 3D.",
    href: "/roadpro",
    demoHref: "/roadpro#demo",
    image: {
      src: "/roadpro/roadpro-3-network.webp",
      width: 1600,
      height: 636,
      alt: "RoadPro in AutoCAD: lane widening, a T-junction and a skewed junction with kerb returns, road markings, barricades and chainage",
    },
    highlights: ["Lanes, median, sidewalks", "Junctions and turning lanes", "Signs and markings to standard", "Barricades, cones, kerb", "Widening and tapers", "Excel report and LandXML"],
    newUntil: "2027-01-31",
    inHero: true,
    shot: {
      src: "/roadpro/roadpro-3-network.webp",
      width: 1600,
      height: 636,
      alt: "RoadPro in AutoCAD: lane widening, a T-junction and a skewed junction with kerb returns, road markings and chainage",
      title: "AutoCAD Civil 3D · RoadPro",
      position: "right center",
    },
    inNav: true,
  },
  {
    id: "traverse",
    name: TRAVERSE_SHORT,
    platform: "Web app and Windows",
    version: TRAVERSE_VERSION,
    tagline: "Traverse and level adjustment, checked and reported",
    description:
      "Enter site coordinates or the angles and distances from your field book, close on a known point, adjust by Bowditch, Transit, Equal or least squares on the Qatar National Grid and get a signed PDF report. Level books by Rise & Fall or HI. Jobs saved to your account and shared with your team.",
    href: "/traverse",
    demoHref: "/traverse#video",
    image: {
      src: TRAVERSE_FILES.video.poster,
      width: 1024,
      height: 576,
      alt: "Professional Traverse and Level Adjustment Software: precision in every point",
    },
    video: { src: TRAVERSE_FILES.video.loop, webm: TRAVERSE_FILES.video.loopWebm },
    highlights: ["Coordinate traverse and levelling", "Bowditch, Transit, Equal", "PDF reports and sharing", "Works offline and on a phone"],
    comingSoon: !TRAVERSE_FILES.setup.href,
    newUntil: "2027-01-31",
    inHero: true,
    shot: {
      src: "/traverse/screens/v2-traverse-plan.webp",
      width: 1440,
      height: 900,
      alt: "Traverse & Level: an adjusted traverse from CP-01 to CP-03 with its plan, bearings and distances",
      title: "Traverse & Level · Bowditch adjustment",
    },
    inNav: true,
  },
  {
    id: "slope",
    name: SLOPE_NAME,
    platform: "Web app and Windows",
    version: SLOPE_VERSION,
    tagline: "Slope, gradient and the level at every chainage",
    description:
      "Enter the start and end level and chainage: get the slope %, the gradient and the level at every station, a live profile, crossfall, a level book with checks and Excel, PDF and CSV reports. Free in the browser, offline, and on Windows.",
    href: SLOPE_PAGE,
    demoHref: SLOPE_APP,
    image: {
      src: SLOPE_FILES.shots.calculator.src,
      width: SLOPE_FILES.shots.calculator.width,
      height: SLOPE_FILES.shots.calculator.height,
      alt: "Slope Calculator: a falling slope of −1.500 % from 1+000 to 1+250 with its profile and chainage probe",
    },
    highlights: ["Slope % and 1 in N", "Level at every chainage", "Live profile", "Excel, PDF and CSV"],
    newUntil: "2027-03-31",
    inHero: true,
    shot: {
      src: SLOPE_FILES.shots.calculator.src,
      width: SLOPE_FILES.shots.calculator.width,
      height: SLOPE_FILES.shots.calculator.height,
      alt: "Slope Calculator: start and end level and chainage, the slope result and the profile",
      title: "Slope Calculator · 1+000 to 1+250",
    },
    inNav: true,
  },
  {
    id: "folder-manager",
    name: PFM_NAME,
    platform: "Windows",
    version: PFM_VERSION,
    tagline: "Every project folder, one click away",
    description:
      "One screen for your project's master folder: the modules by discipline, a look inside any folder, instant search, copy, move and bulk rename, and the space left on every drive.",
    href: "/project-folder-manager",
    image: {
      src: PFM_FILES.shots.main.src,
      width: PFM_FILES.shots.main.width,
      height: PFM_FILES.shots.main.height,
      alt: "Project Folder Manager: the eleven project modules from Admin to Archive, each with its discipline",
    },
    highlights: ["Modules by discipline", "Instant search", "Copy, move, rename", "Drive space"],
    newUntil: "2027-01-31",
    inHero: true,
    shot: {
      src: PFM_FILES.shots.main.src,
      width: PFM_FILES.shots.main.width,
      height: PFM_FILES.shots.main.height,
      alt: "Project Folder Manager: the eleven project modules from Admin to Archive, each with its discipline",
      title: "Project Folder Manager · D:\\Project",
    },
    inNav: false,
  },
];

/** The small label on badges and cards: "Coming soon", "New" or nothing */
export const badgeLabel = (p: Product) => (p.comingSoon ? "Coming soon" : isNew(p) ? "New" : null);

export const isNew = (p: Product, today = new Date().toISOString().slice(0, 10)) => Boolean(p.newUntil && today <= p.newUntil);

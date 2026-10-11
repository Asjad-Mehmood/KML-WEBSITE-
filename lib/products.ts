// Our other software, besides the Excel to KML app itself. Everything that
// promotes them reads this list: the hero badges, the home page spotlight,
// the menu, the footer and the sitemap. To add a tool, add an entry here and
// give it a page at its href.
import { ROADPRO_VERSION } from "@/lib/roadpro";
import { TRAVERSE_FILES, TRAVERSE_SHORT, TRAVERSE_VERSION } from "@/lib/traverse";

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
  highlights: string[];
  /** Shows "Coming soon" instead of "New" (not downloadable yet) */
  comingSoon?: boolean;
  /** Shows a "New" label until this date (YYYY-MM-DD) */
  newUntil?: string;
  /** Show a badge in the home page hero */
  inHero?: boolean;
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
      "Draw the centre line and RoadPro adds the edges, turning radius, barricades or cones, signs, road markings, chainage, cross section and an Excel report, and joins new roads with junctions and turning lanes. Free plugin for AutoCAD, Civil 3D and Map 3D.",
    href: "/roadpro",
    demoHref: "/roadpro#demo",
    image: {
      src: "/roadpro/roadpro-3-network.webp",
      width: 1600,
      height: 636,
      alt: "RoadPro in AutoCAD: lane widening, a T-junction and a skewed junction with kerb returns, road markings, barricades and chainage",
    },
    highlights: ["Junctions and turning lanes", "Signs and markings to standard", "Barricades, cones, kerb", "Widening and tapers", "Cross sections", "Excel report"],
    newUntil: "2027-01-31",
    inHero: true,
    inNav: true,
  },
  {
    id: "traverse",
    name: TRAVERSE_SHORT,
    platform: "Web app and Windows",
    version: TRAVERSE_VERSION,
    tagline: "Traverse and level adjustment, checked and reported",
    description:
      "Enter the coordinates measured on site, close on a known point, adjust with Bowditch, Transit or Equal and get a signed PDF report. Level books by Rise & Fall or HI. Jobs saved to your account and shared with your team.",
    href: "/traverse",
    demoHref: "/traverse#video",
    image: {
      src: "/traverse/intro-cover.webp",
      width: 1024,
      height: 576,
      alt: "Professional Traverse and Level Adjustment Software: precision in every point",
    },
    highlights: ["Coordinate traverse and levelling", "Bowditch, Transit, Equal", "PDF reports and sharing", "Works offline and on a phone"],
    comingSoon: !TRAVERSE_FILES.setup.href,
    newUntil: "2027-01-31",
    inHero: true,
    inNav: true,
  },
];

/** The small label on badges and cards: "Coming soon", "New" or nothing */
export const badgeLabel = (p: Product) => (p.comingSoon ? "Coming soon" : isNew(p) ? "New" : null);

export const isNew = (p: Product, today = new Date().toISOString().slice(0, 10)) => Boolean(p.newUntil && today <= p.newUntil);

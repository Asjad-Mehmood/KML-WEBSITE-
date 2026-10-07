// Our other software, besides the Excel to KML app itself. Everything that
// promotes them reads this list: the hero badges, the home page spotlight,
// the menu, the footer and the sitemap. To add a tool, add an entry here and
// give it a page at its href.
import { ROADPRO_VERSION } from "@/lib/roadpro";

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
      "Draw the centre line and RoadPro adds the edges, turning radius, barricades, signs, road markings, chainage, cross section and an Excel report, and joins new roads with junctions. Free plugin for AutoCAD, Civil 3D and Map 3D.",
    href: "/roadpro",
    demoHref: "/roadpro#demo",
    image: {
      src: "/roadpro/road-plan.webp",
      width: 1500,
      height: 560,
      alt: "RoadPro road in AutoCAD with red and white barricades, lane arrows and chainage",
    },
    highlights: ["Junctions and tie-ins", "Road markings", "Barricades and signs", "Widening and tapers", "Cross sections", "Excel report"],
    newUntil: "2027-01-31",
    inHero: true,
    inNav: true,
  },
];

export const isNew = (p: Product, today = new Date().toISOString().slice(0, 10)) => Boolean(p.newUntil && today <= p.newUntil);

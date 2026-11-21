// Every program's icon: white on its own colours, the same in the menu and on the home page.
import type { LucideIcon } from "lucide-react";
import { Compass, DraftingCompass, FileSpreadsheet, FolderTree, LayoutGrid, Route, TrendingUp } from "lucide-react";
import { PRODUCTS, type Product } from "@/lib/products";

const LOOK: Record<string, { icon: LucideIcon; from: string; to: string }> = {
  "excel-to-kml": { icon: FileSpreadsheet, from: "#16a34a", to: "#4ade80" },
  toolkit: { icon: LayoutGrid, from: "#1d4ed8", to: "#60a5fa" },
  slope: { icon: TrendingUp, from: "#0891b2", to: "#22d3ee" },
  "auto-draft": { icon: DraftingCompass, from: "#7c3aed", to: "#a78bfa" },
  roadpro: { icon: Route, from: "#ea580c", to: "#fb923c" },
  traverse: { icon: Compass, from: "#4f46e5", to: "#818cf8" },
  "folder-manager": { icon: FolderTree, from: "#d97706", to: "#fbbf24" },
};

export function SuiteIcon({ id, size = 40, className = "" }: { id: string; size?: number; className?: string }) {
  const look = LOOK[id] ?? LOOK.toolkit;
  const Icon = look.icon;
  return (
    <span
      aria-hidden
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: `linear-gradient(180deg, ${look.to}, ${look.from})`,
        boxShadow: size >= 28 ? `0 ${size * 0.12}px ${size * 0.4}px ${look.from}55` : undefined,
      }}
    >
      <span className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/35 to-white/0" />
      <Icon className="relative text-white" style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.2} />
    </span>
  );
}

/** Excel to KML itself, in the same shape as the other programs (lib/products.ts) */
export const EXCEL_TO_KML: Product = {
  id: "excel-to-kml",
  name: "Excel to KML",
  platform: "Windows and web",
  version: "",
  tagline: "Survey coordinates to Google Earth, on any grid",
  description:
    "Open the Excel or CSV file from site, choose the grid it was surveyed on and save a KMZ for Google Earth with labels, symbols, site photos and a PDF report, or a DXF for AutoCAD.",
  href: "/excel-to-kml",
  demoHref: "/app",
  image: { src: "/tutorial/map.webp", width: 1600, height: 1000, alt: "Excel to KML: survey points on the map with their symbols and labels" },
  highlights: ["5,800+ EPSG grids", "KML, KMZ, DXF and PDF", "Site photos", "Windows and the web"],
  inNav: true,
};

/** The whole suite, Excel to KML first, then the Survey Toolkit and the other programs */
export const SUITE: Product[] = [EXCEL_TO_KML, ...PRODUCTS];

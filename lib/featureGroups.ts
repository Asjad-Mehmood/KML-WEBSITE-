import type React from "react";
import { Globe, Layers, FileSpreadsheet, Compass, Camera, Shapes, Waypoints } from "lucide-react";

// The feature cards: shown on the home page (components/Features.tsx) and in full on /features.
// Each chip names an entry in lib/featureDetails.ts.

export interface FeatureCard {
  icon: React.ElementType;
  accent: string;
  accentLight: string;
  accentBorder: string;
  accentBar: string;
  badge: string;
  title: string;
  desc: string;
  chips: string[];
  layout?: "wide" | "banner";
  preview?: "grids" | "photo" | "traverse";
}

export const FEATURES: FeatureCard[] = [
  {
    icon: Globe,
    accent: "text-blue-600",
    accentLight: "bg-blue-50",
    accentBorder: "border-blue-200/70",
    accentBar: "bg-blue-500",
    badge: "Global Coverage",
    title: "Official Regional Map Grids",
    desc: "Works with government coordinate grids across UAE, Qatar, Pakistan, Saudi Arabia, the UK, and 5,800+ other coordinate systems worldwide.",
    chips: ["Offline Grid List", "Near This Search", "Accuracy Badges", "Out-of-Area Check"],
    layout: "wide",
    preview: "grids",
  },
  {
    icon: Layers,
    accent: "text-indigo-600",
    accentLight: "bg-indigo-50",
    accentBorder: "border-indigo-200/70",
    accentBar: "bg-indigo-500",
    badge: "Levels",
    title: "Elevations & Levels",
    desc: "Pins sit on Google Earth's terrain with each point's measured level in its balloon, plus level profiles and checks that catch a level that jumps.",
    chips: ["Ground Pins", "Elevation in Balloons", "Level Profile"],
  },
  {
    icon: FileSpreadsheet,
    accent: "text-emerald-700",
    accentLight: "bg-emerald-50",
    accentBorder: "border-emerald-200/70",
    accentBar: "bg-emerald-500",
    badge: "Instant Import",
    title: "Auto-Detects Spreadsheet Columns",
    desc: "Paste rows from Excel or open CSV files from Leica, Trimble, Topcon, or Sokkia. Auto-detects Point ID, Easting, Northing, and Elevation.",
    chips: ["Excel & CSV", "Auto Column Map", "Raw Dumps"],
  },
  {
    icon: Compass,
    accent: "text-violet-600",
    accentLight: "bg-violet-50",
    accentBorder: "border-violet-200/70",
    accentBar: "bg-violet-500",
    badge: "High Precision",
    title: "Local Site Calibration",
    desc: "Aligns local site coordinates with official control benchmarks, adjusting for scale and angle rotation with under 1 mm accuracy.",
    chips: ["Scale Match", "True North", "Under 1 mm"],
  },
  {
    icon: Shapes,
    accent: "text-amber-700",
    accentLight: "bg-amber-50",
    accentBorder: "border-amber-200/70",
    accentBar: "bg-amber-500",
    badge: "Land Boundaries",
    title: "Boundary Lines & Land Area",
    desc: "Connects survey points to draw property perimeter lines. Calculates boundary fence length and land area in square metres and hectares.",
    chips: ["Boundary Traverse", "Perimeter", "Hectares"],
  },
  {
    icon: Waypoints,
    accent: "text-orange-700",
    accentLight: "bg-orange-50",
    accentBorder: "border-orange-200/70",
    accentBar: "bg-orange-500",
    badge: "Traverse Adjust",
    title: "Traverse & Level Adjustment",
    desc: "Close loop, link and open traverses on your control points, adjusted by Bowditch, Transit or least squares, and reduce level runs by rise and fall. The adjusted stations drop straight into your points, ready for Google Earth.",
    chips: ["Bowditch · Transit · LSQ", "Closure Checks", "Level Runs", "Adjustment Report"],
    layout: "banner",
    preview: "traverse",
  },
  {
    icon: Camera,
    accent: "text-rose-600",
    accentLight: "bg-rose-50",
    accentBorder: "border-rose-200/70",
    accentBar: "bg-rose-500",
    badge: "Site Photos",
    title: "Attach Site Inspection Photos",
    desc: "Links field photos to survey marks. Photos pack inside the file so clients click any pin in Google Earth to view the real site photo.",
    chips: ["Click-to-View", "Popup Balloons", "All-in-One KMZ"],
    layout: "banner",
    preview: "photo",
  },
];


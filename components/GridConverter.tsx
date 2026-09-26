"use client";

import dynamic from "next/dynamic";
import { Globe } from "lucide-react";
import type { EpsgRow } from "@/lib/epsgCatalog";

// The quick converter, opened on one grid (browser-only: it uses canvas and proj4)
const HeroConverter = dynamic(() => import("./HeroConverter"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[420px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center gap-2 text-cyan-300 font-mono text-xs">
      <Globe className="w-6 h-6 animate-spin text-cyan-500" aria-hidden />
      <span>Loading converter…</span>
    </div>
  ),
});

// presetId: one of the curated systems; row: any EPSG system from the catalogue
export default function GridConverter({ presetId, row }: { presetId?: string; row?: EpsgRow }) {
  return <HeroConverter initialSystemId={presetId} initialRow={row} />;
}

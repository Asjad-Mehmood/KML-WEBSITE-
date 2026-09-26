import Link from "next/link";
import { GRID_PAGES } from "@/lib/gridPages";
import type { EpsgSystem } from "@/lib/epsgCatalog";

const hrefFor = (code: number) => {
  const curated = GRID_PAGES.find((g) => g.code === code);
  return curated ? `/convert/${curated.slug}` : `/convert/epsg/${code}`;
};

// Plain list of coordinate systems linking to their pages (kept light: some lists are long)
export default function SystemList({ systems }: { systems: EpsgSystem[] }) {
  return (
    <ul className="columns-1 md:columns-2 gap-10 text-[13.5px] leading-snug">
      {systems.map((s) => (
        <li key={s.code} className="break-inside-avoid py-1.5">
          <Link href={hrefFor(s.code)} className="text-slate-800 hover:text-[#0071e3]">
            {s.name}
          </Link>{" "}
          <span className="font-mono text-[11.5px] text-slate-500">{s.code}</span>
        </li>
      ))}
    </ul>
  );
}

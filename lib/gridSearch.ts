// Name / code / country search over every grid, for the search box on the
// /convert pages. Runs on the server so the 5,800-system list never ships to
// the browser; app/convert/search returns the top hits as JSON.
import { GRID_PAGES } from "@/lib/gridPages";
import { allSystems, codeLabel } from "@/lib/epsgCatalog";

export interface GridHit {
  href: string;
  name: string;
  code: string;
  where: string;
  popular: boolean;
}

interface Entry extends GridHit {
  num: number;
  nameText: string;
  text: string;
}

const clean = (s: string) =>
  ` ${s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()} `;

let index: Entry[] | null = null;

function load(): Entry[] {
  if (index) return index;
  const curated = new Map(GRID_PAGES.map((g) => [g.code, g]));
  index = allSystems().map((s) => {
    const g = curated.get(s.code);
    const name = g ? g.name : s.name;
    const nameText = clean([name, ...(g ? [s.name, ...g.aka] : [])].join(" "));
    return {
      href: g ? `/convert/${g.slug}` : `/convert/epsg/${s.code}`,
      name,
      code: codeLabel(s.code),
      where: s.country === "World" ? s.area.split(/[.;,]/)[0] || "World" : s.country,
      popular: Boolean(g),
      num: s.code,
      nameText,
      text: `${nameText}${clean(`${s.country} ${s.area}`)}`,
    };
  });
  return index;
}

export function searchGrids(query: string, limit = 10): GridHit[] {
  const q = clean(query.replace(/^\s*(epsg|esri)\s*:?\s*(?=\d)/i, ""));
  const tokens = q.trim().split(" ").filter(Boolean).slice(0, 8);
  if (!tokens.length) return [];

  const scored: [number, Entry][] = [];
  for (const e of load()) {
    let score = 0;
    let ok = true;
    for (const t of tokens) {
      if (/^\d+$/.test(t) && String(e.num) === t) score += 1000;
      else if (/^\d+$/.test(t) && t.length >= 3 && String(e.num).startsWith(t)) score += 40;
      else if (e.nameText.includes(` ${t} `)) score += 12;
      else if (e.nameText.includes(` ${t}`)) score += 8;
      else if (e.nameText.includes(t)) score += 4;
      else if (e.text.includes(` ${t}`)) score += 3;
      else if (e.text.includes(t)) score += 1;
      else { ok = false; break; }
    }
    if (!ok) continue;
    if (e.popular) score += 30;
    if (e.nameText.startsWith(q.trimEnd())) score += 10;
    scored.push([score - e.name.length / 40, e]);
  }
  return scored
    .sort((a, b) => b[0] - a[0])
    .slice(0, limit)
    .map(([, { href, name, code, where, popular }]) => ({ href, name, code, where, popular }));
}

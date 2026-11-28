"use client";

// The searchable coordinate-system picker: the curated list first, then the whole EPSG registry.
import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, ChevronDown } from "lucide-react";
import { CURATED, CURATED_GROUPS, systemFromRow, type CoordSystem, type EpsgRow } from "@/lib/geo/heroSystems";

/* ─── Searchable system picker (curated list + full EPSG registry) ─── */
const RESULT_LIMIT = 50;

type PickerItem = { key: string; code: number; name: string; flag: string; pick: () => CoordSystem };

export function SystemPicker({ value, onChange }: { value: CoordSystem; onChange: (sys: CoordSystem) => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<EpsgRow[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Fetch the full EPSG list (~160 KB gzipped) only once the picker is first opened
  useEffect(() => {
    if (!open || rows || loadError) return;
    let cancelled = false;
    fetch("/data/epsg-projected.json")
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data: EpsgRow[]) => !cancelled && setRows(data))
      .catch(() => !cancelled && setLoadError(true));
    return () => {
      cancelled = true;
    };
  }, [open, rows, loadError]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const { groups, items, total } = useMemo(() => {
    const curatedItem = (sys: CoordSystem): PickerItem => ({
      key: sys.id, code: sys.code, name: sys.name, flag: sys.flag, pick: () => sys,
    });
    const q = query.trim().toLowerCase().replace(/^epsg:?\s*/, "");
    if (!q) {
      const g = CURATED_GROUPS.map((grp) => ({ label: grp.label, items: grp.systems.map(curatedItem) }));
      return { groups: g, items: g.flatMap((x) => x.items), total: CURATED.length };
    }
    const tokens = q.split(/\s+/);
    const matches = (text: string) => {
      const t = text.toLowerCase();
      return tokens.every((tok) => t.includes(tok));
    };
    // Curated presets match on their own label or on their official EPSG name
    const officialName = new Map((rows ?? []).map((r) => [r[0], r[1]]));
    const curatedHits = CURATED.filter((sys) =>
      matches(`${sys.code} ${sys.name} ${sys.datum} ${officialName.get(sys.code) ?? ""}`)
    );
    const curatedCodes = new Set(CURATED.map((sys) => sys.code));
    const registryHits = (rows ?? []).filter((row) => !curatedCodes.has(row[0]) && matches(`${row[0]} ${row[1]}`));

    // Rank: exact code, then curated, then modern global datums, then registry order
    const rank = (code: number, name: string, curated: boolean) =>
      (String(code) === q ? 0 : 4) + (curated ? 0 : 2) + (/^(WGS 84|ETRS89|NAD83|GDA2020|SIRGAS 2000)\b/.test(name) ? 0 : 1);
    const ranked = [
      ...curatedHits.map((sys) => ({ r: rank(sys.code, officialName.get(sys.code) ?? "WGS 84", true), item: curatedItem(sys) })),
      ...registryHits.map((row) => ({
        r: rank(row[0], row[1], false),
        item: { key: `epsg-${row[0]}`, code: row[0], name: row[1], flag: "🌐", pick: () => systemFromRow(row) },
      })),
    ].sort((a, b) => a.r - b.r);
    const found = ranked.slice(0, RESULT_LIMIT).map((x) => x.item);
    return { groups: [{ label: "", items: found }], items: found, total: ranked.length };
  }, [query, rows]);

  const choose = (item: PickerItem) => {
    onChange(item.pick());
    setOpen(false);
    setQuery("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      const next = Math.max(0, Math.min(items.length - 1, active + (e.key === "ArrowDown" ? 1 : -1)));
      setActive(next);
      listRef.current?.querySelector(`[data-index="${next}"]`)?.scrollIntoView({ block: "nearest" });
    } else if (e.key === "Enter" && items[active]) {
      e.preventDefault();
      choose(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  let index = -1;
  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id="hc-system"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen((o) => !o);
          setActive(0);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-left text-base sm:text-[13px] font-semibold cursor-pointer focus:outline-none focus:ring-2 focus:ring-cyan-400/40"
        style={{ background: "rgba(0, 180, 255, 0.05)", border: "1px solid rgba(0, 180, 255, 0.15)", color: "#e0f2fe" }}
      >
        <span className="shrink-0">{value.flag}</span>
        <span className="flex-1 min-w-0 truncate">{value.name}</span>
        <span className="shrink-0 font-mono text-[11px] text-cyan-400/70">{value.grid}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 text-cyan-400/80 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full mt-1.5 z-30 rounded-lg overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.55)]"
          style={{ background: "#041528", border: "1px solid rgba(0, 180, 255, 0.2)" }}
        >
          <div className="flex items-center gap-2 px-3 py-2" style={{ borderBottom: "1px solid rgba(0, 180, 255, 0.12)" }}>
            <Search className="w-3.5 h-3.5 text-cyan-400/80 shrink-0" />
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded
              aria-controls="hc-system-list"
              aria-activedescendant={items[active] ? `hc-opt-${items[active].key}` : undefined}
              aria-label="Search coordinate systems"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActive(0);
              }}
              onKeyDown={onKeyDown}
              placeholder="Search country, zone or EPSG code…"
              className="flex-1 min-w-0 bg-transparent text-base sm:text-[13px] text-cyan-50 placeholder:text-cyan-400/40 focus:outline-none"
            />
          </div>

          <ul ref={listRef} id="hc-system-list" role="listbox" aria-label="Coordinate systems" className="max-h-56 overflow-y-auto py-1">
            {groups.map((grp) => (
              <React.Fragment key={grp.label || "results"}>
                {grp.label && (
                  <li role="presentation" className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-cyan-400/80">
                    {grp.label}
                  </li>
                )}
                {grp.items.map((item) => {
                  index++;
                  const i = index;
                  const isActive = i === active;
                  const isSelected = item.code === value.code && item.name === value.name;
                  return (
                    <li
                      key={item.key}
                      id={`hc-opt-${item.key}`}
                      role="option"
                      aria-selected={isSelected}
                      data-index={i}
                      onMouseEnter={() => setActive(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => choose(item)}
                      className={`flex items-center gap-2 px-3 py-1.5 text-[12.5px] cursor-pointer ${isActive ? "bg-cyan-400/10" : ""}`}
                    >
                      <span className="shrink-0">{item.flag}</span>
                      <span className={`flex-1 min-w-0 truncate ${isSelected ? "text-cyan-300 font-semibold" : "text-cyan-50"}`}>
                        {item.name}
                      </span>
                      <span className="shrink-0 font-mono text-[10.5px] text-cyan-400/80">EPSG:{item.code}</span>
                    </li>
                  );
                })}
              </React.Fragment>
            ))}
            {items.length === 0 && (
              <li className="px-3 py-4 text-center text-[12px] text-cyan-400/80">
                {rows || loadError ? `No systems match “${query}”` : "Loading EPSG registry…"}
              </li>
            )}
          </ul>

          <div
            className="px-3 py-1.5 text-[10.5px] text-cyan-400/80 flex justify-between gap-2"
            style={{ borderTop: "1px solid rgba(0, 180, 255, 0.12)" }}
          >
            <span>
              {loadError
                ? "Couldn't load the full registry — showing curated systems"
                : query.trim()
                  ? total > items.length
                    ? `Showing ${items.length} of ${total.toLocaleString()} — refine your search`
                    : `${total.toLocaleString()} match${total === 1 ? "" : "es"}`
                  : `${CURATED.length} curated · type to search ${rows ? rows.length.toLocaleString() : "5,800+"} EPSG systems`}
            </span>
            <span className="hidden sm:inline">↑↓ Enter</span>
          </div>
        </div>
      )}
    </div>
  );
}

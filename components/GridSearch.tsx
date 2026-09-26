"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Star } from "lucide-react";
import type { GridHit } from "@/lib/gridSearch";

interface Props {
  id: string;
  placeholder?: string;
  /** Pass "white" on grey panels */
  tone?: "grey" | "white";
}

// Search every grid by name, code, country or area ("dltm", "utm 40n",
// "texas", "32639"). Suggestions come from /convert/search as you type;
// submitting without picking one goes to /convert/find, which also works
// without JavaScript.
export default function GridSearch({ id, placeholder = "Search grids: name, country or EPSG code", tone = "grey" }: Props) {
  const router = useRouter();
  const listId = `${id}-results`;
  const abortRef = useRef<AbortController | null>(null);
  const boxRef = useRef<HTMLFormElement>(null);

  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ query: string; results: GridHit[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    const q = query.trim();
    if (!q) return;
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setLoading(true);
      try {
        const res = await fetch(`/convert/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        const data = (await res.json()) as { results: GridHit[] };
        setHits({ query: q, results: data.results });
        setActive(-1);
      } catch {
        // aborted by a newer query, or offline: keep the last results
      } finally {
        if (abortRef.current === ctrl) setLoading(false);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      abortRef.current?.abort();
    };
  }, []);

  const results = query.trim() && hits ? hits.results : [];
  const showList = open && query.trim().length > 0 && (results.length > 0 || (!loading && hits?.query === query.trim()));

  const go = (hit: GridHit) => {
    setOpen(false);
    router.push(hit.href);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" && results.length) {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp" && results.length) {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === "Enter" && showList && active >= 0 && results[active]) {
      e.preventDefault();
      go(results[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <form ref={boxRef} action="/convert/find" method="get" role="search" className="relative flex gap-2" onSubmit={() => setOpen(false)}>
      <label htmlFor={id} className="sr-only">
        Search grids by name, country or EPSG code
      </label>
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden />
        <input
          id={id}
          name="q"
          type="search"
          required
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showList}
          aria-controls={listId}
          aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className={`w-full h-11 pl-10 pr-9 rounded-xl border border-slate-200 text-base sm:text-[14.5px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white ${
            tone === "white" ? "bg-white" : "bg-slate-50"
          }`}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 animate-spin" aria-hidden />}
      </div>
      <button type="submit" className="h-11 px-5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[14px] font-semibold cursor-pointer">
        Search
      </button>

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Matching grids"
          className="absolute left-0 right-0 top-full mt-2 z-30 max-h-[360px] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-[0_16px_40px_rgba(0,0,0,0.12)] py-1.5"
        >
          {results.length === 0 ? (
            <li className="px-4 py-3 text-[13.5px] text-slate-500">No grid matches &ldquo;{query.trim()}&rdquo;. Try a country, a city&apos;s grid name or an EPSG code.</li>
          ) : (
            results.map((r, i) => (
              <li
                key={r.href}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => go(r)}
                onMouseEnter={() => setActive(i)}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 cursor-pointer ${i === active ? "bg-blue-50" : ""}`}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-1.5 text-[14px] font-semibold text-slate-900">
                    <span className="truncate">{r.name}</span>
                    {r.popular && <Star className="w-3.5 h-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Popular grid" />}
                  </span>
                  <span className="block truncate text-[12px] text-slate-500">{r.where}</span>
                </span>
                <span className="shrink-0 font-mono text-[12px] text-slate-500">{r.code}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </form>
  );
}

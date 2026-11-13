"use client";

// Admin → search: Ctrl+K (⌘K on a Mac) or "/" opens one box that finds any part of Admin, and
// accounts, downloads, messages, files, releases, reviews and Toolkit PCs (app/api/admin/search).
// Arrow keys move, Enter opens, Esc closes.
import { useEffect, useMemo, useRef, useState } from "react";
import { Download, FileText, Inbox, Loader2, Megaphone, Monitor, Search, Star, User, type LucideIcon } from "lucide-react";
import type { AdminGroup } from "@/components/admin/AdminShell";

type Fetcher = (url: string, options?: RequestInit) => Promise<Response>;
type Kind = "account" | "download" | "message" | "file" | "release" | "review" | "pc";
interface Hit {
  kind: Kind;
  id: string;
  title: string;
  sub: string;
  userId?: string | null;
}
interface Item {
  key: string;
  icon: LucideIcon;
  title: string;
  sub: string;
  group: string;
  go: () => void;
}

const KIND: Record<Kind, { label: string; icon: LucideIcon }> = {
  account: { label: "Accounts", icon: User },
  download: { label: "Downloads", icon: Download },
  message: { label: "Messages", icon: Inbox },
  file: { label: "Files", icon: FileText },
  release: { label: "Releases", icon: Megaphone },
  review: { label: "Reviews", icon: Star },
  pc: { label: "Toolkit PCs", icon: Monitor },
};

export function SearchButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--adm-hover)] hover:bg-[var(--adm-hover-strong)] border border-[var(--adm-line)] text-[13px] text-slate-400 cursor-pointer"
      title="Search everything (Ctrl+K)"
      aria-label="Search everything"
    >
      <Search className="w-4 h-4" aria-hidden />
      <span className="hidden md:inline">Search</span>
      <kbd className="hidden md:inline px-1.5 py-0.5 rounded border border-[var(--adm-line)] text-[10.5px] font-semibold text-slate-500">Ctrl K</kbd>
    </button>
  );
}

export default function AdminSearch({
  open,
  onClose,
  groups,
  adminFetch,
  onSection,
  onAccount,
}: {
  open: boolean;
  onClose: () => void;
  groups: AdminGroup[];
  adminFetch: Fetcher;
  /** show a part of Admin */
  onSection: (id: string) => void;
  /** open an account's window */
  onAccount: (userId: string) => void;
}) {
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const fetcher = useRef(adminFetch);
  useEffect(() => {
    fetcher.current = adminFetch;
  });

  useEffect(() => {
    if (open) setTimeout(() => input.current?.focus(), 0);
  }, [open]);

  // ask the server a moment after typing stops
  useEffect(() => {
    if (!open) return;
    const term = q.trim();
    if (term.length < 2) return;
    let live = true;
    const t = setTimeout(() => {
      setBusy(true);
      fetcher.current(`/api/admin/search?q=${encodeURIComponent(term)}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((j) => live && setHits(j.hits || []))
        .catch(() => live && setHits([]))
        .finally(() => live && setBusy(false));
    }, 220);
    return () => {
      live = false;
      clearTimeout(t);
    };
  }, [q, open]);

  const close = () => {
    setQ("");
    setHits([]);
    setSel(0);
    onClose();
  };

  const items: Item[] = useMemo(() => {
    const term = q.trim().toLowerCase();
    const sections: Item[] = groups
      .flatMap((g) => g.sections.map((s) => ({ s, g })))
      .filter(({ s }) => !term || `${s.label} ${s.text}`.toLowerCase().includes(term))
      .map(({ s, g }) => ({ key: `section-${s.id}`, icon: s.icon, title: s.label, sub: `${g.label} · ${s.text}`, group: "Go to", go: () => onSection(s.id) }));
    const found: Item[] =
      term.length < 2
        ? []
        : hits.map((h) => ({
            key: `${h.kind}-${h.id}`,
            icon: KIND[h.kind].icon,
            title: h.title,
            sub: h.sub,
            group: KIND[h.kind].label,
            go: () => {
              if (h.kind === "account" || ((h.kind === "file" || h.kind === "download" || h.kind === "pc") && h.userId)) onAccount(h.userId!);
              else if (h.kind === "message") onSection("messages");
              else if (h.kind === "release") onSection("releases");
              else if (h.kind === "review") onSection("reviews");
              else if (h.kind === "download") onSection("downloads");
              else if (h.kind === "pc") onSection("toolkit");
            },
          }));
    return [...found, ...sections.slice(0, term ? 6 : 20)];
  }, [q, hits, groups, onSection, onAccount]);

  if (!open) return null;
  const pick = (i: number) => {
    const it = items[i];
    if (!it) return;
    it.go();
    close();
  };
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(items.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(sel);
    }
  };

  let lastGroup = "";
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center pt-[10vh] px-3" role="dialog" aria-modal="true" aria-label="Search Admin">
      <button className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" aria-label="Close search" onClick={close} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden" onKeyDown={onKey}>
        <div className="flex items-center gap-3 px-4 border-b border-slate-800">
          <Search className="w-5 h-5 text-slate-500" aria-hidden />
          <input
            ref={input}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
              if (e.target.value.trim().length < 2) setHits([]);
            }}
            placeholder="Search accounts, downloads, messages, files, releases… or a part of Admin"
            className="flex-1 py-4 bg-transparent text-[15px] text-white placeholder:text-slate-500 focus:outline-none"
            aria-label="Search"
          />
          {busy && <Loader2 className="w-4 h-4 text-slate-500 animate-spin" />}
          <kbd className="px-1.5 py-0.5 rounded border border-slate-700 text-[10.5px] font-semibold text-slate-500">Esc</kbd>
        </div>
        <ul className="max-h-[60vh] overflow-y-auto py-2" role="listbox">
          {items.map((it, i) => {
            const head = it.group !== lastGroup ? it.group : null;
            lastGroup = it.group;
            return (
              <li key={it.key}>
                {head && <p className="px-4 pt-3 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-slate-500">{head}</p>}
                <button
                  role="option"
                  aria-selected={i === sel}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => pick(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left cursor-pointer ${i === sel ? "bg-blue-600/20" : ""}`}
                >
                  <it.icon className={`w-4 h-4 shrink-0 ${i === sel ? "text-blue-300" : "text-slate-500"}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-white truncate">{it.title}</span>
                    <span className="block text-xs text-slate-400 truncate">{it.sub}</span>
                  </span>
                </button>
              </li>
            );
          })}
          {!items.length && (
            <li className="px-4 py-8 text-center text-sm text-slate-400">{busy ? "Searching…" : `Nothing found for "${q.trim()}"`}</li>
          )}
        </ul>
        <div className="px-4 py-2 border-t border-slate-800 text-[11px] text-slate-500 flex gap-4">
          <span>↑ ↓ move</span>
          <span>Enter open</span>
          <span>Esc close</span>
        </div>
      </div>
    </div>
  );
}

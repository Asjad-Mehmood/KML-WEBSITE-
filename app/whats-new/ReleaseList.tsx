"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/site";

type Release = { id: number; tag_name: string; name: string | null; body: string | null; html_url: string; published_at: string; draft: boolean; prerelease: boolean };

const API = "https://api.github.com/repos/Asjad-Mehmood/kml-convertor/releases?per_page=12";

/* Release notes are Markdown. This draws the parts they use — headings, lists, bold, code,
   links — as React elements, so nothing in a note can run on the page. */
function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\)|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={k} className="font-semibold text-slate-900">{inline(t.slice(2, -2), k)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={k} className="px-1 py-0.5 rounded bg-slate-100 text-[0.92em]">{t.slice(1, -1)}</code>);
    else if (t.startsWith("[")) {
      const label = t.slice(1, t.indexOf("]"));
      out.push(<a key={k} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-[#0071e3] hover:underline">{label}</a>);
    } else out.push(<em key={k}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function Notes({ md }: { md: string }) {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      blocks.push(<p key={`p${blocks.length}`} className="mt-3 text-[14.5px] text-slate-700 leading-relaxed">{inline(para.join(" "), `p${blocks.length}`)}</p>);
      para = [];
    }
    if (list.length) {
      const items = list;
      blocks.push(
        <ul key={`u${blocks.length}`} className="mt-3 space-y-1.5 list-disc pl-5 text-[14.5px] text-slate-700 leading-relaxed">
          {items.map((it, j) => <li key={j}>{inline(it, `l${blocks.length}-${j}`)}</li>)}
        </ul>
      );
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (h) {
      flush();
      // the release's own title is shown above; skip a top-level heading repeating it
      if (h[1].length === 1) continue;
      blocks.push(<h3 key={`h${blocks.length}`} className="mt-6 text-[16px] font-bold text-slate-900">{inline(h[2], `h${blocks.length}`)}</h3>);
    } else if (li) {
      if (para.length) flush();
      list.push(li[1]);
    } else if (!line.trim() || /^\|/.test(line) || /^-{3,}$/.test(line)) {
      flush();
    } else if (list.length && /^\s{2,}\S/.test(raw)) {
      list[list.length - 1] += " " + line.trim();
    } else {
      if (list.length) flush();
      para.push(line.trim());
    }
  }
  flush();
  return <div>{blocks}</div>;
}

export default function ReleaseList() {
  const [releases, setReleases] = useState<Release[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(API)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((list: Release[]) => alive && setReleases(list.filter((r) => !r.draft)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) {
    return (
      <p className="mt-10 text-[15px] text-slate-600">
        The release notes couldn&apos;t be loaded just now.{" "}
        <a href={`${GITHUB_REPO_URL}/releases`} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#0071e3] hover:underline">
          Read them on GitHub
        </a>
        .
      </p>
    );
  }
  if (!releases) {
    return (
      <p className="mt-10 flex items-center gap-2 text-[15px] text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Loading the release notes…
      </p>
    );
  }
  return (
    <div className="mt-10 space-y-6">
      {releases.map((r, i) => (
        <article key={r.id} className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900">{r.name || r.tag_name}</h2>
            {i === 0 && <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#0071e3] px-2 py-0.5 rounded-md">Latest</span>}
            <time dateTime={r.published_at} className="text-[13px] text-slate-500">
              {new Date(r.published_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </time>
          </div>
          {r.body ? <Notes md={r.body} /> : <p className="mt-3 text-[14.5px] text-slate-600">Improvements and fixes.</p>}
          <a href={r.html_url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1 text-[13.5px] font-semibold text-[#0071e3] hover:underline">
            Downloads for {r.tag_name} <ArrowUpRight className="w-3.5 h-3.5" aria-hidden />
          </a>
        </article>
      ))}
    </div>
  );
}

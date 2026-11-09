"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Loader2 } from "lucide-react";
import { GITHUB_REPO_URL } from "@/lib/site";
import Notes from "@/components/ReleaseNotes";

type Release = { id: number; tag_name: string; name: string | null; body: string | null; html_url: string; published_at: string; draft: boolean; prerelease: boolean };

const API = "https://api.github.com/repos/Asjad-Mehmood/kml-convertor/releases?per_page=12";

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

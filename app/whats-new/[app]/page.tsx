import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import PageShell from "../../../components/PageShell";
import PageIntro from "../../../components/PageIntro";
import ReleaseNotes from "../../../components/ReleaseNotes";
import { BreadcrumbStructuredData } from "../../../components/StructuredData";
import { openGraphFor } from "@/lib/site";
import { NOTES_APPS, releaseNotesOf } from "@/lib/releaseNotes";

// One program's release notes, read from GitHub by the server and shown here (the Toolkit's
// "What's new" opens this page). Kept for ten minutes.
export const revalidate = 600;
export const dynamicParams = false;
export function generateStaticParams() {
  return NOTES_APPS.map((a) => ({ app: a.slug }));
}

async function appOf(params: Promise<{ app: string }>) {
  const { app } = await params;
  return NOTES_APPS.find((a) => a.slug === app) ?? null;
}

export async function generateMetadata({ params }: { params: Promise<{ app: string }> }): Promise<Metadata> {
  const app = await appOf(params);
  if (!app) return {};
  const title = `${app.name}: What's New`;
  const description = `What changed in each version of ${app.name}.`;
  const path = `/whats-new/${app.slug}`;
  return { title, description, alternates: { canonical: path }, openGraph: openGraphFor(path, `${title} | Excel to KML`, description) };
}

const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default async function AppNotesPage({ params }: { params: Promise<{ app: string }> }) {
  const app = await appOf(params);
  if (!app) notFound();
  const releases = await releaseNotesOf(app);
  const latest = releases?.find((r) => !r.prerelease)?.version;
  return (
    <PageShell>
      <BreadcrumbStructuredData name={`${app.name}: What's new`} path={`/whats-new/${app.slug}`} />
      <div className="max-w-[900px] mx-auto px-5 sm:px-8">
        <PageIntro eyebrow="What's new" title={app.name} lead={`What changed in each version of ${app.name}.`} />
        <p className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] font-semibold">
          <Link href={app.page} className="inline-flex items-center gap-1 text-[#0071e3] hover:underline">
            Get {app.name} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
          <Link href="/whats-new" className="inline-flex items-center gap-1 text-[#0071e3] hover:underline">
            All programs <ArrowRight className="w-3.5 h-3.5" aria-hidden />
          </Link>
        </p>
        {!releases ? (
          <p className="mt-10 text-[15px] text-slate-600">The release notes can&apos;t be loaded just now. Please try again in a few minutes.</p>
        ) : releases.length === 0 ? (
          <p className="mt-10 text-[15px] text-slate-600">No releases yet.</p>
        ) : (
          <div className="mt-10 space-y-6 mb-16">
            {releases.map((r) => (
              <article key={r.version} id={`v${r.version}`} className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <h2 className="text-[20px] font-extrabold tracking-tight text-slate-900">{r.title}</h2>
                  {r.version === latest && <span className="text-[11px] font-bold uppercase tracking-wider text-white bg-[#0071e3] px-2 py-0.5 rounded-md">Latest</span>}
                  {r.prerelease && <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">Beta</span>}
                  {r.published && (
                    <time dateTime={r.published} className="text-[13px] text-slate-500">
                      {day(r.published)}
                    </time>
                  )}
                </div>
                {r.body ? <ReleaseNotes md={r.body} /> : <p className="mt-3 text-[14.5px] text-slate-600">Improvements and fixes.</p>}
              </article>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

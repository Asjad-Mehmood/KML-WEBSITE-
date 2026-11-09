import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import NextSteps from "../../components/NextSteps";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import ReleaseList from "./ReleaseList";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { openGraphFor } from "@/lib/site";
import { ROADPRO_RELEASED, ROADPRO_VERSION } from "@/lib/roadpro";
import { TRAVERSE_RELEASED, TRAVERSE_VERSION } from "@/lib/traverse";
import { SLOPE_RELEASED, SLOPE_VERSION } from "@/lib/slope";
import { PFM_RELEASED, PFM_VERSION } from "@/lib/folderManager";
import { PRODUCTS } from "@/lib/products";

const TITLE = "What's New";
const DESCRIPTION = "What changed in each version of Excel to KML, and the release notes of RoadPro, Traverse & Level, Slope Calculator, Project Folder Manager and Survey Toolkit.";

// The other programs' latest versions, with where their changes are listed
const OTHERS: { name: string; version: string | null; released: string | null; href: string; label: string }[] = [
  { name: "RoadPro", version: ROADPRO_VERSION, released: ROADPRO_RELEASED, href: "/roadpro#new", label: "New in this version" },
  { name: "Traverse & Level", version: TRAVERSE_VERSION, released: TRAVERSE_RELEASED, href: "/whats-new/traverse", label: "Release notes" },
  { name: "Slope Calculator", version: SLOPE_VERSION, released: SLOPE_RELEASED, href: "/whats-new/slope", label: "Release notes" },
  { name: "Project Folder Manager", version: PFM_VERSION, released: PFM_RELEASED, href: "/whats-new/folder-manager", label: "Release notes" },
  { name: "Survey Toolkit", version: PRODUCTS.find((x) => x.id === "toolkit")?.version ?? null, released: null, href: "/whats-new/survey-toolkit", label: "Release notes" },
];
const day = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/whats-new" },
  openGraph: openGraphFor("/whats-new", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default function WhatsNewPage() {
  return (
    <PageShell>
      <BreadcrumbStructuredData name="What's new" path="/whats-new" />
      <div className="max-w-[900px] mx-auto px-5 sm:px-8">
        <PageIntro
          eyebrow="What's new"
          title="Release notes"
          lead="What changed in each version of Excel to KML. The Windows app offers every new version by itself when it opens."
        />
        <section aria-labelledby="others-h" className="mt-8">
          <h2 id="others-h" className="text-[13px] font-bold uppercase tracking-wider text-slate-500">Our other programs</h2>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {OTHERS.map((o) => {
              const external = o.href.startsWith("http");
              return (
                <li key={o.name} className="rounded-2xl border border-slate-200/80 bg-white p-4">
                  <p className="text-[15px] font-bold text-slate-900">
                    {o.name} {o.version && <span className="text-[#0071e3]">{o.version}</span>}
                  </p>
                  {o.released && <p className="text-[12.5px] text-slate-500">Released {day(o.released)}</p>}
                  <Link
                    href={o.href}
                    {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="mt-2 inline-flex items-center gap-1 text-[13px] font-semibold text-[#0071e3] hover:underline"
                  >
                    {o.label} <ArrowRight className="w-3.5 h-3.5" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
        <ReleaseList />
        <NextSteps title="Get the latest version" />
      </div>
    </PageShell>
  );
}

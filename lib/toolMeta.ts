import type { Metadata } from "next";
import { toolBySlug } from "@/lib/tools";
import { openGraphFor } from "@/lib/site";

export function toolMetadata(slug: string): Metadata {
  const t = toolBySlug(slug)!;
  const path = `/tools/${slug}`;
  return {
    title: t.title.length > 42 ? { absolute: t.title } : t.title,
    description: t.description,
    alternates: { canonical: path },
    openGraph: openGraphFor(path, t.title, t.description),
  };
}

/** The tool itself (/tools/<slug>/use): searches land on its front page instead. */
export function toolUseMetadata(slug: string): Metadata {
  const t = toolBySlug(slug)!;
  return {
    title: { absolute: `${t.name} — free tool | Excel to KML` },
    description: t.description,
    alternates: { canonical: `/tools/${slug}` },
    robots: { index: false, follow: true },
  };
}

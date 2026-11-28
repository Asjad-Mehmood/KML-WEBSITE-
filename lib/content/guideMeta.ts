import type { Metadata } from "next";
import { guideBySlug } from "@/lib/content/guides";
import { openGraphFor } from "@/lib/content/site";

export function guideMetadata(slug: string): Metadata {
  const g = guideBySlug(slug)!;
  const path = `/guides/${slug}`;
  return {
    title: g.title.length > 42 ? { absolute: g.title } : g.title,
    description: g.description,
    alternates: { canonical: path },
    openGraph: { ...openGraphFor(path, g.title, g.description), type: "article" },
  };
}

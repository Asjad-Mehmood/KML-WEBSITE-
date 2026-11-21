import type { Metadata } from "next";
import HomeClient from "../HomeClient";
import { FaqStructuredData } from "../../components/StructuredData";
import { DEFAULT_TITLE, SITE_DESCRIPTION, openGraphFor } from "@/lib/site";
import { publicStats } from "@/lib/publicStats";

// Excel to KML's own page: the hero with the download, the live converter, its features, the
// tutorial, the installer, grids and guides, and its questions. (The home page is about every program.)
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: DEFAULT_TITLE },
  description: SITE_DESCRIPTION,
  alternates: { canonical: "/excel-to-kml" },
  openGraph: openGraphFor("/excel-to-kml", DEFAULT_TITLE, SITE_DESCRIPTION),
};

export default async function ExcelToKmlPage() {
  const stats = await publicStats().catch(() => null);
  return (
    <>
      <FaqStructuredData short />
      <HomeClient heroStyle="classic" stats={stats} />
    </>
  );
}

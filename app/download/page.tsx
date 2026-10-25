import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import DownloadClient from "./DownloadClient";
import ProductReviews from "../../components/ProductReviews";
import { SHOW_ANDROID, openGraphFor } from "@/lib/site";

const TITLE = "Download";
const DESCRIPTION =
  `Download Excel to KML for Windows 10 and 11${SHOW_ANDROID ? ", get the Android app," : ""} or use it in your browser. Free, with automatic updates.`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/download" },
  openGraph: openGraphFor("/download", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default function DownloadPage() {
  return (
    <PageShell>
      <BreadcrumbStructuredData name="Download" path="/download" />
      <DownloadClient />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8 pb-6">
        <ProductReviews product="excel-to-kml" name="Excel to KML" />
      </div>
    </PageShell>
  );
}

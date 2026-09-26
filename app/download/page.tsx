import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import DownloadClient from "./DownloadClient";
import { openGraphFor } from "@/lib/site";

const TITLE = "Download";
const DESCRIPTION =
  "Download Excel to KML for Windows 10 and 11, get the Android app, or use it in your browser. Free, with automatic updates.";

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
    </PageShell>
  );
}

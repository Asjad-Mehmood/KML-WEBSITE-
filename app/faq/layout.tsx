import type { Metadata } from "next";
import { BreadcrumbStructuredData, FaqStructuredData } from "../../components/StructuredData";
import { openGraphFor } from "@/lib/site";

const TITLE = "Survey Coordinate & Google Earth KML FAQ";
const DESCRIPTION =
  "Answers on finding your EPSG grid, site calibration, importing total station CSV files, 3D elevations and boundaries in Google Earth, and data privacy.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: openGraphFor("/faq", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FaqStructuredData />
      <BreadcrumbStructuredData name="FAQ" path="/faq" />
      {children}
    </>
  );
}

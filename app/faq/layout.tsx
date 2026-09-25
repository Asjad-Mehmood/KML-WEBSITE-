import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://exceltokml.pro";

export const metadata: Metadata = {
  title: "Surveyor FAQ & Geodetic Coordinate Guide",
  description:
    "Common questions on EPSG coordinate systems, total station CSV formatting, Helmert 2D site calibration, and 3D elevation extrusions in Google Earth Pro.",
  alternates: {
    canonical: `${baseUrl}/faq`,
  },
  openGraph: {
    title: "Surveyor FAQ & Geodetic Guide | Excel to KML Pro",
    description:
      "Answers to top geomatics questions: EPSG map grids, total station CSV formatting, Helmert 2D transformations, and 3D elevation extrusions.",
    url: `${baseUrl}/faq`,
    type: "website",
    images: ["/assets/hero_geospatial.jpg"],
  },
};

export default function FaqLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

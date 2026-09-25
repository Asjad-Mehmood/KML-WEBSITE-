import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://exceltokml.pro";

export const metadata: Metadata = {
  title: "Online Web Coordinate Converter — Excel & CSV to KML Preview",
  description:
    "Parse survey coordinates and generate Google Earth KML files directly in your web browser. Instant preview of Easting, Northing, and WGS84 positions.",
  alternates: {
    canonical: `${baseUrl}/app`,
  },
  openGraph: {
    title: "Online Web Coordinate Converter | Excel to KML Pro",
    description:
      "Parse survey coordinates and preview Google Earth KML files directly in your browser with zero installation.",
    url: `${baseUrl}/app`,
    type: "website",
    images: ["/assets/hero_geospatial.jpg"],
  },
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

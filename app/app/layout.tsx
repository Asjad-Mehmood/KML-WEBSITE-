import { excelTitle } from "@/lib/site";
import type { Metadata } from "next";

// The web app needs a sign-in, so there is nothing here for search engines to index
export const metadata: Metadata = {
  title: { absolute: excelTitle("Web App") },
  description: "Convert survey coordinates to Google Earth KML, KMZ and DXF in your browser.",
  robots: { index: false, follow: false },
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

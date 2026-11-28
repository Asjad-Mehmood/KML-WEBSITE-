import type { Metadata } from "next";
import { EXCEL_TITLE, excelTitle } from "@/lib/site";

// Excel to KML's own pages keep "… | Excel to KML" in their titles (app/layout.tsx)
export const metadata: Metadata = { title: { template: EXCEL_TITLE, default: excelTitle("Survey Grid to KML Converters") } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { companyTitle } from "@/lib/content/site";

export const metadata: Metadata = {
  title: companyTitle("Create account"),
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

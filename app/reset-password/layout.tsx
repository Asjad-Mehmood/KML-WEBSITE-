import type { Metadata } from "next";
import { companyTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: companyTitle("Reset password"),
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

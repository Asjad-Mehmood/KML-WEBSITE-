import type { Metadata } from "next";
import { companyTitle } from "@/lib/content/site";

export const metadata: Metadata = {
  title: companyTitle("Forgot password"),
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

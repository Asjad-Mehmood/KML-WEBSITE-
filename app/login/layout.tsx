import type { Metadata } from "next";
import { companyTitle } from "@/lib/site";

export const metadata: Metadata = {
  title: companyTitle("Sign in"),
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

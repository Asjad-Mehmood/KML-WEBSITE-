import type { Metadata } from "next";
import { SigninStep } from "../step";
import { companyTitle } from "@/lib/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: companyTitle("Sign in"), robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <SigninStep step="password" searchParams={searchParams} />;
}

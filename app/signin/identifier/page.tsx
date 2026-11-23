import type { Metadata } from "next";
import { SigninStep } from "../step";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <SigninStep step="identifier" searchParams={searchParams} />;
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SignupStep } from "../../signin/step";
import { SIGNUP_STEPS, type SignupStepName } from "../steps";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Create your account", robots: { index: false, follow: false } };

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ step: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { step } = await params;
  if (!(SIGNUP_STEPS as readonly string[]).includes(step)) notFound();
  return <SignupStep step={step as SignupStepName} searchParams={searchParams} />;
}

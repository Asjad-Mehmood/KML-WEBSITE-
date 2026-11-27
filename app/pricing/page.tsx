import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import PricingPlans from "../../components/PricingPlans";
import { companyTitle } from "@/lib/site";
import { billingState } from "@/lib/billing";
import { PLANS, freePoints } from "@/lib/plans";

// /pricing: only while the pricing is switched on in Admin → Payments; otherwise there is no such page
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: companyTitle("Pricing"),
  description: "Free for everyday use, Pro for no limits in the Excel to KML, Traverse & Level and Slope Calculator web apps.",
  robots: { index: false, follow: false },
};

export default async function PricingPage() {
  const state = await billingState();
  if (!state.pricing) notFound();
  const c = state.config;
  const free = { ...PLANS.free, points: freePoints(c.freeWork, c.freeJobs) };
  return (
    <PageShell>
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro
          eyebrow="Pricing"
          title="Free for everyday work. Pro for no limits."
          lead="The web apps (Excel to KML, Traverse & Level and Slope Calculator) are free up to a monthly limit. Pro takes the limits away. The Windows programs stay free."
        />
        <PricingPlans free={free} pro={PLANS.pro} prices={{ monthly: c.priceMonthly, yearly: c.priceYearly, currency: "USD" }} />
      </div>
    </PageShell>
  );
}

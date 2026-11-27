import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import PricingPlans from "../../components/PricingPlans";
import { companyTitle } from "@/lib/site";
import { billingEnabled } from "@/lib/billing";
import { PLANS, PRICES } from "@/lib/plans";

// /pricing: only while the paid plans are switched on (lib/billing); otherwise there is no such page
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: companyTitle("Pricing"),
  description: "Free for everyday use, Pro for no limits in the Excel to KML, Traverse & Level and Slope Calculator web apps.",
  robots: { index: false, follow: false },
};

export default function PricingPage() {
  if (!billingEnabled()) notFound();
  return (
    <PageShell>
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <PageIntro
          eyebrow="Pricing"
          title="Free for everyday work. Pro for no limits."
          lead="The web apps (Excel to KML, Traverse & Level and Slope Calculator) are free up to a monthly limit. Pro takes the limits away. The Windows programs stay free."
        />
        <PricingPlans free={PLANS.free} pro={PLANS.pro} prices={PRICES} />
      </div>
    </PageShell>
  );
}

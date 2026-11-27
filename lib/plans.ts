// The plans for the web apps (Excel to KML, Traverse & Level, Slope Calculator): what each one
// allows, and its price. Safe to import from the browser: no database, no secrets.
//
// Nothing here is enforced unless the paid plans are switched on (lib/billing billingEnabled):
// off by default, and off on the live site unless BILLING_IN_PRODUCTION=1 is set as well.

export type PlanId = "free" | "pro";

/** What the limits count */
export type Meter = "monthlyWork" | "jobs:kml" | "jobs:traverse" | "jobs:slope";

export type Plan = {
  id: PlanId;
  name: string;
  /** null: no plan limit (the storage caps in lib/uploadLimits still hold) */
  limits: Record<Meter, number | null>;
  /** what the plan gives, for the pricing page */
  points: string[];
};

/** Prices in US dollars. Placeholders: set the real ones before the plans go live. */
export const PRICES = { monthly: 6, yearly: 60, currency: "USD" } as const;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    limits: { monthlyWork: 30, "jobs:kml": 10, "jobs:traverse": 10, "jobs:slope": 10 },
    points: [
      "30 conversions, exports and calculations a month",
      "10 jobs kept in your account in each app",
      "Every grid, every format",
      "The Windows programs",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    limits: { monthlyWork: null, "jobs:kml": null, "jobs:traverse": null, "jobs:slope": null },
    points: [
      "No monthly limit on work",
      "Keep as many jobs as your storage holds",
      "Everything in Free",
      "Priority help by email",
    ],
  },
};

export const METER_LABEL: Record<Meter, string> = {
  monthlyWork: "Work this month",
  "jobs:kml": "Excel to KML jobs kept",
  "jobs:traverse": "Traverse & Level jobs kept",
  "jobs:slope": "Slope calculations kept",
};

/** What a free account may do before it is asked to upgrade (Admin → Usage counts against these) */
export const FREE_LIMITS = {
  savedJobs: PLANS.free.limits["jobs:kml"] ?? 10,
  monthlyWork: PLANS.free.limits.monthlyWork ?? 30,
  activeDays: 12,
};

export const UPGRADE_PATH = "/pricing";

/** The words shown when a limit is reached */
export function limitText(meter: Meter, limit: number): string {
  switch (meter) {
    case "monthlyWork":
      return `You have used the ${limit} free conversions, exports and calculations for this month. Upgrade to Pro for no limit, or carry on next month.`;
    case "jobs:kml":
      return `Your free account keeps ${limit} Excel to KML jobs. Upgrade to Pro to keep more, or delete one first. This job is still on this computer.`;
    case "jobs:traverse":
      return `Your free account keeps ${limit} Traverse & Level jobs. Upgrade to Pro to keep more, or delete one first. This job is still on this computer.`;
    case "jobs:slope":
      return `Your free account keeps ${limit} slope calculations. Upgrade to Pro to keep more, or delete one first. Your calculation is still on this device.`;
  }
}

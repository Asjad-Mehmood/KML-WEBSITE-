// The plans for the web apps (Excel to KML, Traverse & Level, Slope Calculator): what each one
// allows, and its price. Safe to import from the browser: no database, no secrets.
//
// Nothing here is enforced unless the limits are switched on in Admin → Payments (lib/billingConfig),
// where the free limits and the prices shown are set too; the numbers here are only the defaults.

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

/** Prices in US dollars (defaults: Admin → Payments sets the ones shown) */
export const PRICES = { monthly: 6, yearly: 60, currency: "USD" };
export type Prices = { monthly: number; yearly: number; currency: string };

/** What the free plan gives, in words, for these limits */
export function freePoints(work: number, jobs: number): string[] {
  return [
    `${work} conversions, exports and calculations a month`,
    `${jobs} jobs kept in your account in each app`,
    "Every grid, every format",
    "The Windows programs",
  ];
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    limits: { monthlyWork: 30, "jobs:kml": 10, "jobs:traverse": 10, "jobs:slope": 10 },
    points: freePoints(30, 10),
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

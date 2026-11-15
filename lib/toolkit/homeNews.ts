import { prisma } from "@/lib/prisma";
import { ensureReleaseTables, normVersion } from "@/lib/releases";
import { REVIEW_PRODUCTS, publishedReviewsAll, type ReviewProduct } from "@/lib/reviews";
import { toolkitFeed } from "@/lib/toolkit/feed";
import { TOOLKIT_TOOLS } from "@/lib/toolkit/tools";

// Survey Toolkit's page (the home page when it shows the Toolkit): what's new in each tool, and
// what people say. The version, date and notes link come from the Toolkit's feed, so they always
// match the versions on the page; the headline and points come from Admin → Releases when that
// version is there. Every part is optional: a part that can't be read is left out.

export interface NewsItem {
  id: string;
  name: string;
  version: string;
  /** ISO date, or null when unknown */
  released: string | null;
  /** release notes on this site (a path) */
  href: string;
  title: string | null;
  points: string[];
  /** out in the last two weeks */
  fresh: boolean;
  /** "today", "3 days ago", or the date */
  ago: string | null;
}

const DAY = 864e5;
const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
function agoOf(iso: string | null, now: number) {
  if (!iso) return null;
  const d = Math.floor((now - new Date(iso).getTime()) / DAY);
  return d <= 0 ? "today" : d === 1 ? "yesterday" : d < 30 ? `${d} days ago` : fmt(iso);
}

const pathOf = (u: string | null, fallback: string) => {
  if (!u) return fallback;
  try {
    const url = new URL(u);
    return /(^|\.)exceltokml\.com$/.test(url.hostname) ? url.pathname : fallback;
  } catch {
    return u.startsWith("/") ? u : fallback;
  }
};

/** Each tool's newest version, newest first */
export async function homeNews(): Promise<NewsItem[]> {
  const feed = await toolkitFeed().catch(() => null);
  if (!feed) return [];
  const tools = feed.tools.filter((t) => t.version);
  // the headline and points of those versions, from Admin → Releases
  const rows = await ensureReleaseTables()
    .then(() =>
      prisma.productRelease.findMany({
        where: { OR: tools.map((t) => ({ app: t.id, version: { in: [normVersion(t.version!), `v${normVersion(t.version!)}`] } })) },
        select: { app: true, title: true, notes: true },
      })
    )
    .catch(() => []);
  const now = Date.now();
  return tools
    .map((t) => {
      const row = rows.find((r) => r.app === t.id);
      const points = (row?.notes ?? "")
        .split("\n")
        .map((l) => l.replace(/^[-*•]\s*/, "").trim())
        .filter(Boolean)
        .slice(0, 3);
      const released = t.released ? new Date(t.released).toISOString() : null;
      return {
        fresh: !!released && now - new Date(released).getTime() < 14 * DAY,
        ago: agoOf(released, now),
        id: t.id,
        name: TOOLKIT_TOOLS.find((x) => x.id === t.id)?.name ?? t.name,
        version: normVersion(t.version!),
        released,
        href: pathOf(t.notes, pathOf(t.page, "/whats-new")),
        title: row?.title ?? null,
        points,
      };
    })
    .sort((a, b) => (b.released ?? "").localeCompare(a.released ?? ""));
}

/** Published reviews with a comment, and each program's average, with the programs' names; null when there are none */
export async function homeReviews() {
  const r = await publishedReviewsAll(9).catch(() => null);
  if (!r || !r.reviews.length) return null;
  const nameOf = (p: ReviewProduct) => REVIEW_PRODUCTS[p]?.name ?? p;
  return {
    count: r.count,
    products: r.products.map((p) => ({ ...p, name: nameOf(p.product), href: REVIEW_PRODUCTS[p.product]?.href ?? "/" })),
    reviews: r.reviews.map((x) => ({ ...x, productName: nameOf(x.product) })),
  };
}

export type HomeReviewsData = NonNullable<Awaited<ReturnType<typeof homeReviews>>>;

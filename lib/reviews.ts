import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Reviews of our programs, asked for after a download (components/ReviewPrompt.tsx). One review
 * per account and program, which the author can change. New and changed reviews wait for the
 * admin (Admin → Reviews) before they show on the program's page. The table is created on first
 * use, so no migration is needed.
 */

export const REVIEW_PRODUCTS = {
  "excel-to-kml": { name: "Excel to KML", assets: ["windows_installer"], href: "/download" },
  roadpro: { name: "RoadPro", assets: ["roadpro"], href: "/roadpro" },
  traverse: { name: "Traverse & Level", assets: ["traverse"], href: "/traverse" },
  "project-folder-manager": { name: "Project Folder Manager", assets: ["folder_manager"], href: "/project-folder-manager" },
  "slope-calculator": { name: "Slope Calculator", assets: ["slope"], href: "/slope-calculation" },
  "auto-draft": { name: "Auto Drafting", assets: ["auto_draft"], href: "/auto-draft" },
  toolkit: { name: "Survey Toolkit", assets: ["toolkit"], href: "/toolkit" },
} as const;
export type ReviewProduct = keyof typeof REVIEW_PRODUCTS;
export const isReviewProduct = (p: unknown): p is ReviewProduct => typeof p === "string" && p in REVIEW_PRODUCTS;
export type ReviewStatus = "pending" | "published" | "hidden";

let ready: Promise<void> | null = null;
function ensure(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "reviews" (
        "id" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "product" TEXT NOT NULL,
        "rating" INTEGER NOT NULL,
        "comment" TEXT NOT NULL DEFAULT '',
        "version" TEXT NOT NULL DEFAULT '',
        "status" TEXT NOT NULL DEFAULT 'pending',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "reviews_user_product_key" ON "reviews"("userId","product")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "reviews_product_status_idx" ON "reviews"("product","status")`);
      await prisma.$executeRawUnsafe(`DO $$ BEGIN
        ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey" FOREIGN KEY ("userId")
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

/** A comment that must wait for the admin whatever its stars: a link, a web address or an email address */
export const needsALook = (comment: string) =>
  /https?:\/\/|www\.|\b[\w.-]+\.(com|net|org|io|co|info|xyz|ru|cn)\b|[\w.+-]+@[\w-]+\.[\w.]+/i.test(comment);

/**
 * Write or change the account's review of a program. It waits for the admin again, unless Admin →
 * Reviews publishes reviews with this many stars by themselves (autoPublish) and the comment has no
 * link or address. Returns the status it was saved with.
 */
export async function saveReview(userId: string, product: ReviewProduct, rating: number, comment: string, version: string, autoPublish = 0): Promise<ReviewStatus> {
  await ensure();
  const status: ReviewStatus = autoPublish > 0 && rating >= autoPublish && !needsALook(comment) ? "published" : "pending";
  await prisma.$executeRawUnsafe(
    `INSERT INTO "reviews" ("id","userId","product","rating","comment","version","status","updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,CURRENT_TIMESTAMP)
     ON CONFLICT ("userId","product") DO UPDATE SET "rating"=$4,"comment"=$5,"version"=$6,"status"=$7,"updatedAt"=CURRENT_TIMESTAMP`,
    crypto.randomUUID(), userId, product, rating, comment, version, status
  );
  return status;
}

/**
 * Programs this account downloaded and hasn't reviewed yet, newest download first, with when and
 * which version: the review prompt asks about them.
 */
/** This account's own review of a program, to show on the review page */
export async function ownReview(userId: string, product: ReviewProduct) {
  await ensure();
  const [r] = await prisma.$queryRawUnsafe<{ rating: number; comment: string; status: ReviewStatus }[]>(
    `SELECT "rating", "comment", "status" FROM "reviews" WHERE "userId" = $1 AND "product" = $2`,
    userId,
    product
  );
  return r ?? null;
}

export async function reviewsDue(userId: string) {
  await ensure();
  const done = await prisma.$queryRawUnsafe<{ product: string }[]>(`SELECT "product" FROM "reviews" WHERE "userId" = $1`, userId);
  const reviewed = new Set(done.map((d) => d.product));
  const out: { product: ReviewProduct; name: string; downloadedAt: string; version: string }[] = [];
  for (const [product, p] of Object.entries(REVIEW_PRODUCTS) as [ReviewProduct, (typeof REVIEW_PRODUCTS)[ReviewProduct]][]) {
    if (reviewed.has(product)) continue;
    const d = await prisma.download.findFirst({
      where: { userId, assetType: { in: [...p.assets] } },
      orderBy: { timestamp: "desc" },
      select: { timestamp: true, version: true },
    });
    if (d) out.push({ product, name: p.name, downloadedAt: d.timestamp.toISOString(), version: d.version });
  }
  return out.sort((a, b) => b.downloadedAt.localeCompare(a.downloadedAt));
}

export type PublicReview = { id: string; name: string; organization: string; rating: number; comment: string; version: string; date: string };

/** The home page: each program's published average and count, and the latest reviews of any of them */
export async function publishedReviewsAll(limit = 6) {
  await ensure();
  const [rows, stats] = await Promise.all([
    prisma.$queryRawUnsafe<{ id: string; product: string; name: string | null; organization: string | null; rating: number; comment: string; version: string; updatedAt: Date }[]>(
      `SELECT r."id", r."product", u."name", u."organization", r."rating", r."comment", r."version", r."updatedAt"
       FROM "reviews" r JOIN "users" u ON u."id" = r."userId"
       WHERE r."status" = 'published' AND r."comment" <> ''
       ORDER BY r."rating" DESC, r."updatedAt" DESC LIMIT $1`,
      limit
    ),
    prisma.$queryRawUnsafe<{ product: string; n: bigint; avg: number | null }[]>(
      `SELECT "product", COUNT(*) AS n, AVG("rating")::float AS avg FROM "reviews" WHERE "status" = 'published' GROUP BY "product"`
    ),
  ]);
  const products = stats
    .filter((s) => isReviewProduct(s.product))
    .map((s) => ({ product: s.product as ReviewProduct, count: Number(s.n), average: s.avg ? Math.round(s.avg * 10) / 10 : 0 }));
  const reviews = rows
    .filter((r) => isReviewProduct(r.product))
    .map((r) => ({ ...toPublic(r), product: r.product as ReviewProduct }));
  return { count: products.reduce((t, p) => t + p.count, 0), products, reviews };
}

// first name and the initial of the last name only
const shortName = (n: string | null) => {
  const p = (n || "A surveyor").trim().split(/\s+/);
  return p.length > 1 ? `${p[0]} ${p[p.length - 1][0]}.` : p[0];
};
const toPublic = (r: { id: string; name: string | null; organization: string | null; rating: number; comment: string; version: string; updatedAt: Date }): PublicReview => ({
  id: r.id, name: shortName(r.name), organization: r.organization && r.organization !== "Independent Surveyor" ? r.organization : "",
  rating: r.rating, comment: r.comment, version: r.version, date: new Date(r.updatedAt).toISOString(),
});

/** Published reviews of a program and their average, for its page */
export async function publishedReviews(product: ReviewProduct, limit = 6) {
  await ensure();
  const [rows, stats] = await Promise.all([
    prisma.$queryRawUnsafe<{ id: string; name: string | null; organization: string | null; rating: number; comment: string; version: string; updatedAt: Date }[]>(
      `SELECT r."id", u."name", u."organization", r."rating", r."comment", r."version", r."updatedAt"
       FROM "reviews" r JOIN "users" u ON u."id" = r."userId"
       WHERE r."product" = $1 AND r."status" = 'published'
       ORDER BY (r."comment" <> '') DESC, r."updatedAt" DESC LIMIT $2`,
      product, limit
    ),
    prisma.$queryRawUnsafe<{ n: bigint; avg: number | null }[]>(
      `SELECT COUNT(*) AS n, AVG("rating")::float AS avg FROM "reviews" WHERE "product" = $1 AND "status" = 'published'`, product
    ),
  ]);
  const reviews: PublicReview[] = rows.map(toPublic);
  return { count: Number(stats[0]?.n ?? 0), average: stats[0]?.avg ? Math.round(stats[0].avg * 10) / 10 : 0, reviews };
}

export type AdminReview = {
  id: string; userId: string; email: string | null; name: string | null; product: string; rating: number; comment: string;
  version: string; status: ReviewStatus; createdAt: string; updatedAt: string;
};

export type ReviewFilter = { status?: string; product?: string; q?: string; stars?: number; withComment?: boolean; sort?: string };

export async function adminReviews(f: ReviewFilter = {}) {
  await ensure();
  const where: string[] = [];
  const args: unknown[] = [];
  const p = (v: unknown) => {
    args.push(v);
    return `$${args.length}`;
  };
  if (f.status === "pending" || f.status === "published" || f.status === "hidden") where.push(`r."status" = ${p(f.status)}`);
  if (isReviewProduct(f.product)) where.push(`r."product" = ${p(f.product)}`);
  if (f.stars && f.stars >= 1 && f.stars <= 5) where.push(`r."rating" = ${p(f.stars)}`);
  if (f.withComment) where.push(`r."comment" <> ''`);
  if (f.q) {
    const like = p(`%${f.q.replace(/[%_\\]/g, (c) => "\\" + c)}%`);
    where.push(`(r."comment" ILIKE ${like} OR u."email" ILIKE ${like} OR u."name" ILIKE ${like} OR r."version" ILIKE ${like})`);
  }
  const orders: Record<string, string> = {
    oldest: `r."updatedAt" ASC`,
    lowest: `r."rating" ASC, r."updatedAt" DESC`,
    highest: `r."rating" DESC, r."updatedAt" DESC`,
    newest: `r."updatedAt" DESC`,
  };
  const order = orders[f.sort ?? "newest"] ?? orders.newest;
  const since = new Date(Date.now() - 30 * 864e5);
  const [rows, summary, spread, recent] = await Promise.all([
    prisma.$queryRawUnsafe<(Omit<AdminReview, "createdAt" | "updatedAt"> & { createdAt: Date; updatedAt: Date })[]>(
      `SELECT r."id", r."userId", u."email", u."name", r."product", r."rating", r."comment", r."version", r."status", r."createdAt", r."updatedAt"
       FROM "reviews" r LEFT JOIN "users" u ON u."id" = r."userId"
       ${where.length ? `WHERE ${where.join(" AND ")}` : ""} ORDER BY ${order} LIMIT 500`,
      ...args
    ),
    prisma.$queryRawUnsafe<{ product: string; status: string; n: bigint; avg: number }[]>(
      `SELECT "product", "status", COUNT(*) AS n, AVG("rating")::float AS avg FROM "reviews" GROUP BY "product", "status"`
    ),
    // how many of each star, per program
    prisma.$queryRawUnsafe<{ product: string; rating: number; n: bigint }[]>(`SELECT "product", "rating", COUNT(*) AS n FROM "reviews" GROUP BY 1, 2`),
    // the last 30 days against everything before
    prisma.$queryRawUnsafe<{ product: string; recent: number | null; before: number | null; n: bigint }[]>(
      `SELECT "product", (AVG("rating") FILTER (WHERE "updatedAt" >= $1))::float recent, (AVG("rating") FILTER (WHERE "updatedAt" < $1))::float before,
              COUNT(*) FILTER (WHERE "updatedAt" >= $1) n FROM "reviews" GROUP BY 1`,
      since
    ),
  ]);
  const round = (v: number | null) => (v == null ? null : Math.round(v * 10) / 10);
  return {
    reviews: rows.map((r) => ({
      ...r,
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
      needsALook: needsALook(r.comment),
    })),
    summary: summary.map((s) => ({ product: s.product, status: s.status, count: Number(s.n), average: Math.round(s.avg * 10) / 10 })),
    spread: spread.map((s) => ({ product: s.product, rating: Number(s.rating), count: Number(s.n) })),
    trend: recent.map((t) => ({ product: t.product, recent: round(t.recent), before: round(t.before), recentCount: Number(t.n) })),
  };
}

/** Publish, hide or send back many reviews at once; returns how many changed */
export async function setReviewsStatus(ids: string[], status: ReviewStatus) {
  await ensure();
  return prisma.$executeRawUnsafe(`UPDATE "reviews" SET "status" = $2 WHERE "id" = ANY($1::text[])`, ids, status);
}

export async function deleteReviews(ids: string[]) {
  await ensure();
  return prisma.$executeRawUnsafe(`DELETE FROM "reviews" WHERE "id" = ANY($1::text[])`, ids);
}

export async function setReviewStatus(id: string, status: ReviewStatus) {
  await ensure();
  return (await prisma.$executeRawUnsafe(`UPDATE "reviews" SET "status" = $2 WHERE "id" = $1`, id, status)) === 1;
}

export async function deleteReview(id: string) {
  await ensure();
  return (await prisma.$executeRawUnsafe(`DELETE FROM "reviews" WHERE "id" = $1`, id)) === 1;
}

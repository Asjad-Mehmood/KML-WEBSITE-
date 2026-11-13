import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { countryOf } from "@/lib/publicStats";

// Admin → Dashboard → trends: the chosen period (7, 30, 90 or 365 days) against the period before
// it, day by day, per program and per country, and what needs an admin's attention now.
const PROGRAMS = ["windows_installer", "roadpro", "traverse", "folder_manager", "slope", "toolkit"];
// seeded and staff accounts that aren't real users (as lib/publicStats.ts)
const NOT_USERS = ["admin@exceltokml.com", "surveyor@geotech.com", "demo@surveyor.io", "surveyor.demo@geotech.com"];

const n = (v: unknown) => Number(v ?? 0);
const safe = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback);

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const days = [7, 30, 90, 365].includes(Number(req.nextUrl.searchParams.get("days"))) ? Number(req.nextUrl.searchParams.get("days")) : 30;
  const now = Date.now();
  const from = new Date(now - days * 864e5);
  const prevFrom = new Date(now - 2 * days * 864e5);
  const bucket = days > 90 ? "week" : "day";

  try {
    const count = (table: string, col: string, extra = "") =>
      prisma.$queryRawUnsafe<{ cur: bigint; prev: bigint }[]>(
        `SELECT COUNT(*) FILTER (WHERE "${col}" >= $1) AS cur, COUNT(*) FILTER (WHERE "${col}" >= $2 AND "${col}" < $1) AS prev
           FROM "${table}" WHERE "${col}" >= $2 ${extra}`,
        from,
        prevFrom
      );
    const notUsers = `AND "email" NOT IN (${NOT_USERS.map((e) => `'${e}'`).join(",")})`;
    const [signups, downloads, conversions, signins, active, series, perProgram, places, attention] = await Promise.all([
      count("users", "createdAt", notUsers),
      count("downloads", "timestamp", `AND "assetType" IN (${PROGRAMS.map((p) => `'${p}'`).join(",")})`),
      safe(count("conversions", "timestamp"), [{ cur: BigInt(0), prev: BigInt(0) }]),
      count("users", "lastLoginAt", notUsers),
      prisma.$queryRawUnsafe<{ cur: bigint; prev: bigint }[]>(
        `SELECT COUNT(DISTINCT "userId") FILTER (WHERE "timestamp" >= $1) AS cur,
                COUNT(DISTINCT "userId") FILTER (WHERE "timestamp" >= $2 AND "timestamp" < $1) AS prev
           FROM "activities" WHERE "timestamp" >= $2 AND "userId" IS NOT NULL`,
        from,
        prevFrom
      ),
      prisma.$queryRawUnsafe<{ t: Date; signups: bigint; downloads: bigint; active: bigint }[]>(
        `WITH s AS (SELECT date_trunc('${bucket}', "createdAt") t, COUNT(*) c FROM "users" WHERE "createdAt" >= $1 ${notUsers} GROUP BY 1),
              d AS (SELECT date_trunc('${bucket}', "timestamp") t, COUNT(*) c FROM "downloads" WHERE "timestamp" >= $1 AND "assetType" IN (${PROGRAMS.map((p) => `'${p}'`).join(",")}) GROUP BY 1),
              a AS (SELECT date_trunc('${bucket}', "timestamp") t, COUNT(DISTINCT "userId") c FROM "activities" WHERE "timestamp" >= $1 AND "userId" IS NOT NULL GROUP BY 1)
         SELECT COALESCE(s.t, d.t, a.t) t, COALESCE(s.c, 0) signups, COALESCE(d.c, 0) downloads, COALESCE(a.c, 0) active
           FROM s FULL JOIN d ON d.t = s.t FULL JOIN a ON a.t = COALESCE(s.t, d.t) ORDER BY 1`,
        from
      ),
      prisma.$queryRawUnsafe<{ assetType: string; cur: bigint; prev: bigint }[]>(
        `SELECT "assetType", COUNT(*) FILTER (WHERE "timestamp" >= $1) cur, COUNT(*) FILTER (WHERE "timestamp" < $1) prev
           FROM "downloads" WHERE "timestamp" >= $2 GROUP BY 1`,
        from,
        prevFrom
      ),
      prisma.download.findMany({ where: { timestamp: { gte: from } }, select: { location: true } }),
      Promise.all([
        safe(prisma.contactMessage.count({ where: { status: "new" } }), 0),
        safe(prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT COUNT(*) c FROM "reviews" WHERE "status" = 'pending'`), [{ c: BigInt(0) }]),
        safe(prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT COUNT(*) c FROM "toolkit_events" WHERE "action" = 'failed' AND "createdAt" > NOW() - interval '7 days'`), [{ c: BigInt(0) }]),
        safe(
          prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT COUNT(*) c FROM "user_email_status" WHERE "required" AND "verifiedAt" IS NULL AND "createdAt" > NOW() - interval '30 days'`),
          [{ c: BigInt(0) }]
        ),
        safe(prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT COUNT(*) c FROM "account_controls" WHERE "blocked"`), [{ c: BigInt(0) }]),
        safe(prisma.$queryRawUnsafe<{ c: bigint }[]>(`SELECT COUNT(*) c FROM "release_broadcasts" WHERE "status" IN ('sending','paused')`), [{ c: BigInt(0) }]),
      ]),
    ]);

    const pair = (r: { cur: bigint; prev: bigint }[]) => ({ cur: n(r[0]?.cur), prev: n(r[0]?.prev) });
    const countries = new Map<string, number>();
    for (const p of places) {
      const c = countryOf(p.location) ?? "Unknown";
      countries.set(c, (countries.get(c) ?? 0) + 1);
    }
    const [messages, reviews, toolkitFailures, unconfirmed, blocked, sending] = attention;
    return NextResponse.json(
      {
        success: true,
        days,
        bucket,
        totals: {
          signups: pair(signups),
          downloads: pair(downloads),
          active: pair(active),
          signins: pair(signins),
          conversions: pair(conversions),
        },
        series: series.map((r) => ({ t: r.t.toISOString().slice(0, 10), signups: n(r.signups), downloads: n(r.downloads), active: n(r.active) })),
        programs: PROGRAMS.map((p) => {
          const r = perProgram.find((x) => x.assetType === p);
          return { id: p, cur: n(r?.cur), prev: n(r?.prev) };
        }),
        countries: [...countries.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10),
        attention: {
          messages,
          reviews: n(reviews[0]?.c),
          toolkitFailures: n(toolkitFailures[0]?.c),
          unconfirmed: n(unconfirmed[0]?.c),
          blocked: n(blocked[0]?.c),
          sending: n(sending[0]?.c),
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[admin trends]", e);
    return NextResponse.json({ error: "Couldn't work out the trends." }, { status: 500 });
  }
}

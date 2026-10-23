import { prisma } from "@/lib/prisma";
import { TRAVERSE_LEVEL_ACTIONS } from "@/lib/activityKinds";
import { blockedList } from "@/lib/traverseControls";

/**
 * Admin → Traverse & Level → Usage: how the app is used, from the activity log it writes to
 * (opened, imports, exports, saves, sharing, simulator) and the files it keeps in accounts.
 */
export async function traverseUsage() {
  const now = Date.now();
  const d7 = new Date(now - 7 * 864e5), d30 = new Date(now - 30 * 864e5), d14 = new Date(now - 13 * 864e5);
  d14.setUTCHours(0, 0, 0, 0);
  const tl = { action: { in: TRAVERSE_LEVEL_ACTIONS } };

  const [byAction, byAction30, users7, users30, formats, opens, recent, daily, files, blocked] = await Promise.all([
    prisma.activity.groupBy({ by: ["action"], where: tl, _count: { _all: true } }),
    prisma.activity.groupBy({ by: ["action"], where: { ...tl, timestamp: { gte: d30 } }, _count: { _all: true } }),
    prisma.activity.findMany({ where: { ...tl, timestamp: { gte: d7 }, userId: { not: null } }, distinct: ["userId"], select: { userId: true } }),
    prisma.activity.findMany({ where: { ...tl, timestamp: { gte: d30 }, userId: { not: null } }, distinct: ["userId"], select: { userId: true } }),
    prisma.activity.groupBy({ by: ["exportFormat"], where: { action: "tl_export" }, _count: { _all: true } }),
    prisma.activity.groupBy({ by: ["title"], where: { action: "tl_open" }, _count: { _all: true } }),
    prisma.activity.findMany({
      where: tl,
      orderBy: { timestamp: "desc" },
      take: 40,
      select: { id: true, action: true, title: true, details: true, userId: true, userEmail: true, userName: true, status: true, timestamp: true },
    }),
    prisma.$queryRawUnsafe<{ day: Date; n: bigint }[]>(
      `SELECT date_trunc('day', "timestamp") AS day, COUNT(*) AS n FROM "activities"
       WHERE "action" = ANY($1::text[]) AND "timestamp" >= $2 GROUP BY 1 ORDER BY 1`,
      TRAVERSE_LEVEL_ACTIONS, d14
    ),
    prisma.userFile.groupBy({ by: ["direction"], where: { platform: "traverse_app" }, _count: { _all: true }, _sum: { fileSize: true } }),
    blockedList(),
  ]);

  const count = (rows: { action: string; _count: { _all: number } }[], ...a: string[]) =>
    rows.filter((r) => a.includes(r.action)).reduce((t, r) => t + r._count._all, 0);

  // where it was opened: "Opened Traverse & Level (Windows program)"
  const where: Record<string, number> = {};
  for (const o of opens) {
    const w = /\(([^)]+)\)\s*$/.exec(o.title)?.[1] || "Other";
    where[w] = (where[w] || 0) + o._count._all;
  }

  const days: { day: string; n: number }[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(d14.getTime() + i * 864e5).toISOString().slice(0, 10);
    days.push({ day: d, n: Number(daily.find((r) => new Date(r.day).toISOString().slice(0, 10) === d)?.n ?? 0) });
  }

  const blockedUsers = blocked.length
    ? await prisma.user.findMany({ where: { id: { in: blocked } }, select: { id: true, email: true, name: true } })
    : [];

  const fileDir = (d: string) => files.find((f) => f.direction === d);
  return {
    totals: {
      opens: count(byAction, "tl_open"),
      saves: count(byAction, "traverse", "levelling", "tl_update"),
      imports: count(byAction, "tl_import"),
      exports: count(byAction, "tl_export"),
      shares: count(byAction, "tl_share"),
      simulations: count(byAction, "tl_simulation"),
      deletes: count(byAction, "tl_delete"),
    },
    last30: {
      opens: count(byAction30, "tl_open"),
      saves: count(byAction30, "traverse", "levelling", "tl_update"),
      imports: count(byAction30, "tl_import"),
      exports: count(byAction30, "tl_export"),
    },
    activeUsers: { d7: users7.length, d30: users30.length },
    exportFormats: Object.fromEntries(formats.map((f) => [(f.exportFormat || "Other").toUpperCase(), f._count._all])),
    openedFrom: where,
    daily: days,
    files: {
      opened: fileDir("import")?._count._all ?? 0,
      saved: fileDir("export")?._count._all ?? 0,
      bytes: (fileDir("import")?._sum.fileSize ?? 0) + (fileDir("export")?._sum.fileSize ?? 0),
    },
    blocked: blocked.map((id) => {
      const u = blockedUsers.find((x) => x.id === id);
      return { userId: id, email: u?.email ?? null, name: u?.name ?? null };
    }),
    recent: recent.map((a) => ({ ...a, timestamp: a.timestamp.toISOString() })),
  };
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { prisma } from "@/lib/prisma";

// GET: the newest converted points across all users (?limit= up to 5000), with the total.
// ?userId= for one user's points.
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);

  // ?group=user: one row per surveyor (points, grids, last saved) for the Points tab
  if (searchParams.get("group") === "user") {
    const [byUser, byGrid, total] = await Promise.all([
      prisma.conversion.groupBy({ by: ["userId"], _count: { _all: true }, _max: { timestamp: true } }),
      prisma.conversion.groupBy({ by: ["userId", "coordSystem"] }),
      prisma.conversion.count(),
    ]);
    const ids = byUser.map((g) => g.userId).filter((x): x is string => Boolean(x));
    const users = ids.length
      ? await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, email: true, name: true } })
      : [];
    const who = new Map(users.map((u) => [u.id, u]));
    const grids = new Map<string, string[]>();
    for (const g of byGrid) {
      const k = g.userId ?? "";
      grids.set(k, [...(grids.get(k) ?? []), g.coordSystem].filter(Boolean));
    }
    const groups = byUser
      .map((g) => ({
        userId: g.userId,
        email: g.userId ? who.get(g.userId)?.email ?? null : null,
        name: g.userId ? who.get(g.userId)?.name ?? null : null,
        points: g._count._all,
        lastSaved: g._max.timestamp?.toISOString() ?? null,
        grids: grids.get(g.userId ?? "") ?? [],
      }))
      .sort((a, b) => (b.lastSaved ?? "").localeCompare(a.lastSaved ?? ""));
    return NextResponse.json({ success: true, total, groups });
  }

  const limit = Math.min(5000, Math.max(1, parseInt(searchParams.get("limit") || "1000", 10) || 1000));
  const userId = searchParams.get("userId");
  // ?userId=none: points saved without an account
  if (userId === "none") {
    const where = { userId: null };
    const [total, rows] = await Promise.all([
      prisma.conversion.count({ where }),
      prisma.conversion.findMany({ where, orderBy: [{ timestamp: "desc" }, { id: "asc" }], take: limit }),
    ]);
    return NextResponse.json({ success: true, total, conversions: await db.withConversionLinks(rows) });
  }
  const r = userId ? await db.getUserConversions(userId, { limit }) : await db.getAllConversions(limit);
  return NextResponse.json({ success: true, total: r.total, conversions: r.conversions });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  }

  await db.clearConversions();
  return NextResponse.json({ success: true, message: "Conversion log cleared" });
}

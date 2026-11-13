import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";

// Admin → search (Ctrl+K): accounts, downloads, messages, files, releases, reviews and Toolkit PCs
// that match what was typed. A few of each; the palette (components/admin/AdminSearch.tsx) opens them.
export interface SearchHit {
  kind: "account" | "download" | "message" | "file" | "release" | "review" | "pc";
  id: string;
  title: string;
  sub: string;
  /** the account to open, when there is one */
  userId?: string | null;
}

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const q = (req.nextUrl.searchParams.get("q") || "").trim().slice(0, 100);
  if (q.length < 2) return NextResponse.json({ success: true, hits: [] });
  const has = { contains: q, mode: "insensitive" as const };
  const like = `%${q.replace(/[%_\\]/g, (c) => `\\${c}`)}%`;
  const date = (d: Date) => d.toISOString().slice(0, 10);

  const [accounts, downloads, messages, files, releases, reviews, pcs] = await Promise.all([
    prisma.user
      .findMany({ where: { OR: [{ name: has }, { email: has }, { organization: has }, { location: has }, { ipAddress: has }] }, take: 8, orderBy: { lastLoginAt: "desc" } })
      .catch(() => []),
    prisma.download
      .findMany({ where: { OR: [{ userEmail: has }, { userName: has }, { fileName: has }, { location: has }, { version: has }] }, take: 6, orderBy: { timestamp: "desc" } })
      .catch(() => []),
    prisma.contactMessage
      .findMany({ where: { OR: [{ name: has }, { email: has }, { topic: has }, { message: has }, { ref: has }] }, take: 6, orderBy: { createdAt: "desc" } })
      .catch(() => []),
    prisma.userFile.findMany({ where: { OR: [{ fileName: has }, { userEmail: has }] }, take: 6, orderBy: { timestamp: "desc" } }).catch(() => []),
    prisma.productRelease.findMany({ where: { OR: [{ title: has }, { version: has }, { app: has }] }, take: 5, orderBy: { releasedAt: "desc" } }).catch(() => []),
    prisma
      .$queryRawUnsafe<{ id: string; userId: string; product: string; rating: number; comment: string; email: string | null }[]>(
        `SELECT r."id", r."userId", r."product", r."rating", r."comment", u."email" FROM "reviews" r LEFT JOIN "users" u ON u."id" = r."userId"
          WHERE r."comment" ILIKE $1 OR u."email" ILIKE $1 OR r."product" ILIKE $1 ORDER BY r."createdAt" DESC LIMIT 5`,
        like
      )
      .catch(() => []),
    prisma
      .$queryRawUnsafe<{ id: string; userId: string; name: string; email: string | null; toolkitVersion: string }[]>(
        `SELECT d."id", d."userId", d."name", u."email", d."toolkitVersion" FROM "toolkit_devices" d LEFT JOIN "users" u ON u."id" = d."userId"
          WHERE d."name" ILIKE $1 OR u."email" ILIKE $1 ORDER BY d."lastSeen" DESC LIMIT 5`,
        like
      )
      .catch(() => []),
  ]);

  const hits: SearchHit[] = [
    ...accounts.map((u) => ({ kind: "account" as const, id: u.id, userId: u.id, title: u.name || u.email, sub: [u.email, u.organization, u.location].filter(Boolean).join(" · ") })),
    ...downloads.map((d) => ({
      kind: "download" as const,
      id: d.id,
      userId: d.userId,
      title: `${d.fileName} ${d.version}`,
      sub: [d.userEmail ?? "signed out", d.location, date(d.timestamp)].filter(Boolean).join(" · "),
    })),
    ...messages.map((m) => ({ kind: "message" as const, id: m.id, userId: m.userId, title: `${m.topic}: ${m.name}`, sub: `${m.email} · ${m.ref} · ${m.status}` })),
    ...files.map((f) => ({ kind: "file" as const, id: f.id, userId: f.userId, title: f.fileName, sub: [f.direction, f.userEmail, date(f.timestamp)].filter(Boolean).join(" · ") })),
    ...releases.map((r) => ({ kind: "release" as const, id: r.id, title: r.title, sub: `${r.app} ${r.version} · ${date(r.releasedAt)}` })),
    ...reviews.map((r) => ({ kind: "review" as const, id: r.id, userId: r.userId, title: `${"★".repeat(r.rating)} ${r.product}`, sub: `${r.email ?? ""} · ${r.comment.slice(0, 80)}` })),
    ...pcs.map((p) => ({ kind: "pc" as const, id: p.id, userId: p.userId, title: p.name || p.id, sub: `Toolkit ${p.toolkitVersion} · ${p.email ?? ""}` })),
  ];
  return NextResponse.json({ success: true, hits }, { headers: { "Cache-Control": "no-store" } });
}

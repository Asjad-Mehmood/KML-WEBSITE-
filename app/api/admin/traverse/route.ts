import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/loginThrottle";
import { adminGroups, adminJobsOf, adminRemove } from "@/lib/traverseJobs";
import { blockedList, setBlocked } from "@/lib/traverseControls";
import { traverseUsage } from "@/lib/traverseUsage";

// Admin → Traverse & Level: the jobs saved in the Traverse & Level app (/traverse/app).
// GET            → one row per surveyor, with the totals and who is blocked
// GET ?usage=1   → how the app is used (opens, imports, exports, saves, files kept, recent activity)
// GET ?userId=   → that surveyor's jobs, with what was saved, the result and who they are shared with
// PATCH          → { userId, blocked } block or unblock one account
// DELETE ?id=    → delete one job
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const params = new URL(req.url).searchParams;
  const userId = params.get("userId");
  try {
    if (params.get("usage")) return NextResponse.json({ success: true, usage: await traverseUsage() });
    if (userId) return NextResponse.json({ success: true, jobs: await adminJobsOf(userId) });
    return NextResponse.json({ success: true, ...(await adminGroups()), blocked: await blockedList() });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "The Traverse & Level jobs could not be read";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const userId = typeof body.userId === "string" ? body.userId.slice(0, 100) : "";
  if (!userId || typeof body.blocked !== "boolean") return NextResponse.json({ error: "Which account, and block or unblock?" }, { status: 400 });
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!user) return NextResponse.json({ error: "Unknown account." }, { status: 404 });
  if (body.blocked && user.id === admin.user.id) return NextResponse.json({ error: "You can't block your own account." }, { status: 400 });
  const list = await setBlocked(user.id, body.blocked);
  await prisma.activity
    .create({
      data: {
        action: "settings_changed",
        title: `Traverse & Level ${body.blocked ? "blocked" : "unblocked"} for ${user.email}`.slice(0, 250),
        details: `Traverse & Level access: ${user.email} ${body.blocked ? "blocked" : "allowed again"}`,
        userId: admin.user.id,
        userEmail: admin.user.email,
        userName: admin.user.name,
        ipAddress: clientIp(req),
      },
    })
    .catch(() => {});
  return NextResponse.json({ success: true, blocked: list });
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return NextResponse.json({ error: "Unknown job." }, { status: 400 });
  const gone = await adminRemove(id);
  if (!gone) return NextResponse.json({ error: "Unknown job." }, { status: 404 });
  return NextResponse.json({ success: true });
}

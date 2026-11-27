import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { logAdmin } from "@/lib/adminLog";
import { db } from "@/lib/db";
import { billingEnabled, checkoutReady, listSubscriptions, setPlan } from "@/lib/billing";
import { PLANS, PRICES } from "@/lib/plans";
import { paddleEnv, paddleMissing } from "@/lib/paddle";

// Admin → Usage → Plans: whether the paid plans are on, who is on Pro, and giving or taking Pro
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  try {
    return NextResponse.json(
      {
        enabled: billingEnabled(),
        production: process.env.VERCEL_ENV === "production",
        checkout: checkoutReady(),
        paddle: { env: paddleEnv(), missing: paddleMissing() },
        plans: PLANS,
        prices: PRICES,
        pro: await listSubscriptions(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[admin plans]", e);
    return NextResponse.json({ error: "Couldn't read the plans." }, { status: 500 });
  }
}

// POST { email, plan: "pro" | "free", months?: number (0 or none: no end), note? }
export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const plan = body?.plan === "pro" ? "pro" : body?.plan === "free" ? "free" : null;
  if (!email || !plan) return NextResponse.json({ error: "An email and a plan are needed." }, { status: 400 });
  const months = Math.max(0, Math.min(60, Math.round(Number(body?.months) || 0)));
  const user = await db.findUserByEmail(email);
  if (!user) return NextResponse.json({ error: "No account has that email." }, { status: 404 });
  try {
    const end = plan === "pro" && months ? new Date(Date.now() + months * 30 * 864e5) : null;
    const sub = await setPlan(user.id, plan, {
      periodEnd: end,
      note: typeof body?.note === "string" ? body.note : "",
      by: admin.user.email,
    });
    await logAdmin(admin.user, "plan.set", `${user.name} <${user.email}>`, plan === "pro" ? `Pro${end ? ` until ${end.toISOString().slice(0, 10)}` : ", no end"}` : "Back to Free", req);
    return NextResponse.json({ success: true, subscription: sub });
  } catch (e) {
    console.error("[admin plans] set", e);
    return NextResponse.json({ error: "The plan couldn't be changed." }, { status: 500 });
  }
}

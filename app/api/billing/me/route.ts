import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/auth/serverSession";
import { planSummary } from "@/lib/billing/billing";

// GET: this account's plan and what it has used ({ enabled: false } while the paid plans are off)
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to see your plan." }, { status: 401 });
  try {
    return NextResponse.json(await planSummary(s.user), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[billing] me", e);
    return NextResponse.json({ enabled: false });
  }
}

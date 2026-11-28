import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/adminAuth";
import { referralOverview } from "@/lib/account/referrals";

// Admin → Usage → Invites: how many people came from invite links, who invites most, the latest
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  try {
    return NextResponse.json(await referralOverview(), { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[admin referrals]", e);
    return NextResponse.json({ error: "Couldn't read the invites." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { runCleanup } from "@/lib/cleanup";
import { kickStalled } from "@/lib/broadcastRunner";
import { billingState } from "@/lib/billing";
import { processRewards } from "@/lib/referrals";

// Called nightly by Vercel Cron (vercel.json). With CRON_SECRET set, Vercel
// sends it as a Bearer token and nothing else is accepted.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET?.trim();
  const auth = req.headers.get("authorization") || "";
  const fromVercelCron = (req.headers.get("user-agent") || "").startsWith("vercel-cron/");
  const allowed = secret ? auth === `Bearer ${secret}` : fromVercelCron;
  if (!allowed) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    // and a broadcast whose run stopped carries on
    const restarted = await kickStalled(req.nextUrl.origin);
    // invited friends who have used an app since: their inviters get their month of Pro
    const inviteRewards = await billingState()
      .then((st) => processRewards(undefined, st.limits))
      .catch((e) => {
        console.error("Invite rewards failed:", e);
        return 0;
      });
    return NextResponse.json({ ok: true, restartedBroadcasts: restarted, inviteRewards, ...(await runCleanup("schedule")) });
  } catch (err) {
    console.error("Clean-up failed:", err);
    return NextResponse.json({ error: "Clean-up failed" }, { status: 500 });
  }
}

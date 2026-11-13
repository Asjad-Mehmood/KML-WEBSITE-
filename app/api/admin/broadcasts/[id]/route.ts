import { NextRequest, NextResponse, after } from "next/server";
import { logAdmin } from "@/lib/adminLog";
import { getAdminSession } from "@/lib/adminAuth";
import { kickBroadcast, kickStalled } from "@/lib/broadcastRunner";
import { broadcastStatus, cancelBroadcast, failedRecipients, pauseBroadcast, resumeBroadcast, sendNextBatch } from "@/lib/releases";

type Ctx = { params: Promise<{ id: string }> };

// The server sends broadcasts in steps (lib/broadcastRunner.ts); the page watches with "watch",
// which also restarts a run that stopped. "send" (one batch from here) is kept for older pages.
export const maxDuration = 60;

// The addresses that couldn't be reached
export async function GET(req: NextRequest, { params }: Ctx) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json({ failed: await failedRecipients(id) });
}

// action: watch (the counts) | send (the next batch) | pause | resume | cancel
export async function POST(req: NextRequest, { params }: Ctx) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action } = await req.json().catch(() => ({}));
  try {
    const origin = req.nextUrl.origin;
    if (action === "resume") after(() => kickBroadcast(origin, id));
    if (action === "watch") after(() => kickStalled(origin));
    const b =
      action === "watch" ? await broadcastStatus(id)
      : action === "pause" ? await pauseBroadcast(id)
      : action === "resume" ? await resumeBroadcast(id)
      : action === "cancel" ? await cancelBroadcast(id)
      : action === "send" ? await sendNextBatch(id)
      : null;
    if (!b) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    if (action === "pause" || action === "resume" || action === "cancel") await logAdmin(admin.user, "release.send", `Email run ${id}`, ({ pause: "Paused", resume: "Resumed", cancel: "Cancelled" } as Record<string, string>)[action], req);
    return NextResponse.json({ broadcast: b });
  } catch (err) {
    console.error("Releases: broadcast action failed", action, err);
    return NextResponse.json({ error: (err as Error).message || "Broadcast failed." }, { status: 500 });
  }
}

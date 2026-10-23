import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { cancelBroadcast, failedRecipients, pauseBroadcast, resumeBroadcast, sendNextBatch } from "@/lib/releases";

type Ctx = { params: Promise<{ id: string }> };

// A batch takes up to ~40 s; the page asks again until the broadcast is done or paused
export const maxDuration = 60;

// The addresses that couldn't be reached
export async function GET(req: NextRequest, { params }: Ctx) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  return NextResponse.json({ failed: await failedRecipients(id) });
}

// action: send (the next batch) | pause | resume | cancel
export async function POST(req: NextRequest, { params }: Ctx) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const { action } = await req.json().catch(() => ({}));
  try {
    const b =
      action === "pause" ? await pauseBroadcast(id)
      : action === "resume" ? await resumeBroadcast(id)
      : action === "cancel" ? await cancelBroadcast(id)
      : action === "send" ? await sendNextBatch(id)
      : null;
    if (!b) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    return NextResponse.json({ broadcast: b });
  } catch (err) {
    console.error("Releases: broadcast action failed", action, err);
    return NextResponse.json({ error: (err as Error).message || "Broadcast failed." }, { status: 500 });
  }
}

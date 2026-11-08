import { NextRequest, NextResponse, after } from "next/server";
import { kickBroadcast, validStepToken } from "@/lib/broadcastRunner";
import { sendStep } from "@/lib/releases";

type Ctx = { params: Promise<{ id: string }> };

// One step of a broadcast run on the server (lib/broadcastRunner.ts). Started only by the site
// itself (a token for this broadcast). It answers at once, sends a batch after the answer, then
// starts the next step while emails are left; a step that sent nothing (another one holds the
// rest) stops there.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || !validStepToken(id, token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = req.nextUrl.origin;
  after(async () => {
    try {
      const { broadcast, claimed } = await sendStep(id);
      if (broadcast.status === "sending" && claimed > 0) await kickBroadcast(origin, id);
    } catch (err) {
      console.error("[broadcast] step failed", id, err);
    }
  });
  return NextResponse.json({ started: true }, { status: 202 });
}

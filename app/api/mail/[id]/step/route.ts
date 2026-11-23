import { NextRequest, NextResponse, after } from "next/server";
import { kickMail, validStepToken } from "@/lib/broadcastRunner";
import { sendMailStep } from "@/lib/customMail";

type Ctx = { params: Promise<{ id: string }> };

// One step of an admin email (Admin → Email, lib/customMail.ts) run on the server, as a release
// broadcast's step (app/api/broadcasts/[id]/step): started only by the site itself (a token for
// this email), it answers at once, sends a batch after the answer and starts the next step while
// emails are left.
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token || !validStepToken(`mail:${id}`, token)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const origin = req.nextUrl.origin;
  after(async () => {
    try {
      const { mail, claimed } = await sendMailStep(id);
      if (mail?.status === "sending" && claimed > 0) await kickMail(origin, id);
    } catch (err) {
      console.error("[mail] step failed", id, err);
    }
  });
  return NextResponse.json({ started: true }, { status: 202 });
}

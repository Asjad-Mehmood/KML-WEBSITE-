import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signedInResponse } from "@/lib/loginResponse";
import { poll } from "@/lib/deviceLink";

// POST { poll }: the app window asks whether its code was confirmed at /link.
// Confirmed: the window is signed in (session cookie, like a normal sign-in), once.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  try {
    const r = await poll(String(body.poll || ""));
    if (r.state !== "approved") return NextResponse.json({ success: true, state: r.state }, { headers: { "Cache-Control": "no-store" } });
    const user = await db.findUserById(r.userId);
    if (!user) return NextResponse.json({ success: true, state: "expired" });
    return await signedInResponse(user);
  } catch (e) {
    console.error("[device link] poll", e);
    return NextResponse.json({ error: "Couldn't check the code. Trying again…" }, { status: 500 });
  }
}

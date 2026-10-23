import { NextRequest, NextResponse } from "next/server";
import { clientIp } from "@/lib/loginThrottle";
import { startLink } from "@/lib/deviceLink";

// POST { app }: a sign-in code for an app window (Traverse & Level's Windows program).
// The person confirms it at /link in their browser; the app then polls /api/auth/device/poll.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const app = typeof body.app === "string" ? body.app : "Traverse & Level";
  try {
    const link = await startLink(app, clientIp(req), req.headers.get("user-agent"));
    if (!link) return NextResponse.json({ error: "Too many sign-in codes from this connection. Please wait a while and try again." }, { status: 429 });
    return NextResponse.json({ success: true, ...link, url: "/link" }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[device link] start", e);
    return NextResponse.json({ error: "Couldn't make a sign-in code. Please try again." }, { status: 500 });
  }
}

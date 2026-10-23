import { NextRequest, NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/releaseEmail";
import { optIn, optOut } from "@/lib/releases";

// The link in every release email (?t=signed token). Mail apps' own "Unsubscribe" button
// POSTs here with List-Unsubscribe=One-Click (RFC 8058); the /unsubscribe page POSTs JSON
// { action: "out" | "in" } to stop or restart release emails.
export async function POST(req: NextRequest) {
  const email = verifyUnsubscribeToken(req.nextUrl.searchParams.get("t"));
  if (!email) return NextResponse.json({ error: "This link isn't valid." }, { status: 400 });
  const type = req.headers.get("content-type") || "";
  let action = "out";
  if (type.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    if (body?.action === "in") action = "in";
  }
  try {
    if (action === "in") await optIn(email);
    else await optOut(email);
    return NextResponse.json({ ok: true, subscribed: action === "in" });
  } catch (err) {
    console.error("Unsubscribe failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}

// Opening the link itself never unsubscribes (mail scanners open links); show the page instead
export function GET(req: NextRequest) {
  const t = req.nextUrl.searchParams.get("t") || "";
  return NextResponse.redirect(new URL(`/unsubscribe?t=${encodeURIComponent(t)}`, req.url), 303);
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { addEvent, isTester, seeDevice } from "@/lib/toolkit/store";
import { parseReport } from "@/lib/toolkit/validate";

// Survey Toolkit (beta test): a Toolkit reports its PC and what it did there.
//   { "device": { "id", "name", "windows", "toolkitVersion", "tools": { "<tool id>": "<installed version>" } },
//     "events": [ { "tool", "action": installed|updated|uninstalled|failed|opened, "from", "to", "message" } ] }
// Testers only. Shown in Admin → Toolkit (beta).
export async function POST(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to use the Survey Toolkit." }, { status: 401 });
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON." }, { status: 400 });
  }
  const r = parseReport(body);
  if (!r.ok) return NextResponse.json({ error: r.error }, { status: 400 });
  try {
    if (!db.isAdmin(s.user) && !(await isTester(s.user.email))) {
      return NextResponse.json({ error: "The Survey Toolkit beta is closed." }, { status: 403 });
    }
    await seeDevice(s.user.id, r.device);
    for (const e of r.events) await addEvent(s.user.id, r.device.id, e);
    return NextResponse.json({ success: true, stored: r.events.length }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[toolkit event]", e);
    return NextResponse.json({ error: "Couldn't store the report. It will be sent again." }, { status: 500 });
  }
}

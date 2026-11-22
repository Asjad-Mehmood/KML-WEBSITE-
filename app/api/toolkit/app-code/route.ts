import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { APP_CODE_PROGRAMS, createHandoff } from "@/lib/toolkit/store";
import { mayUseToolkit } from "@/lib/toolkit/access";

// Survey Toolkit: signing in a Windows program it opens, so nobody types their password again.
//   POST { "app": "slope" }  with "Authorization: Bearer <the Toolkit's token>"
//        → { "code": "…" }: good once, for 60 seconds, for that program only
// The Toolkit starts the program with --signin-code=<code>; the program trades it at
// /api/toolkit/app-code/redeem for a sign-in of its own (the Toolkit's token never leaves it).
export async function POST(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to use the Survey Toolkit." }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { app?: unknown } | null;
  const app = typeof b?.app === "string" ? b.app : "";
  if (!(APP_CODE_PROGRAMS as readonly string[]).includes(app)) {
    return NextResponse.json({ error: "Unknown program." }, { status: 400 });
  }
  try {
    if (!(await mayUseToolkit(s.user))) {
      return NextResponse.json({ error: "The Survey Toolkit isn't open to this account." }, { status: 403 });
    }
    const code = await createHandoff(s.user.id, `app:${app}`);
    return NextResponse.json({ success: true, code, expiresIn: 60 }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[toolkit app code]", e);
    return NextResponse.json({ error: "Couldn't start the sign-in. Try again in a moment." }, { status: 500 });
  }
}

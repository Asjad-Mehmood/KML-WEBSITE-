import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signedInResponse } from "@/lib/loginResponse";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/loginThrottle";
import { APP_CODE_PROGRAMS, takeHandoff } from "@/lib/toolkit/store";

// A Windows program opened by the Survey Toolkit signs in with the code it was started with:
//   POST { "code": "…", "app": "slope" } → the same reply as /api/auth/login (user and token)
// A code works once, for 60 seconds, and only for the program it was made for. Anything else
// gets 401, and the program shows its own sign-in as usual.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { code?: unknown; app?: unknown } | null;
  const code = typeof b?.code === "string" ? b.code.trim() : "";
  const app = typeof b?.app === "string" ? b.app : "";
  const ip = clientIp(req);
  try {
    if (await tooManyFailures("", ip)) {
      return NextResponse.json({ error: "Too many attempts. Please wait 15 minutes and sign in." }, { status: 429 });
    }
    const taken = (APP_CODE_PROGRAMS as readonly string[]).includes(app) ? await takeHandoff(code) : null;
    if (!taken || taken.next !== `app:${app}`) {
      await recordFailure("", ip, req.headers.get("user-agent"));
      return NextResponse.json({ error: "That sign-in has expired. Please sign in." }, { status: 401 });
    }
    const user = await db.findUserById(taken.userId);
    if (!user) return NextResponse.json({ error: "That account no longer exists." }, { status: 401 });
    return await signedInResponse(user, req, "from the Survey Toolkit");
  } catch (e) {
    console.error("[toolkit app code redeem]", e);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please sign in." }, { status: 500 });
  }
}

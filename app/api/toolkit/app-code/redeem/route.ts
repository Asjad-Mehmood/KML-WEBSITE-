import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signedInResponse } from "@/lib/auth/loginResponse";
import { sessionForToken } from "@/lib/auth/serverSession";
import { clientIp, recordFailure, tooManyFailures } from "@/lib/auth/loginThrottle";
import { APP_CODE_PROGRAMS, takeHandoff } from "@/lib/toolkit/store";

// A Windows program opened by the Survey Toolkit signs in with the code it was started with:
//   POST { "code": "…", "app": "slope" } → the same reply as /api/auth/login (user and token)
//   GET ?code=…&app=traverse → for a program that is a window on the web app (Traverse & Level):
//        signs that window in (the cookie) and goes on to the app
// A code works once, for 60 seconds, and only for the program it was made for. Anything else
// gets 401 (GET: the app's own sign-in), and the program shows its own sign-in as usual.
export async function POST(req: NextRequest) {
  const b = (await req.json().catch(() => null)) as { code?: unknown; app?: unknown } | null;
  const code = typeof b?.code === "string" ? b.code.trim() : "";
  const app = typeof b?.app === "string" ? b.app : "";
  return redeem(req, code, app);
}

// the programs that open the web app in a window of their own, and where they open it
const WEB_WINDOW_START: Record<string, string> = { traverse: "/traverse/app?app=1" };

export async function GET(req: NextRequest) {
  const app = req.nextUrl.searchParams.get("app") || "";
  const start = WEB_WINDOW_START[app];
  if (!start) return NextResponse.json({ error: "Unknown program." }, { status: 400 });
  // a relative address, so the window stays on the address it asked on: the old exceltokml.com
  // passes this request on to the site and the Traverse & Level window keeps its data there
  const res = new NextResponse(null, { status: 303, headers: { Location: start } });
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  // the window is signed in already: that sign-in stays, and the code is left unused (it runs out)
  if (await sessionForToken(req.cookies.get("surveyor_auth_token")?.value).catch(() => null)) return res;
  const signedIn = await redeem(req, (req.nextUrl.searchParams.get("code") || "").trim(), app);
  if (signedIn.ok) for (const c of signedIn.cookies.getAll()) res.cookies.set(c);
  return res;
}

async function redeem(req: NextRequest, code: string, app: string) {
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

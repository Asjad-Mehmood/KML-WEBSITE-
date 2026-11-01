import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { isTester } from "@/lib/toolkit/store";

// Survey Toolkit (beta test): who is signed in, and may they use the beta? Admins always may;
// anyone else only when an admin has added their email (/api/toolkit/testers).
// Signed in with "Authorization: Bearer <token>" from the Toolkit, or the website's cookie.
export async function GET(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to use the Survey Toolkit." }, { status: 401 });
  try {
    const admin = db.isAdmin(s.user);
    const tester = admin || (await isTester(s.user.email));
    return NextResponse.json(
      {
        success: true,
        user: { name: s.user.name || "", email: s.user.email },
        tester,
        admin,
        ...(tester ? {} : { message: "The Survey Toolkit beta is closed. It opens to everyone when the test is over." }),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[toolkit me]", e);
    return NextResponse.json({ error: "Couldn't check the beta list. Try again in a moment." }, { status: 500 });
  }
}

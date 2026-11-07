import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { mayUseToolkit } from "@/lib/toolkit/access";

// Survey Toolkit: who is signed in, and may they use it? Admins always may; everyone else while the
// Toolkit is open to everyone (Admin → Settings), or only when an admin has added their email
// (/api/toolkit/testers). "tester" is the name the Toolkit has read since the beta: true = may use it.
// Signed in with "Authorization: Bearer <token>" from the Toolkit, or the website's cookie.
export async function GET(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to use the Survey Toolkit." }, { status: 401 });
  try {
    const admin = db.isAdmin(s.user);
    const tester = await mayUseToolkit(s.user);
    return NextResponse.json(
      {
        success: true,
        user: { name: s.user.name || "", email: s.user.email },
        tester,
        admin,
        ...(tester ? {} : { message: "The Survey Toolkit isn't open to this account just now. Please try again later." }),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[toolkit me]", e);
    return NextResponse.json({ error: "Couldn't check your account. Try again in a moment." }, { status: 500 });
  }
}

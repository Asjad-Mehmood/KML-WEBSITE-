import { NextRequest, NextResponse } from "next/server";
import { sessionForToken } from "@/lib/serverSession";
import { TooManyVerifyCodes, emailStatus, sendVerification } from "@/lib/emailVerify";

// "Confirm your email" on the dashboard, for accounts made before confirmation started:
// emails the signed-in person a code (typed on the dashboard) and a link
export async function POST(req: NextRequest) {
  const token = req.cookies.get("surveyor_auth_token")?.value || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const session = await sessionForToken(token);
  if (!session) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  try {
    if ((await emailStatus(session.user.id))?.verifiedAt) return NextResponse.json({ error: "Your email is already confirmed." }, { status: 409 });
    const sent = await sendVerification(session.user);
    return NextResponse.json({ challenge: sent.challenge, sentTo: sent.sentTo });
  } catch (err) {
    if (err instanceof TooManyVerifyCodes) return NextResponse.json({ error: "We've sent a few codes already. Look in your inbox and Spam, or try again in 15 minutes." }, { status: 429 });
    console.error("Couldn't send the confirmation email:", err);
    return NextResponse.json({ error: "We couldn't send the email. Please try again in a few minutes." }, { status: 503 });
  }
}

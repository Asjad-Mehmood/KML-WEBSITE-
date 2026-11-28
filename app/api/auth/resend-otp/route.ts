import { NextRequest, NextResponse } from "next/server";
import { resendAdminCode } from "@/lib/auth/adminCodeStep";

// "Resend code" on the admin code step: a new code for the same sign-in
export async function POST(req: NextRequest) {
  try {
    const { challenge } = await req.json().catch(() => ({}));
    if (typeof challenge !== "string" || challenge.length > 100) {
      return NextResponse.json({ error: "Start again from the sign-in page." }, { status: 400 });
    }
    return (
      (await resendAdminCode(req, challenge)) ??
      NextResponse.json({ error: "That sign-in has expired. Start again.", restart: true }, { status: 410 })
    );
  } catch (err) {
    console.error("Couldn't resend the admin code:", err);
    return NextResponse.json({ error: "We couldn't email a new code. Please try again in a few minutes." }, { status: 503 });
  }
}

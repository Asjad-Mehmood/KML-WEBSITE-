import { NextRequest, NextResponse } from "next/server";
import { checkAdminCode } from "@/lib/auth/adminCodeStep";

// Second step of an admin sign-in from a browser we don't know: the code from the email
export async function POST(req: NextRequest) {
  try {
    const { challenge, code, trust } = await req.json().catch(() => ({}));
    if (typeof challenge !== "string" || typeof code !== "string" || challenge.length > 100) {
      return NextResponse.json({ error: "Enter the 6-digit code from your email." }, { status: 400 });
    }
    return await checkAdminCode(req, challenge, code, trust === true);
  } catch (err) {
    console.error("Admin code check failed:", err);
    return NextResponse.json({ error: "Sign-in is temporarily unavailable. Please try again in a few minutes." }, { status: 500 });
  }
}

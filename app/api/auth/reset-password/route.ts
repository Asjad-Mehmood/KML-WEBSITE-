import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyResetToken } from "@/lib/passwordReset";
import { revokeTrustedBrowsers } from "@/lib/adminOtp";

export async function POST(req: NextRequest) {
  const { token, password } = await req.json().catch(() => ({}));
  if (typeof token !== "string" || typeof password !== "string") {
    return NextResponse.json({ error: "Missing reset token or password." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }
  if (password !== password.trim()) {
    return NextResponse.json({ error: "Password can't start or end with a space." }, { status: 400 });
  }

  try {
    const user = await verifyResetToken(token);
    if (!user) {
      return NextResponse.json(
        { error: "This reset link is invalid, expired or already used. Request a new one." },
        { status: 400 }
      );
    }
    await db.updateUser(user.id, { password });
    await db.deleteUserSessions(user.id); // sign out everywhere; old sessions may belong to someone else
    await revokeTrustedBrowsers(user.id); // and no browser stays trusted for the admin email code
    return NextResponse.json({ success: true, message: "Password updated. You can now sign in." });
  } catch (err) {
    console.error("Password reset failed:", err);
    return NextResponse.json({ error: "Couldn't reset the password. Please try again." }, { status: 500 });
  }
}

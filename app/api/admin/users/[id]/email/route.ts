import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { db } from "@/lib/db";
import { TooManyVerifyCodes, emailStatus, markUnverified, markVerified, sendVerification } from "@/lib/emailVerify";

type Ctx = { params: Promise<{ id: string }> };

// Admin → user profile → Email: confirm the address by hand, take a confirmation back, or
// email the person a new confirmation code and link
export async function POST(req: NextRequest, { params }: Ctx) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });
  const { id } = await params;
  const user = await db.findUserById(id);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const { action } = await req.json().catch(() => ({}));
  try {
    if (action === "confirm") await markVerified(user.id, "admin");
    else if (action === "unconfirm") {
      if (db.isAdmin(user)) return NextResponse.json({ error: "Admin accounts sign in with their own email code." }, { status: 400 });
      await markUnverified(user.id);
    } else if (action === "send") {
      if ((await emailStatus(user.id))?.verifiedAt) return NextResponse.json({ error: "This email is already confirmed." }, { status: 409 });
      await sendVerification(user);
    } else return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    return NextResponse.json({ success: true, emailStatus: await emailStatus(user.id) });
  } catch (err) {
    if (err instanceof TooManyVerifyCodes) return NextResponse.json({ error: "Several codes went out in the last 15 minutes. Try again later." }, { status: 429 });
    console.error("Admin email confirmation action failed:", err);
    return NextResponse.json({ error: "That didn't work. Please try again." }, { status: 500 });
  }
}

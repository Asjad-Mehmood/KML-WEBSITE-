import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";

// DELETE: the signed-in user closes their own account. Needs their password,
// so a borrowed or stolen session alone can't wipe an account.
export async function DELETE(req: NextRequest) {
  const session = await sessionForToken(tokenFromRequest(req));
  if (!session) return NextResponse.json({ error: "Please sign in again." }, { status: 401 });

  const { password } = await req.json().catch(() => ({}));
  if (typeof password !== "string" || !password) {
    return NextResponse.json({ error: "Enter your password to confirm." }, { status: 400 });
  }

  const { user } = session;
  if (!db.verifyPassword(user, password)) {
    return NextResponse.json({ error: "That password isn't right." }, { status: 403 });
  }
  if (db.isAdmin(user)) {
    return NextResponse.json({ error: "Administrator accounts can't be deleted from the dashboard." }, { status: 403 });
  }

  try {
    await db.deleteOwnAccount(user.id);
  } catch (err) {
    console.error("Account deletion failed:", err);
    return NextResponse.json({ error: "Couldn't delete your account right now. Please try again." }, { status: 500 });
  }

  const res = NextResponse.json({ success: true });
  res.cookies.delete("surveyor_auth_token");
  return res;
}

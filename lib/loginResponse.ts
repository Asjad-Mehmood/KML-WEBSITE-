import { NextResponse } from "next/server";
import { db, type UserRecord } from "@/lib/db";
import { BLOCKED_MESSAGE, isBlocked } from "@/lib/accountControls";

/** Start a session for a user whose identity is already proven: cookies plus the signed-in reply. */
export async function signedInResponse(user: UserRecord) {
  if (await isBlocked(user.id)) return NextResponse.json({ error: BLOCKED_MESSAGE, blocked: true }, { status: 403 });
  await db.touchUserLogin(user.id);
  const session = await db.createSession(user.id);

  const response = NextResponse.json({
    success: true,
    user: db.sanitizeUser(user),
    token: session.token,
  });

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: "/",
  };
  response.cookies.set("surveyor_auth_token", session.token, cookieOptions);
  if (db.isAdmin(user)) response.cookies.set("surveyor_session", session.token, cookieOptions);
  return response;
}

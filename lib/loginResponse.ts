import { NextResponse } from "next/server";
import { db, type UserRecord } from "@/lib/db";

/** Start a session for a user whose identity is already proven: cookies plus the signed-in reply. */
export async function signedInResponse(user: UserRecord) {
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

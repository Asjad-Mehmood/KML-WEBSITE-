import { after, NextResponse, type NextRequest } from "next/server";
import { logEvent } from "@/lib/admin/activityEvents";
import { db, type UserRecord } from "@/lib/db";
import { BLOCKED_MESSAGE, isBlocked } from "@/lib/auth/accountControls";
import { onAdminHost } from "@/lib/auth/adminHost";

/** Start a session for a user whose identity is already proven: cookies plus the signed-in reply. */
export async function signedInResponse(user: UserRecord, req?: NextRequest, how = "password") {
  if (await isBlocked(user.id)) {
    if (req) after(() => logEvent(req, user, "sign_in_refused", "Tried to sign in to a blocked account", { status: "warning" }));
    return NextResponse.json({ error: BLOCKED_MESSAGE, blocked: true }, { status: 403 });
  }
  // the admin address is for admins only; there, and only there, the session has admin rights.
  // Anyone else gets the same answer as a wrong password: nothing says what the address is for.
  const adminSide = !!req && onAdminHost(req.headers);
  if (adminSide && !db.isAdmin(user)) {
    return NextResponse.json({ error: "Wrong email or password." }, { status: 401 });
  }
  if (req) after(() => logEvent(req, user, "sign_in", `Signed in (${how}${adminSide ? ", admin address" : ""})`));
  await db.touchUserLogin(user.id);
  const session = await db.createSession(user.id, { admin: adminSide });

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

import { NextRequest, NextResponse } from "next/server";
import { db, isAdminRole } from "@/lib/db";
import { cleanOccupation } from "@/lib/occupations";
import { getClientIp, getIpGeoLocation } from "@/lib/geo";
import { getExtraSettings } from "@/lib/siteSettings";
import { checkEmail } from "@/lib/emailCheck";
import { TooManyVerifyCodes, confirmMessage, isUnconfirmedNewAccount, markRequired, sendVerification, verificationActive } from "@/lib/emailVerify";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, password, organization, role } = body;
    let { email } = body;

    if (!(await getExtraSettings()).allowSignups) {
      return NextResponse.json(
        { error: "New sign-ups are paused for now. If you already have an account, please sign in." },
        { status: 403 }
      );
    }

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      );
    }

    // A mistyped, throwaway or undeliverable address is turned back before an account is made
    const checked = await checkEmail(email);
    if (!checked.ok) return NextResponse.json({ error: checked.error }, { status: 400 });
    email = checked.email;

    // Admin accounts are never created through public sign-up
    if (email.trim().toLowerCase() === "admin@exceltokml.com") {
      return NextResponse.json({ error: "This email address is reserved." }, { status: 400 });
    }
    // The occupation is typed freely. Admin rights are never given through sign-up, so an
    // occupation that reads like an admin role is turned back with a reason.
    const occupation = cleanOccupation(role);
    if (occupation && isAdminRole(occupation)) {
      return NextResponse.json(
        { error: 'Please describe your occupation without the word "admin".' },
        { status: 400 }
      );
    }
    const safeRole = occupation || undefined;

    const verify = await verificationActive();

    // Check if user already exists
    const existing = await db.findUserByEmail(email);
    // An account that was made but never confirmed doesn't belong to anyone yet: signing up
    // again with the address starts it over (the code goes to the real owner of the address)
    const restart = existing && verify && !db.isAdmin(existing) && (await isUnconfirmedNewAccount(existing.id));
    if (existing && !restart) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please sign in." },
        { status: 409 }
      );
    }

    // Capture Client IP and Geographic Location
    const clientIp = getClientIp(req);
    const geo = await getIpGeoLocation(clientIp, req);

    // Create user with IP and Location
    const user = existing
      ? await db.updateUser(existing.id, { name: String(name).trim(), password, organization: organization?.trim() || undefined, role: safeRole })
      : await db.createUser({
          name,
          email,
          password,
          organization,
          role: safeRole,
          ipAddress: geo.ip,
          location: geo.location,
        });

    // Email-and-password accounts confirm their address before they can sign in. The reply says
    // so in "error" too, which is all that older app versions show.
    if (verify && user) {
      await markRequired(user.id);
      try {
        const sent = await sendVerification(user);
        return NextResponse.json(
          { success: false, verifyRequired: true, challenge: sent.challenge, sentTo: sent.sentTo, error: confirmMessage(sent.sentTo) },
          { status: 403 }
        );
      } catch (err) {
        if (err instanceof TooManyVerifyCodes) {
          return NextResponse.json({ error: "We've just sent you a code. Check your email (and Spam), or try again in 15 minutes." }, { status: 429 });
        }
        console.error("Couldn't send the confirmation email:", err);
        return NextResponse.json(
          { error: "Your account is made, but we couldn't send the confirmation email. Try signing in in a few minutes to get it." },
          { status: 503 }
        );
      }
    }
    if (!user) throw new Error("The account wasn't saved.");

    // Create session
    const session = await db.createSession(user.id);
    const sanitized = db.sanitizeUser(user);

    const response = NextResponse.json({
      success: true,
      user: sanitized,
      token: session.token,
    });

    // Set HTTP-only cookie
    response.cookies.set("surveyor_auth_token", session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: "/",
    });

    return response;
  } catch (err: unknown) {
    // Details go to the server log only: database errors can name hosts and settings
    console.error("Sign-up failed:", err);
    return NextResponse.json(
      { error: "Sign-up is temporarily unavailable. Please try again in a few minutes." },
      { status: 500 }
    );
  }
}

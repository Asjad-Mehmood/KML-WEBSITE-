import { NextRequest, NextResponse } from "next/server";
import { recentFromSender, saveMessage, TOPICS, type Topic } from "@/lib/contactMessages";
import { isMailConfigured, sendMail } from "@/lib/mailer";
import { supportAlert } from "@/lib/contactEmail";
import { clientIp } from "@/lib/loginThrottle";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { SUPPORT_EMAIL } from "@/lib/site";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const DETAIL_KEYS = ["Program", "Version", "Platform", "Grid"] as const;

// Contact form: saved first (so nothing is lost), then the support inbox is
// alerted. Nothing is emailed to the sender.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  // Hidden field only bots fill in: pretend it worked
  if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true, ref: "KML-000000" });

  const name = String(body.name ?? "").trim().slice(0, 100);
  const email = String(body.email ?? "").trim().slice(0, 200);
  const topic = String(body.topic ?? "") as Topic;
  const message = String(body.message ?? "").trim().slice(0, 5000);
  if (!name) return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Please enter a valid email address so we can reply." }, { status: 400 });
  if (!(topic in TOPICS)) return NextResponse.json({ error: "Please choose what your message is about." }, { status: 400 });
  if (message.length < 10) return NextResponse.json({ error: "Please write a little more (at least 10 characters)." }, { status: 400 });

  const details: Record<string, string> = {};
  for (const k of DETAIL_KEYS) {
    const v = String(body.details?.[k.toLowerCase()] ?? "").trim().slice(0, 120);
    if (v) details[k] = v;
  }

  const ip = clientIp(req);
  try {
    if ((await recentFromSender(email, ip)) >= 3) {
      return NextResponse.json({ error: "You've sent a few messages just now. Please wait a few minutes before sending another." }, { status: 429 });
    }
    const session = await sessionForToken(tokenFromRequest(req));
    const saved = await saveMessage({
      name,
      email,
      topic,
      message,
      details: Object.keys(details).length ? details : null,
      userId: session?.user.id ?? null,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });

    // Alert the support inbox only (Reply-To is the sender); the sender gets no
    // automatic email. A mail problem never loses the saved message.
    if (isMailConfigured()) {
      const m = { ref: saved.ref, name, email, topic, message, details };
      await sendMail({ to: SUPPORT_EMAIL, replyTo: `${name} <${email}>`, ...supportAlert(m) }).catch((e) =>
        console.warn("Contact email failed:", e)
      );
    }
    return NextResponse.json({ ok: true, ref: saved.ref });
  } catch (err) {
    console.error("Contact form failed:", err);
    return NextResponse.json(
      { error: `Sorry, your message couldn't be sent right now. Please email ${SUPPORT_EMAIL} instead.` },
      { status: 500 }
    );
  }
}

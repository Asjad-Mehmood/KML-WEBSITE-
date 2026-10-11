import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { MAX_TRAVERSE_SHARES, ownerOf, share, sharesOf, unshare } from "@/lib/traverseJobs";

type Ctx = { params: Promise<{ id: string }> };
const ID = /^[A-Za-z0-9-]{8,64}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The signed-in owner of the job, or a reply saying why not. */
async function asOwner(req: NextRequest, ctx: Ctx) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return { err: NextResponse.json({ error: "Log in first." }, { status: 401 }) };
  const { id } = await ctx.params;
  if (!ID.test(id)) return { err: NextResponse.json({ error: "Not a valid job." }, { status: 400 }) };
  const owner = await ownerOf(id);
  if (!owner) return { err: NextResponse.json({ error: "Save the job to your account before sharing it." }, { status: 404 }) };
  if (owner !== s.user.id) return { err: NextResponse.json({ error: "Only the job's owner can change its sharing." }, { status: 403 }) };
  return { id, user: s.user };
}

export async function GET(req: NextRequest, ctx: Ctx) {
  try {
    const o = await asOwner(req, ctx); if (o.err) return o.err;
    return NextResponse.json({ success: true, emails: await sharesOf(o.id) });
  } catch (e) {
    console.error("[traverse shares] list", e);
    return NextResponse.json({ error: "Sharing could not be read." }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: Ctx) {
  try {
    const o = await asOwner(req, ctx); if (o.err) return o.err;
    const body = await req.json().catch(() => ({}));
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!EMAIL.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (email === o.user.email.toLowerCase()) return NextResponse.json({ error: "This job is already yours." }, { status: 400 });
    const now = await sharesOf(o.id);
    if (!now.includes(email) && now.length >= MAX_TRAVERSE_SHARES) {
      return NextResponse.json({ error: `A job can be shared with up to ${MAX_TRAVERSE_SHARES} people.` }, { status: 409 });
    }
    await share(o.id, email);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[traverse shares] add", e);
    return NextResponse.json({ error: "The job could not be shared. Try again in a moment." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  try {
    const o = await asOwner(req, ctx); if (o.err) return o.err;
    const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
    if (!email) return NextResponse.json({ error: "Which email?" }, { status: 400 });
    await unshare(o.id, email);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[traverse shares] remove", e);
    return NextResponse.json({ error: "Sharing could not be changed. Try again in a moment." }, { status: 500 });
  }
}

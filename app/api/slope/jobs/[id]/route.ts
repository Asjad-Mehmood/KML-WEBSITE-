import { after, NextRequest, NextResponse } from "next/server";
import { logEvent } from "@/lib/activityEvents";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { MAX_SLOPE_JOB_BYTES, countOwn, ownerOf, remove, upsert } from "@/lib/slopeJobs";
import { getExtraSettings } from "@/lib/siteSettings";

type Ctx = { params: Promise<{ id: string }> };
const ID = /^[A-Za-z0-9-]{8,64}$/;

// PUT { name, data, summary, updated_at }: keep a calculation (new or changed). Only its owner can change it.
// when each calculation was last noted in the activity log (per server instance)
const lastLogged = new Map<string, number>();

export async function PUT(req: NextRequest, ctx: Ctx) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in to save calculations to your account." }, { status: 401 });
  const { id } = await ctx.params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not a valid calculation." }, { status: 400 });
  // Admin → Apps → Slope Calculator: keeping calculations can be switched off, and capped per account
  const rules = await getExtraSettings().catch(() => null);
  if (rules && !rules.slopeKeepJobs) {
    return NextResponse.json({ error: "Keeping calculations in accounts is switched off for now. Your calculation is still on this device." }, { status: 403 });
  }
  const maxJobs = rules?.slopeMaxJobs ?? 500;
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
  if (!name || !body?.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "A calculation needs a name and its data." }, { status: 400 });
  }
  const data = JSON.stringify(body.data);
  if (Buffer.byteLength(data) > MAX_SLOPE_JOB_BYTES) {
    return NextResponse.json({ error: "This calculation is too large to keep (512 KB at most)." }, { status: 413 });
  }
  const summary = JSON.stringify(body.summary && typeof body.summary === "object" ? body.summary : {}).slice(0, 4000);
  const updated = typeof body.updated_at === "string" ? body.updated_at.slice(0, 40) : new Date().toISOString();
  try {
    const owner = await ownerOf(id);
    if (owner && owner !== s.user.id) return NextResponse.json({ error: "This calculation belongs to someone else." }, { status: 403 });
    if (!owner && (await countOwn(s.user.id)) >= maxJobs) {
      return NextResponse.json({ error: `You can keep up to ${maxJobs} calculations. Delete some old ones first.` }, { status: 409 });
    }
    await upsert(s.user.id, id, { name, data, summary, updated });
    // the app saves as you work: a new calculation is noted, a change at most every 10 minutes
    const key = `${s.user.id}|${id}`;
    if (!owner || Date.now() - (lastLogged.get(key) ?? 0) > 10 * 60_000) {
      lastLogged.set(key, Date.now());
      const who = s.user;
      after(() => logEvent(req, who, owner ? "slope_update" : "slope_new", `${owner ? "Changed" : "Saved"} the calculation "${name}"`, { details: summary, tags: { app: "slope" } }));
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[slope jobs] save", e);
    return NextResponse.json({ error: "The calculation could not be saved. Try again in a moment." }, { status: 500 });
  }
}

// DELETE: remove one of your calculations.
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const { id } = await ctx.params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not a valid calculation." }, { status: 400 });
  try {
    await remove(s.user.id, id);
    const who = s.user;
    after(() => logEvent(req, who, "slope_delete", "Deleted a saved calculation", { tags: { app: "slope" } }));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[slope jobs] delete", e);
    return NextResponse.json({ error: "The calculation could not be deleted." }, { status: 500 });
  }
}

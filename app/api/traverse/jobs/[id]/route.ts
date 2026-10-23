import { NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { logTraverseActivity } from "@/lib/traverseActivity";
import { traverseControls } from "@/lib/traverseControls";
import { MAX_TRAVERSE_JOB_BYTES, countOwn, jobForDownload, jobInfo, ownerOf, remove, upsert } from "@/lib/traverseJobs";
import { getAdminSession } from "@/lib/adminAuth";

type Ctx = { params: Promise<{ id: string }> };
const ID = /^[A-Za-z0-9-]{8,64}$/;

// GET: one job as a JSON file (?download=1) for its owner, someone it is shared with, or an admin.
export async function GET(req: NextRequest, ctx: Ctx) {
  const s = await sessionForToken(tokenFromRequest(req));
  const admin = await getAdminSession(req).catch(() => null);
  const me = s?.user ?? admin?.user;
  if (!me) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { id } = await ctx.params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not a valid job." }, { status: 400 });
  try {
    const found = await jobForDownload(id);
    if (!found || (found.ownerId !== me.id && !found.sharedWith.includes(me.email.toLowerCase()) && !admin)) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    const body = JSON.stringify({ app: "Traverse & Level", ...found.job }, null, 2);
    const file = `${found.job.name.replace(/[^\w.-]+/g, "_").slice(0, 80) || "job"}.json`;
    return new NextResponse(body, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...(req.nextUrl.searchParams.get("download") ? { "Content-Disposition": `attachment; filename="${file}"` } : {}),
      },
    });
  } catch (e) {
    console.error("[traverse jobs] get", e);
    return NextResponse.json({ error: "The job could not be read." }, { status: 500 });
  }
}

// PUT: keep a job (new or changed). Only its owner can change it.
export async function PUT(req: NextRequest, ctx: Ctx) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Log in to save jobs to your account." }, { status: 401 });
  const { id } = await ctx.params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not a valid job." }, { status: 400 });
  // the admin can close the app, or close it for one account (Admin → Settings / Traverse & Level)
  const allow = await traverseControls(s.user.id);
  if (!allow.enabled) return NextResponse.json({ error: allow.message, closed: true }, { status: 423 });
  const body = await req.json().catch(() => null);
  const kind = body?.kind === "level" ? "level" : body?.kind === "traverse" ? "traverse" : null;
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 200) : "";
  if (!kind || !name || !body?.data || typeof body.data !== "object") {
    return NextResponse.json({ error: "A job needs a kind, a name and its data." }, { status: 400 });
  }
  const data = JSON.stringify(body.data);
  if (Buffer.byteLength(data) > MAX_TRAVERSE_JOB_BYTES) {
    return NextResponse.json({ error: "This job is too large to keep in the account (2 MB at most)." }, { status: 413 });
  }
  const summary = JSON.stringify(body.summary && typeof body.summary === "object" ? body.summary : {}).slice(0, 4000);
  const updated = typeof body.updated_at === "string" ? body.updated_at.slice(0, 40) : new Date().toISOString();
  try {
    const owner = await ownerOf(id);
    if (owner && owner !== s.user.id) return NextResponse.json({ error: "This job belongs to someone else." }, { status: 403 });
    if (!owner && (await countOwn(s.user.id)) >= allow.maxJobs) {
      return NextResponse.json({ error: `You can keep up to ${allow.maxJobs} jobs. Delete some old ones first.` }, { status: 409 });
    }
    await upsert(s.user.id, id, { kind, name, data, summary, updated });
    // every save shows in the account's activity, like work done in the Excel to KML app: a new
    // job as a traverse or level run (counted on the account page), a later save as an update
    const status = (body.summary && typeof body.summary.status === "string" ? body.summary.status : "") as string;
    const what = kind === "level" ? "Level run" : "Traverse";
    logTraverseActivity(
      req,
      s.user,
      owner ? "tl_update" : kind === "level" ? "levelling" : "traverse",
      `${what} ${owner ? "updated" : "saved"} in Traverse & Level: ${name}`,
      { details: status ? `Status: ${status}` : undefined, status: status === "rejected" ? "warning" : "success" }
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[traverse jobs] save", e);
    return NextResponse.json({ error: "The job could not be saved. It is kept on this device and will upload later." }, { status: 500 });
  }
}

// DELETE: remove a job (owner only); its shares go with it.
export async function DELETE(req: NextRequest, ctx: Ctx) {
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return NextResponse.json({ error: "Log in first." }, { status: 401 });
  const { id } = await ctx.params;
  if (!ID.test(id)) return NextResponse.json({ error: "Not a valid job." }, { status: 400 });
  const allow = await traverseControls(s.user.id);
  if (!allow.enabled) return NextResponse.json({ error: allow.message, closed: true }, { status: 423 });
  try {
    const job = await jobInfo(id);
    if (job && job.ownerId !== s.user.id) return NextResponse.json({ error: "This job belongs to someone else." }, { status: 403 });
    await remove(s.user.id, id);
    if (job) logTraverseActivity(req, s.user, "tl_delete", `${job.kind === "level" ? "Level run" : "Traverse"} deleted in Traverse & Level: ${job.name}`);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[traverse jobs] delete", e);
    return NextResponse.json({ error: "The job could not be deleted. Try again in a moment." }, { status: 500 });
  }
}

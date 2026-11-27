import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { logAdmin } from "@/lib/adminLog";
import { kickMail } from "@/lib/broadcastRunner";
import { prisma } from "@/lib/prisma";
import { RELEASE_APPS, appById, ensureReleaseTables, importFromGitHub } from "@/lib/releases";
import {
  type AudienceInput,
  type MailAudience,
  checkDraft,
  countAudience,
  customEmail,
  failedOf,
  listMails,
  mailStatus,
  sendTestMail,
  setMailStatus,
  stalledMails,
  startMail,
} from "@/lib/customMail";

// Admin → Email (lib/customMail.ts):
//   GET                         the emails sent, newest first (and restarts a run that stopped)
//   GET ?id=…                   one email's counts and the addresses that failed
//   POST {action:"count", audience, userIds, app}        how many it reaches now, and a few of them
//   POST {action:"preview", draft}                       the email's HTML, as {name} would be filled for the admin
//   POST {action:"test", draft}                          a test copy to the admin
//   POST {action:"send", draft, audience, userIds, app}  start sending
//   POST {action:"releases"}                            the releases in Admin → Releases, newest first (New versions)
//   POST {action:"import", app}                         add an app's GitHub releases first, then the same list
//   PATCH {id, action: "pause" | "resume" | "stop"}
export const dynamic = "force-dynamic";

const deny = () => NextResponse.json({ error: "Unauthorized: Admin privileges required" }, { status: 401 });

function audienceOf(b: Record<string, unknown>): AudienceInput {
  return {
    audience: String(b.audience || "") as MailAudience,
    userIds: Array.isArray(b.userIds) ? (b.userIds as unknown[]).map(String) : [],
    app: typeof b.app === "string" ? b.app : "",
  };
}

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return deny();
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const mail = await mailStatus(id);
      if (!mail) return NextResponse.json({ error: "Not found" }, { status: 404 });
      return NextResponse.json({ mail, failed: mail.failed ? await failedOf(id) : [] });
    }
    // a run that stopped (a deploy in between) carries on when the page is opened
    for (const s of await stalledMails().catch(() => [])) await kickMail(req.nextUrl.origin, s);
    return NextResponse.json({ mails: await listMails() });
  } catch (e) {
    console.error("[admin mail] list", e);
    return NextResponse.json({ error: "Couldn't read the emails." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return deny();
  const b = ((await req.json().catch(() => null)) || {}) as Record<string, unknown>;
  const action = String(b.action || "");
  try {
    if (action === "releases" || action === "import") {
      if (action === "import") {
        const app = String(b.app || "");
        if (!appById(app)) return NextResponse.json({ error: "Choose the app." }, { status: 400 });
        const r = await importFromGitHub(app);
        await logAdmin(admin.user, "release.save", app, `Imported from GitHub for an email: ${r.added} added`, req);
      }
      await ensureReleaseTables();
      const rows = await prisma.productRelease.findMany({ orderBy: { releasedAt: "desc" }, take: 300 });
      return NextResponse.json({
        apps: RELEASE_APPS.map((a) => ({ id: a.id, name: a.name })),
        releases: rows.map((r) => ({
          id: r.id,
          app: r.app,
          appName: appById(r.app)?.name || r.app,
          version: r.version,
          releasedAt: r.releasedAt.toISOString(),
          title: r.title,
          notes: r.notes,
          link: r.link,
          linkLabel: r.linkLabel,
        })),
      });
    }
    if (action === "count") {
      const r = await countAudience(audienceOf(b));
      return "error" in r ? NextResponse.json(r, { status: 400 }) : NextResponse.json(r);
    }
    const d = checkDraft((b.draft || {}) as Record<string, unknown>);
    if (!d.ok) return NextResponse.json({ error: d.error }, { status: 400 });
    const me = { name: admin.user.name, email: admin.user.email };
    if (action === "preview") {
      const e = customEmail(d.data, me);
      return NextResponse.json({ subject: e.subject, html: e.html });
    }
    if (action === "test") {
      await sendTestMail(d.data, me);
      return NextResponse.json({ success: true, sentTo: me.email });
    }
    if (action === "send") {
      const a = audienceOf(b);
      const id = await startMail(d.data, a, admin.user.email);
      await kickMail(req.nextUrl.origin, id);
      const mail = await mailStatus(id);
      await logAdmin(admin.user, "mail.send", `${mail?.audienceLabel ?? a.audience} (${mail?.total ?? 0})`, d.data.subject, req);
      return NextResponse.json({ success: true, mail });
    }
    return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  } catch (e) {
    const msg = (e as Error)?.message || "That didn't work.";
    console.error("[admin mail]", action, e);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return deny();
  const b = ((await req.json().catch(() => null)) || {}) as { id?: string; action?: string };
  if (!b.id || !["pause", "resume", "stop"].includes(b.action || "")) return NextResponse.json({ error: "Unknown action." }, { status: 400 });
  try {
    const mail = await setMailStatus(b.id, b.action as "pause" | "resume" | "stop");
    if (b.action === "resume") await kickMail(req.nextUrl.origin, b.id);
    await logAdmin(admin.user, `mail.${b.action}`, mail?.subject ?? b.id, "", req);
    return NextResponse.json({ mail });
  } catch (e) {
    console.error("[admin mail] patch", e);
    return NextResponse.json({ error: "That didn't work." }, { status: 500 });
  }
}

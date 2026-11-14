import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { logAdmin } from "@/lib/adminLog";
import { optIn } from "@/lib/releases";
import { checkLink, draftPreview, emailHistory, githubRelease, optOuts, recipientsPreview, retryFailed, versionBoard } from "@/lib/releaseTools";

// Admin → Releases: the tools around the list (lib/releaseTools.ts)
// GET ?board=1                               each app's versions and what's off
// GET ?github=<app>&version=<v>              that version's release on GitHub (title, notes, date)
// GET ?link=<url or /path>                   does the link answer
// GET ?recipients=<release id>&audience=app|all&onlyNew=1   who an email would go to
// GET ?history=1                             every release email and review request
// GET ?optouts=1                             who stopped release emails
// POST { action: "preview", release: {...} } the email of a release being written
// POST { action: "retry", broadcastId }      send again to only the people it failed for
// POST { action: "optin", email }            let someone get release emails again
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const sp = req.nextUrl.searchParams;
  try {
    if (sp.get("board")) return NextResponse.json({ success: true, board: await versionBoard() });
    if (sp.get("github")) return NextResponse.json({ success: true, release: await githubRelease(sp.get("github")!, sp.get("version") || "") });
    if (sp.get("link")) return NextResponse.json({ success: true, ...(await checkLink(sp.get("link")!.slice(0, 500), req.nextUrl.origin)) });
    if (sp.get("recipients")) {
      const who = sp.get("audience") === "all" ? "all" : "app";
      return NextResponse.json({ success: true, ...(await recipientsPreview(sp.get("recipients")!, who, sp.get("onlyNew") === "1")) });
    }
    if (sp.get("history")) return NextResponse.json({ success: true, history: await emailHistory() });
    if (sp.get("optouts")) return NextResponse.json({ success: true, optOuts: await optOuts() });
    return NextResponse.json({ error: "Which tool?" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "That didn't work." }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  try {
    if (body.action === "preview" && body.release && typeof body.release === "object") {
      const r = body.release;
      const str = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
      return NextResponse.json(
        await draftPreview(
          { app: str(r.app, 40), version: str(r.version, 30), releasedAt: str(r.releasedAt, 30), title: str(r.title, 150), notes: str(r.notes, 8000), link: str(r.link, 500), linkLabel: str(r.linkLabel, 60) },
          { name: admin.user.name, email: admin.user.email }
        )
      );
    }
    if (body.action === "retry" && typeof body.broadcastId === "string") {
      const id = await retryFailed(body.broadcastId, admin.user.email);
      await logAdmin(admin.user, "release.retry", `Email ${body.broadcastId}`, "Sent again to the people it failed for", req);
      return NextResponse.json({ success: true, broadcastId: id });
    }
    if (body.action === "optin" && typeof body.email === "string" && body.email.includes("@")) {
      await optIn(body.email);
      await logAdmin(admin.user, "release.optin", body.email.trim().toLowerCase(), "Gets release emails again", req);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: "Which action?" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || "That didn't work." }, { status: 400 });
  }
}

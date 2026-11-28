import { after, NextRequest, NextResponse } from "next/server";
import { sessionForToken, tokenFromRequest } from "@/lib/auth/serverSession";
import { logEvent } from "@/lib/admin/activityEvents";
import { SITE_URL } from "@/lib/content/site";
import {
  KIND_LABEL,
  SHARE_KINDS,
  TeamError,
  copyShare,
  createTeam,
  deleteTeam,
  joinTeam,
  myItems,
  myTeams,
  newInviteCode,
  removeMember,
  renameTeam,
  shareItem,
  unshare,
  type ShareKind,
} from "@/lib/account/teams";

// Teams (lib/account/teams.ts), for the signed-in account.
//   GET                                         my teams (members, shared jobs, invite link) and my jobs that can be shared
//   POST {action:"create", name}                a new team, with me as its owner
//   POST {action:"join", code}                  join from an invite link
//   POST {action:"rename", teamId, name}        owner
//   POST {action:"newLink", teamId}             owner: the old invite link stops working
//   POST {action:"remove", teamId, userId}      owner takes someone out; anyone takes themselves out (leave)
//   POST {action:"delete", teamId}              owner
//   POST {action:"share", teamId, kind, itemId, note?}   share one of my jobs with the team
//   POST {action:"unshare", shareId}            whoever shared it, or the owner
//   POST {action:"copy", shareId}               a copy of a shared job in my own account
export const dynamic = "force-dynamic";

async function me(req: NextRequest) {
  const s = await sessionForToken(tokenFromRequest(req));
  return s?.user ?? null;
}

export async function GET(req: NextRequest) {
  const user = await me(req);
  if (!user) return NextResponse.json({ error: "Sign in to see your teams." }, { status: 401 });
  try {
    const [teams, items] = await Promise.all([myTeams(user.id), myItems(user.id)]);
    return NextResponse.json(
      { teams: teams.map((t) => ({ ...t, link: `${SITE_URL}/t/${t.code}` })), items },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e) {
    console.error("[teams] list", e);
    return NextResponse.json({ error: "Your teams couldn't be loaded." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const user = await me(req);
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const str = (k: string) => (typeof b[k] === "string" ? (b[k] as string) : "");
  try {
    switch (b.action) {
      case "create": {
        const id = await createTeam(user.id, str("name"));
        after(() => logEvent(req, user, "team_create", `Made the team "${str("name").slice(0, 60)}"`));
        return NextResponse.json({ success: true, teamId: id });
      }
      case "join": {
        const id = await joinTeam(user.id, str("code"));
        after(() => logEvent(req, user, "team_join", "Joined a team"));
        return NextResponse.json({ success: true, teamId: id });
      }
      case "rename":
        await renameTeam(user.id, str("teamId"), str("name"));
        return NextResponse.json({ success: true });
      case "newLink":
        await newInviteCode(user.id, str("teamId"));
        return NextResponse.json({ success: true });
      case "remove":
        await removeMember(user.id, str("teamId"), str("userId") || user.id);
        return NextResponse.json({ success: true });
      case "delete":
        await deleteTeam(user.id, str("teamId"));
        return NextResponse.json({ success: true });
      case "share": {
        const kind = str("kind") as ShareKind;
        if (!SHARE_KINDS.includes(kind)) return NextResponse.json({ error: "Not a job that can be shared." }, { status: 400 });
        await shareItem(user.id, str("teamId"), kind, str("itemId"), str("note"));
        after(() => logEvent(req, user, "team_share", `Shared a ${KIND_LABEL[kind]} job with a team`));
        return NextResponse.json({ success: true });
      }
      case "unshare":
        await unshare(user.id, str("shareId"));
        return NextResponse.json({ success: true });
      case "copy": {
        const r = await copyShare(user, str("shareId"));
        after(() => logEvent(req, user, "team_copy", `Copied "${r.name.slice(0, 80)}" from a team`));
        return NextResponse.json({ success: true, ...r });
      }
      default:
        return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
  } catch (e) {
    if (e instanceof TeamError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error("[teams]", b.action, e);
    return NextResponse.json({ error: "That didn't work. Try again in a moment." }, { status: 500 });
  }
}

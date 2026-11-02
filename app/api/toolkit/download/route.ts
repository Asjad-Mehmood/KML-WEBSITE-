import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { toolkitDownloads } from "@/lib/toolkit/downloads";
import { isTester } from "@/lib/toolkit/store";

// Survey Toolkit (beta test): the Download button on /toolkit-beta. Testers (and admins) are sent
// on to the newest installer on GitHub; anyone else back to the page, which says why.
export async function GET(req: NextRequest) {
  const back = (why: string) => NextResponse.redirect(new URL(`/toolkit-beta?download=${why}`, req.url), 303);
  const s = await sessionForToken(tokenFromRequest(req));
  if (!s?.user) return back("signin");
  try {
    if (!db.isAdmin(s.user) && !(await isTester(s.user.email))) return back("closed");
    const latest = (await toolkitDownloads())?.latest;
    if (!latest) return back("none");
    console.info("[toolkit download]", s.user.email, latest.version);
    return NextResponse.redirect(latest.url, 302);
  } catch (e) {
    console.error("[toolkit download]", e);
    return back("error");
  }
}

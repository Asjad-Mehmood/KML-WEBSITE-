import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { toolkitDownloads } from "@/lib/toolkit/downloads";
import { mayUseToolkit, toolkitIsPublic } from "@/lib/toolkit/access";
import { getClientIp, getIpGeoLocation } from "@/lib/geo";

// Survey Toolkit: the Download button (/toolkit, the home page, /toolkit-beta). Sends anyone who
// may have it on to the newest installer on GitHub; anyone else back to the page, which says why.
// While the Toolkit is open to everyone the page is /toolkit, and a signed-out visitor signs in
// first when downloads need an account (Admin → Settings), then the download starts by itself.
export async function GET(req: NextRequest) {
  const open = await toolkitIsPublic();
  const page = open ? "/toolkit" : "/toolkit-beta";
  const back = (why: string) => NextResponse.redirect(new URL(`${page}?download=${why}`, req.url), 303);
  const s = await sessionForToken(tokenFromRequest(req));
  try {
    if (!s?.user) {
      const needsAccount = !open || (await db.getSettings().catch(() => null))?.requireAuthForDownload !== false;
      if (needsAccount) return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(`${page}?download=start`)}`, req.url), 303);
    } else if (!(await mayUseToolkit(s.user))) {
      return back("closed");
    }
    const latest = (await toolkitDownloads())?.latest;
    if (!latest) return back("none");
    console.info("[toolkit download]", s?.user.email ?? "signed out", latest.version);
    // kept like every other program download (Admin → Downloads and → Survey Toolkit); a failure
    // here never stops the download
    try {
      const geo = await getIpGeoLocation(getClientIp(req), req);
      await db.recordDownload({
        userId: s?.user.id ?? null,
        userEmail: s?.user.email ?? null,
        userName: s?.user.name ?? null,
        assetType: "toolkit",
        fileName: latest.url.split("/").pop() || "SurveyToolkit-Setup.exe",
        version: `v${latest.version}`,
        ipAddress: geo.ip,
        location: geo.location,
        userAgent: req.headers.get("user-agent") || "Browser",
      });
    } catch (err) {
      console.error("[toolkit download] not recorded:", err);
    }
    return NextResponse.redirect(latest.url, 302);
  } catch (e) {
    console.error("[toolkit download]", e);
    return back("error");
  }
}

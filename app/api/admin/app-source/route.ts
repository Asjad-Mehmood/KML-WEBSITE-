import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { APP_REPO, appSourceToken, fetchAppSource } from "@/lib/appSource";

// Admin → Settings: is the web app served live from the app repository, or
// from the old copy saved in the website (public/app.html)?
export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const hasToken = Boolean(appSourceToken());
  try {
    const res = await fetchAppSource();
    if (res.ok) {
      const html = await res.text();
      const build = /BM2KML v[\d.]+[^<]{0,40}?build [\w-]+/.exec(html)?.[0]?.replace(/&middot;/g, "·") ?? null;
      return NextResponse.json({ live: true, repo: APP_REPO, hasToken, build });
    }
    const why =
      res.status === 401 || res.status === 403
        ? "The APP_SOURCE_TOKEN was refused: it may have expired or lack read access to the repository."
        : res.status === 404
          ? hasToken
            ? "The repository or app/index.html wasn't found with this token: check the token has access to " + APP_REPO + "."
            : "The repository is private and APP_SOURCE_TOKEN isn't set."
          : `GitHub answered ${res.status}.`;
    return NextResponse.json({ live: false, repo: APP_REPO, hasToken, status: res.status, why });
  } catch {
    return NextResponse.json({ live: false, repo: APP_REPO, hasToken, why: "GitHub didn't answer in time." });
  }
}

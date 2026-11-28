import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { createHash } from "crypto";
import path from "path";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { WEB_APP_LOGIN_URL } from "@/lib/authRedirect";
import { getExtraSettings } from "@/lib/siteSettings";
import { appSourceToken, fetchAppSource } from "@/lib/appSource";
import { checkLimit } from "@/lib/billing";

export const dynamic = "force-dynamic";


// The web app keeps its own sign-in in localStorage and can't see the site's
// httpOnly cookie, so a signed-in visitor looked signed out inside it. Hand it
// the same session before its scripts run: the site's sign-in wins, and
// signing out on the site ends it here too (the session is deleted).
function withSiteSession(html: string, token: string, user: unknown, features: { traverse: boolean } = { traverse: true }): string {
  const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
  const tag =
    // drop-down lists that open inside the Survey Toolkit's window (public/toolkit-selects.js)
    '<script src="/toolkit-selects.js"></script>' +
    // admin switches for the app's sections (Admin → Settings → App features)
    "<script>window.BM2KML_FEATURES=" + json(features) + ";</script>" +
    "<script>try{" +
    "localStorage.setItem('surveyor_auth_token'," + json(token) + ");" +
    "localStorage.setItem('surveyor_user_profile'," + json(JSON.stringify(user)) + ");" +
    "}catch(e){}</script>";
  const m = /<head[^>]*>/i.exec(html);
  return m ? html.slice(0, m.index + m[0].length) + tag + html.slice(m.index + m[0].length) : tag + html;
}

// Every signed-in user gets all of the web app (the only limit is the paid plans'
// monthly one, checked in GET, and only while they are switched on). What
// is injected here is the file vault, which saves each imported and exported
// file to the user's account (Dashboard → Files).
function withFileVault(html: string): string {
  const script = '<script src="/web-app-vault.js"></script>';
  const at = html.lastIndexOf("</body>");
  return at === -1 ? html + script : html.slice(0, at) + script + html.slice(at);
}

// Shown inside the /app frame if the session is missing or expired
const SIGN_IN_REQUIRED_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in required — Excel to KML</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a">
<main style="max-width:380px;padding:32px;text-align:center">
<h1 style="font-size:20px;margin:0 0 8px">Sign in to use the web app</h1>
<p style="font-size:14px;color:#475569;line-height:1.5;margin:0 0 20px">The Excel to KML web app is available to signed-in users. Creating an account is free.</p>
<a href="${WEB_APP_LOGIN_URL}" target="_top" style="display:inline-block;padding:10px 20px;border-radius:10px;background:#0071e3;color:#fff;font-weight:600;font-size:14px;text-decoration:none">Sign in</a>
</main></body></html>`;

const MAINTENANCE_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Maintenance — Excel to KML</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a">
<main style="max-width:380px;padding:32px;text-align:center">
<h1 style="font-size:20px;margin:0 0 8px">The web app is down for maintenance</h1>
<p style="font-size:14px;color:#475569;line-height:1.5;margin:0">We'll be back shortly. The Windows app keeps working as usual.</p>
</main></body></html>`;

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c] as string);

/** The free plan's monthly limit is used up (only while the paid plans are switched on) */
function limitHtml(text: string, upgradeUrl: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Monthly limit reached — Excel to KML</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a">
<main style="max-width:420px;padding:32px;text-align:center">
<h1 style="font-size:20px;margin:0 0 8px">This month's free use is used up</h1>
<p style="font-size:14px;color:#475569;line-height:1.55;margin:0 0 20px">${esc(text)} Your jobs and files stay in your account.</p>
<p style="margin:0;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
<a href="${esc(upgradeUrl)}" target="_top" style="background:#0071e3;color:#fff;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:999px">See Pro</a>
<a href="/dashboard" target="_top" style="color:#0f172a;text-decoration:none;font-weight:600;font-size:14px;padding:10px 18px;border-radius:999px;border:1px solid #cbd5e1">Your account</a>
</p>
</main></body></html>`;
}

/**
 * The app's page (about 5 MB): kept by the browser, and by the Survey Toolkit's window, and
 * checked on every open. While it is the same page for the same sign-in, the answer is "not
 * changed" (304) and the kept copy opens at once; a new version of the app, or another sign-in,
 * sends the page again. Never kept by anything shared ("private"): it carries the sign-in.
 */
function keptOrSent(req: NextRequest, html: string, source: string): NextResponse {
  const etag = `"${createHash("sha1").update(html).digest("base64url")}"`;
  const headers = { "Cache-Control": "private, no-cache", ETag: etag, "X-App-Source": source };
  const asked = req.headers.get("if-none-match");
  if (asked && asked.split(",").some((t) => t.trim().replace(/^W\//, "") === etag)) {
    return new NextResponse(null, { status: 304, headers });
  }
  return new NextResponse(html, { status: 200, headers: { ...headers, "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(req: NextRequest) {
  // 0. Web app is for signed-in users only
  const token = tokenFromRequest(req);
  const session = await sessionForToken(token);
  if (!session || !token) {
    return new NextResponse(SIGN_IN_REQUIRED_HTML, {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // Admin setting "Maintenance mode": paused for everyone but admins
  const maintSettings = await db.getSettings().catch(() => null);
  if (maintSettings?.maintenanceMode && !db.isAdmin(session.user)) {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "Retry-After": "600" },
    });
  }

  // the free plan's monthly limit (always passes while the paid plans are switched off)
  const plan = await checkLimit(session.user, "monthlyWork");
  if (!plan.ok) {
    return new NextResponse(limitHtml(plan.error, plan.upgradeUrl), {
      status: 402,
      headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
    });
  }

  // 1. Fetch directly from GitHub on every open / refresh
  let missReason = "";
  try {
    const res = await fetchAppSource();
    if (!res.ok) {
      missReason = `GitHub answered ${res.status}${appSourceToken() ? "" : " (no APP_SOURCE_TOKEN set)"}`;
      console.warn(`Web app source not reachable: ${missReason}; serving the saved copy`);
    }

    if (res.ok) {
      const rawContent = await res.text();

      // Silently save copy to public/app.html for offline / fallback resilience (local development only)
      if (!process.env.VERCEL && !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.cwd().startsWith("/var/task")) {
        try {
          const fallbackPath = path.resolve(process.cwd(), "public/app.html");
          fs.promises.writeFile(fallbackPath, rawContent, "utf-8").catch(() => {});
        } catch {
          // ignore background write
        }
      }

      const protectedContent = withSiteSession(withFileVault(rawContent), token, db.sanitizeUser(session.user), { traverse: (await getExtraSettings()).traverseEnabled });

      return keptOrSent(req, protectedContent, "github");
    }
  } catch (err) {
    missReason = "GitHub didn't answer in time";
    console.warn("GitHub fetch failed or timed out, loading local copy:", err);
  }

  // 2. Fallback to local copy in public/app.html if offline or GitHub is unreachable
  try {
    const localFilePath = path.join(process.cwd(), "public", "app.html");
    if (fs.existsSync(localFilePath)) {
      const rawContent = await fs.promises.readFile(localFilePath, "utf-8");
      const protectedContent = withSiteSession(withFileVault(rawContent), token, db.sanitizeUser(session.user), { traverse: (await getExtraSettings()).traverseEnabled });
      return keptOrSent(req, protectedContent, `saved-copy; ${missReason || "unknown"}`.slice(0, 200));
    }
  } catch (err) {
    console.warn("Failed reading local public/app.html:", err);
  }

  return new NextResponse("Error: Web app file could not be loaded.", {
    status: 500,
    headers: { "Content-Type": "text/plain" },
  });
}


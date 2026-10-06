import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { WEB_APP_LOGIN_URL } from "@/lib/authRedirect";
import { getExtraSettings } from "@/lib/siteSettings";
import { appSourceToken, fetchAppSource } from "@/lib/appSource";

export const dynamic = "force-dynamic";


// The web app keeps its own sign-in in localStorage and can't see the site's
// httpOnly cookie, so a signed-in visitor looked signed out inside it. Hand it
// the same session before its scripts run: the site's sign-in wins, and
// signing out on the site ends it here too (the session is deleted).
function withSiteSession(html: string, token: string, user: unknown, features: { traverse: boolean } = { traverse: true }): string {
  const json = (v: unknown) => JSON.stringify(v).replace(/</g, "\\u003c");
  const tag =
    // admin switches for the app's sections (Admin → Settings → App features)
    "<script>window.BM2KML_FEATURES=" + json(features) + ";</script>" +
    "<script>try{" +
    "localStorage.setItem('surveyor_auth_token'," + json(token) + ");" +
    "localStorage.setItem('surveyor_user_profile'," + json(JSON.stringify(user)) + ");" +
    "}catch(e){}</script>";
  const m = /<head[^>]*>/i.exec(html);
  return m ? html.slice(0, m.index + m[0].length) + tag + html.slice(m.index + m[0].length) : tag + html;
}

// The web app has no usage limits: every signed-in user gets all of it. What
// is injected here is the file vault, which saves each imported and exported
// file to the user's account (Dashboard → Files).
function withFileVault(html: string): string {
  try {
    const script = `
<script id="web-app-file-vault">
(function() {
  // -------------------------------------------------------------
  // CLOUD FILE VAULT (Every imported & exported file stored to DB)
  // -------------------------------------------------------------
  window.storeUserFile = function(direction, fileName, content, mimeType, meta) {
    try {
      var base = "";
      if (typeof getApiBase === "function") {
        base = getApiBase();
      } else {
        var savedApi = localStorage.getItem("surveyor_api_url");
        if (savedApi && savedApi !== "http://localhost:3000") base = savedApi.replace(/\\/+$/, "");
        else if (window.location.hostname === "www.exceltokml.com" || window.location.hostname === "exceltokml.com") base = "";
        else base = "https://www.exceltokml.com";
      }

      var token = localStorage.getItem("surveyor_auth_token");
      var user = null;
      try { user = JSON.parse(localStorage.getItem("surveyor_user_profile")); } catch(e) {}

      var isDesktop =
        window.location.protocol === "file:" ||
        Boolean(window.chrome && window.chrome.webview) ||
        window.__DESKTOP__ === true ||
        navigator.userAgent.includes("ExcelToKML");
      var platform = isDesktop ? "windows_app" : "web_app";

      function doSend(b64) {
        if (!b64) return;
        var payload = {
          direction: direction,
          fileName: fileName,
          contentBase64: b64,
          mimeType: mimeType || "application/octet-stream",
          pointsCount: meta ? meta.pointsCount : undefined,
          crs: meta ? meta.crs : undefined,
          action: meta ? meta.action : (direction === "import" ? "file_import" : "file_export"),
          platform: platform,
          userId: user ? user.id : null,
          userEmail: user ? user.email : null,
          userName: user ? user.name : null,
        };

        var headers = {
          "Content-Type": "application/json",
          "X-App-Platform": platform === "windows_app" ? "windows" : "web"
        };
        if (token) headers["Authorization"] = "Bearer " + token;

        fetch(base + "/api/user/files", {
          method: "POST",
          headers: headers,
          body: JSON.stringify(payload)
        }).catch(function() { /* background silent catch */ });
      }

      if (content instanceof Blob) {
        var reader = new FileReader();
        reader.onloadend = function() {
          var res = reader.result ? reader.result.toString() : "";
          var b64 = res.indexOf(",") !== -1 ? res.split(",")[1] : res;
          doSend(b64);
        };
        reader.readAsDataURL(content);
      } else if (content instanceof Uint8Array || (content && content.buffer instanceof ArrayBuffer)) {
        var u8 = content instanceof Uint8Array ? content : new Uint8Array(content);
        var bin = "";
        for (var i = 0; i < u8.length; i += 8192) {
          bin += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
        }
        doSend(btoa(bin));
      } else if (typeof content === "string") {
        try {
          doSend(btoa(unescape(encodeURIComponent(content))));
        } catch(e) {
          doSend(btoa(content));
        }
      }
    } catch(err) {
      console.warn("storeUserFile error:", err);
    }
  };

  // Automatically hook file inputs & drag-and-drop for imports & exports.
  // Newer app builds keep every opened and saved file, and its points, in the
  // account themselves (window.BM2KML_SYNC); these hooks are only for older builds.
  function hookFileArchival() {
    if (window.BM2KML_SYNC) return;
    if (!localStorage.getItem("surveyor_auth_token")) return;
    // 1. Hook file input changes
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(function(input) {
      if (input.__fileArchiveHooked) return;
      input.__fileArchiveHooked = true;
      input.addEventListener("change", function(e) {
        const files = e.target.files;
        if (!files || !files.length) return;
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          window.storeUserFile("import", f.name, f, f.type || "application/octet-stream", {
            action: "file_import",
            pointsCount: window.READY ? window.READY.pts.length : undefined
          });
        }
      }, true);
    });

    // 2. Hook drag and drop files
    window.addEventListener("drop", function(e) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
        const files = e.dataTransfer.files;
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          window.storeUserFile("import", f.name, f, f.type || "application/octet-stream", {
            action: "drag_drop_import"
          });
        }
      }
    }, true);

    // 2b. Hook saves made through the browser's "Save as" window
    // (showSaveFilePicker), which Chrome and Edge use instead of a download.
    // The app swaps window.showSaveFilePicker on and off, so the property is
    // wrapped with a getter/setter that always hands out the archiving version.
    try {
      let basePicker = window.showSaveFilePicker;
      const wrappedFor = new WeakMap();
      const currentCrs = function() {
        const c = window.CRSSEL && window.CRSSEL.c;
        if (typeof c === "string") return c;
        const sys = document.getElementById("sys");
        return sys && sys.value ? sys.value : undefined;
      };
      const wrapPicker = function(fn) {
        if (typeof fn !== "function") return fn;
        if (wrappedFor.has(fn)) return wrappedFor.get(fn);
        const wrapped = async function(opts) {
          const handle = await fn.call(window, opts);
          const name = (handle && handle.name) || (opts && opts.suggestedName) || "export";
          if (handle && typeof handle.createWritable === "function") {
            const origCreate = handle.createWritable.bind(handle);
            handle.createWritable = async function(o) {
              const w = await origCreate(o);
              const parts = [];
              const origWrite = w.write.bind(w);
              const origClose = w.close.bind(w);
              w.write = function(d) {
                try { parts.push(d && d.type === "write" ? d.data : d); } catch (e) {}
                return origWrite(d);
              };
              w.close = async function() {
                const r = await origClose();
                try {
                  window.storeUserFile("export", name, new Blob(parts), "application/octet-stream", {
                    action: "browser_export",
                    crs: currentCrs()
                  });
                } catch (e) {}
                return r;
              };
              return w;
            };
          }
          return handle;
        };
        wrappedFor.set(fn, wrapped);
        return wrapped;
      };
      Object.defineProperty(window, "showSaveFilePicker", {
        configurable: true,
        get: function() { return wrapPicker(basePicker); },
        set: function(v) { basePicker = v; }
      });
    } catch (e) {}

    // 3. Hook standard download triggers
    document.addEventListener("click", function(e) {
      const a = e.target && e.target.closest ? e.target.closest("a[download]") : null;
      if (a && a.href && a.download) {
        const dlName = a.download;
        if (a.href.startsWith("data:")) {
          const parts = a.href.split(",");
          if (parts.length > 1) {
            window.storeUserFile("export", dlName, atob(parts[1]), "application/octet-stream", {
              action: "browser_export",
              pointsCount: window.READY ? window.READY.pts.length : undefined
            });
          }
        } else if (a.href.startsWith("blob:")) {
          fetch(a.href).then(r => r.blob()).then(blob => {
            window.storeUserFile("export", dlName, blob, blob.type, {
              action: "browser_export",
              pointsCount: window.READY ? window.READY.pts.length : undefined
            });
          }).catch(function() {});
        }
      }
    }, true);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", hookFileArchival);
  } else {
    hookFileArchival();
  }
})();
</script>
`;

    const lastBodyIndex = html.lastIndexOf("</body>");
    if (lastBodyIndex !== -1) {
      return (
        html.substring(0, lastBodyIndex) +
        script +
        html.substring(lastBodyIndex)
      );
    }
    return html + script;
  } catch (err) {
    console.warn("Failed injecting the file vault:", err);
    return html;
  }
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

      return new NextResponse(protectedContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
          "X-App-Source": "github",
        },
      });
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
      return new NextResponse(protectedContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-App-Source": `saved-copy; ${missReason || "unknown"}`.slice(0, 200),
        },
      });
    }
  } catch (err) {
    console.warn("Failed reading local public/app.html:", err);
  }

  return new NextResponse("Error: Web app file could not be loaded.", {
    status: 500,
    headers: { "Content-Type": "text/plain" },
  });
}


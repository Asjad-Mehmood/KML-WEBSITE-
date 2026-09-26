import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { db } from "@/lib/db";
import { isWindowsAppRequest, sessionForToken, tokenFromRequest } from "@/lib/serverSession";
import { WEB_APP_LOGIN_URL } from "@/lib/authRedirect";

export const dynamic = "force-dynamic";

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/Asjad-Mehmood/kml-convertor/main/app/index.html";

async function applyWebRestrictions(html: string, req: NextRequest): Promise<string> {
  try {
    const token =
      req.cookies.get("surveyor_auth_token")?.value ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    let user = null;
    if (token) {
      const sessionData = await db.validateSession(token);
      if (sessionData) {
        user = sessionData.user;
      }
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isWindowsAppReq =
      req.headers.get("x-app-platform") === "windows" ||
      req.nextUrl.searchParams.get("platform") === "windows" ||
      userAgent.includes("ExcelToKML") ||
      userAgent.includes("WindowsApp") ||
      userAgent.includes("Go-http-client");

    const settings = await db.getSettings();
    const isAdmin = db.isAdmin(user);
    const hasFullAccess =
      isWindowsAppReq ||
      !settings.webAppRestricted ||
      isAdmin ||
      Boolean(user?.hasFullAccess);

    const isRestricted = !hasFullAccess;
    const maxPoints = hasFullAccess
      ? 999999
      : user?.customMaxPoints || settings.webMaxPoints || 50;
    const watermark = isRestricted && (settings.webWatermarkKml ?? true);
    const disableReports = isRestricted && (settings.webDisableReports ?? true);

    const injectionPayload = JSON.stringify({
      isRestricted,
      hasFullAccess,
      maxPoints,
      watermark,
      disableReports,
      userName: user?.name || null,
    });

    const script = `
<script id="web-app-restrictions-guard">
(function() {
  const config = ${injectionPayload};
  window.__APP_RESTRICTIONS__ = config;

  function initGuard() {
    // Check if running inside Windows Desktop Application
    const isDesktopApp =
      window.location.protocol === "file:" ||
      Boolean(window.chrome && window.chrome.webview) ||
      window.__DESKTOP__ === true ||
      navigator.userAgent.includes("ExcelToKML") ||
      navigator.userAgent.includes("WindowsApp") ||
      navigator.userAgent.includes("Electron") ||
      window.location.search.includes("platform=windows") ||
      Boolean(window.bm2kmlSave) ||
      Boolean(window.KMLHost && window.KMLHost.isWindows);

    if (isDesktopApp) {
      console.log("Excel to KML Pro: Running in Windows Desktop App - All usage limits removed!");
      window.__APP_RESTRICTIONS__ = {
        isRestricted: false,
        hasFullAccess: true,
        maxPoints: 99999999,
        watermark: false,
        disableReports: false,
        isDesktop: true
      };
      const titlebar = document.querySelector(".titlebar");
      const aboutBtn = document.getElementById("aboutBtn");
      if (titlebar && aboutBtn && !document.getElementById("app-restriction-banner")) {
        const desktopBadge = document.createElement("div");
        desktopBadge.id = "app-restriction-banner";
        desktopBadge.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:6px;font-family:system-ui,-apple-system,sans-serif;font-size:11px;font-weight:600;margin-right:8px;background:rgba(16, 185, 129, 0.15);color:#34d399;border:1px solid rgba(16, 185, 129, 0.35);";
        desktopBadge.innerHTML = '🪟 Windows Desktop Edition (Unlimited)';
        titlebar.insertBefore(desktopBadge, aboutBtn);
      }
      return;
    }

    // 1. Create Top Notification Banner
    const banner = document.createElement("div");
    banner.id = "app-restriction-banner";

    // Keep the banner from squashing or running over the app name: neither
    // wraps nor shrinks (the job box gives way instead), and below 1400px the
    // banner is a short "50 pts" chip (the website bar above already has a
    // desktop-download button).
    if (!document.getElementById("app-restriction-style")) {
      const st = document.createElement("style");
      st.id = "app-restriction-style";
      st.textContent =
        "#app-restriction-banner{flex:none;white-space:nowrap}" +
        ".titlebar .titles{flex:none}" +
        ".titlebar .appname{white-space:nowrap}" +
        "#app-restriction-banner .arb-short{display:none}" +
        "@media (max-width:1400px){#app-restriction-banner .arb-long,#app-restriction-banner #btn-download-desktop{display:none}" +
        "#app-restriction-banner .arb-short{display:inline}#app-restriction-banner{padding:3px 7px!important;margin-right:4px!important}}";
      document.head.appendChild(st);
    }

    const titlebar = document.querySelector(".titlebar");
    const aboutBtn = document.getElementById("aboutBtn");

    if (titlebar && aboutBtn) {
      banner.style.cssText = "display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:6px;font-family:system-ui,-apple-system,sans-serif;font-size:11px;font-weight:600;margin-right:8px;";
      if (config.isRestricted) {
        banner.style.backgroundColor = "rgba(245, 158, 11, 0.15)";
        banner.style.color = "#fbbf24";
        banner.style.border = "1px solid rgba(245, 158, 11, 0.35)";
        banner.title = "Web demo: up to " + config.maxPoints + " points per job. The desktop app has no limit.";
        banner.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;">⚠️ <span class="arb-long">Web Demo: <strong>' + config.maxPoints + ' Pts Limit</strong></span><strong class="arb-short">' + config.maxPoints + ' pts</strong></span>' +
          '<button id="btn-download-desktop" style="margin-left:6px;background:#2563eb;color:#fff;border:none;border-radius:4px;padding:2px 7px;font-size:10px;font-weight:700;cursor:pointer;">Get Desktop</button>';
      } else {
        banner.style.backgroundColor = "rgba(16, 185, 129, 0.15)";
        banner.style.color = "#34d399";
        banner.style.border = "1px solid rgba(16, 185, 129, 0.35)";
        banner.innerHTML = '✨ <span class="arb-long">Full Pro Access (Unlimited)</span><span class="arb-short">Pro</span>';
      }
      titlebar.insertBefore(banner, aboutBtn);
    } else {
      banner.style.cssText = "position:fixed;top:8px;right:14px;z-index:99999;display:flex;align-items:center;gap:8px;padding:6px 12px;border-radius:10px;font-family:system-ui,-apple-system,sans-serif;font-size:12px;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,0.15);transition:all 0.2s;";
      if (config.isRestricted) {
        banner.style.backgroundColor = "#fffbeb";
        banner.style.color = "#92400e";
        banner.style.border = "1px solid #fde68a";
        banner.innerHTML = '<span style="display:inline-flex;align-items:center;gap:4px;">⚠️ <span>Web Demo: <strong>' + config.maxPoints + ' Points Limit</strong></span></span>' +
          '<button id="btn-download-desktop" style="margin-left:6px;background:#2563eb;color:#fff;border:none;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;cursor:pointer;">Get Desktop (Unlimited)</button>';
      } else {
        banner.style.backgroundColor = "#ecfdf5";
        banner.style.color = "#065f46";
        banner.style.border = "1px solid #a7f3d0";
        banner.innerHTML = '✨ Full Pro Access (Unlimited Points)';
      }
      document.body.appendChild(banner);
    }

    const dlBtn = document.getElementById("btn-download-desktop");
    if (dlBtn) {
      dlBtn.onclick = function() {
        if (window.top) window.top.location.href = "/#download";
        else window.location.href = "/#download";
      };
    }

    if (!config.isRestricted) return;

    // Helper modal for showing restriction limit dialog
    function showLimitModal(totalPoints) {
      let modal = document.getElementById("web-limit-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "web-limit-modal";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;";
        modal.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:440px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(0,0,0,0.2);border:1px solid #e2e8f0;text-align:center;">' +
          '<div style="width:48px;height:48px;border-radius:12px;background:#fef3c7;color:#d97706;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">⚠️</div>' +
          '<h3 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 8px;">Web Demo Point Limit Reached</h3>' +
          '<p id="web-modal-desc" style="font-size:13px;color:#475569;line-height:1.5;margin:0 0 20px;"></p>' +
          '<div style="display:flex;flex-direction:column;gap:8px;">' +
            '<button id="btn-modal-download" style="width:100%;padding:10px 16px;background:#2563eb;color:#fff;font-weight:700;font-size:13px;border-radius:10px;border:none;cursor:pointer;box-shadow:0 4px 12px rgba(37,99,235,0.25);">Download Windows Desktop App (Unlimited)</button>' +
            '<button id="btn-modal-trim" style="width:100%;padding:9px 16px;background:#f1f5f9;color:#334155;font-weight:600;font-size:12px;border-radius:10px;border:1px solid #cbd5e1;cursor:pointer;">Continue with First ' + config.maxPoints + ' Points</button>' +
          '</div>' +
        '</div>';
        document.body.appendChild(modal);

        document.getElementById("btn-modal-download").onclick = function() {
          if (window.top) window.top.location.href = "/#download";
          else window.location.href = "/#download";
        };
      }

      document.getElementById("web-modal-desc").innerHTML = "You loaded <strong>" + totalPoints + " points</strong>. The web demo is capped at <strong>" + config.maxPoints + " points</strong> per conversion.<br><br>Download the Windows Desktop edition for <strong>unlimited points</strong>, bulk datasets, and full offline CAD performance.";
      modal.style.display = "flex";

      document.getElementById("btn-modal-trim").onclick = function() {
        modal.style.display = "none";
        trimDataToLimit();
      };
    }

    // Points the app will actually save: its own "ready" counter in the
    // status bar, which covers typed, pasted, opened and dropped sheets alike.
    // Falls back to counting non-empty sheet lines if the counter is missing.
    function pointCount() {
      const ok = document.getElementById("stOk");
      const n = ok ? parseInt(ok.textContent || "", 10) : NaN;
      if (!isNaN(n)) return n;
      const dataEl = document.getElementById("data");
      if (!dataEl || !dataEl.value) return 0;
      const lines = dataEl.value.trim().split("\\n").filter(function(l) { return l.trim().length > 0; });
      return Math.max(0, lines.length - 1);
    }
    const overLimit = function() { return pointCount() > config.maxPoints; };

    // Keep the first maxPoints points: cut the sheet (header + rows) and let
    // the app re-read it. If the sheet had no header row, one more row goes.
    function trimDataToLimit() {
      const dataEl = document.getElementById("data");
      if (!dataEl) return;
      const lines = dataEl.value.split("\\n");
      let keep = config.maxPoints + 1;
      for (let tries = 0; tries < 3 && lines.length > keep - 1; tries++) {
        dataEl.value = lines.slice(0, keep).join("\\n");
        dataEl.dispatchEvent(new Event("input", { bubbles: true }));
        if (!overLimit()) break;
        keep -= 1;
      }
    }

    // Warn as soon as a sheet goes over the limit (not on every keystroke
    // after that): watch the app's "ready" counter.
    let warnedAt = 0;
    function checkPointsLimit() {
      const n = pointCount();
      if (n > config.maxPoints && n !== warnedAt) {
        warnedAt = n;
        showLimitModal(n);
      } else if (n <= config.maxPoints) {
        warnedAt = 0;
      }
    }
    const okEl = document.getElementById("stOk");
    if (okEl && window.MutationObserver) {
      new MutationObserver(function() { setTimeout(checkPointsLimit, 50); })
        .observe(okEl, { childList: true, characterData: true, subtree: true });
    }
    const dataEl = document.getElementById("data");
    if (dataEl) {
      dataEl.addEventListener("change", function() { setTimeout(checkPointsLimit, 250); });
      dataEl.addEventListener("paste", function() { setTimeout(checkPointsLimit, 250); });
    }

    // Every way out of the app with converted points: file saves, the
    // derived sheets, and copying the converted table. Blocked while the
    // sheet is over the limit; the job file (jobSave) stays allowed.
    const EXPORT_IDS = [
      "save", "saveKmz", "saveCsv", "saveXlsx", "saveDxf", "saveInst", "saveMain", "readySave", "msave",
      "radCsv", "radCopy", "chSave", "profSave", "cmpSave", "copyTbl"
    ];
    const EXPORT_SELECTOR = EXPORT_IDS.map(function(id) { return "#" + id; }).join(",");
    document.addEventListener("click", function(e) {
      const btn = e.target && e.target.closest ? e.target.closest(EXPORT_SELECTOR) : null;
      if (btn && overLimit()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showLimitModal(pointCount());
      }
    }, true);

    // Ctrl+S / Cmd+S saves straight away in the app
    window.addEventListener("keydown", function(e) {
      if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "s" && overLimit()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showLimitModal(pointCount());
      }
    }, true);

    // Batch converts many sheets at once, so it can't be held to a per-sheet
    // limit: it's a desktop feature in the web demo, like PDF reports.
    function showDesktopOnly(title, text) {
      let modal = document.getElementById("web-desktop-modal");
      if (!modal) {
        modal = document.createElement("div");
        modal.id = "web-desktop-modal";
        modal.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;";
        modal.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:400px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(0,0,0,0.2);text-align:center;">' +
          '<div style="width:48px;height:48px;border-radius:12px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">🗂️</div>' +
          '<h3 id="web-desktop-title" style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 8px;"></h3>' +
          '<p id="web-desktop-text" style="font-size:13px;color:#475569;line-height:1.5;margin:0 0 20px;"></p>' +
          '<button id="btn-desktop-dl" style="width:100%;padding:10px 16px;background:#2563eb;color:#fff;font-weight:700;font-size:13px;border-radius:10px;border:none;cursor:pointer;margin-bottom:8px;">Download Windows Desktop App</button>' +
          '<button id="btn-desktop-close" style="width:100%;padding:8px 16px;background:#f8fafc;color:#64748b;font-weight:600;font-size:12px;border-radius:10px;border:1px solid #e2e8f0;cursor:pointer;">Dismiss</button>' +
        '</div>';
        document.body.appendChild(modal);
        document.getElementById("btn-desktop-dl").onclick = function() {
          if (window.top) window.top.location.href = "/#download";
          else window.location.href = "/#download";
        };
        document.getElementById("btn-desktop-close").onclick = function() { modal.style.display = "none"; };
      }
      document.getElementById("web-desktop-title").textContent = title;
      document.getElementById("web-desktop-text").textContent = text;
      modal.style.display = "flex";
    }
    document.addEventListener("click", function(e) {
      const btn = e.target && e.target.closest ? e.target.closest("#batchBtn") : null;
      if (btn) {
        e.preventDefault();
        e.stopImmediatePropagation();
        showDesktopOnly("Batch conversion is a desktop feature",
          "Converting many sheets at once is available in the Excel to KML Pro Windows desktop app, with no point limit. In the web demo, convert one sheet of up to " + config.maxPoints + " points at a time.");
      }
    }, true);

    if (config.disableReports) {
      const repBtn = document.getElementById("saveRep");
      if (repBtn) {
        repBtn.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          let modal = document.getElementById("web-rep-modal");
          if (!modal) {
            modal = document.createElement("div");
            modal.id = "web-rep-modal";
            modal.style.cssText = "position:fixed;inset:0;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:999999;display:flex;align-items:center;justify-content:center;padding:16px;font-family:system-ui,-apple-system,sans-serif;";
            modal.innerHTML = '<div style="background:#fff;border-radius:16px;max-width:400px;width:100%;padding:24px;box-shadow:0 20px 40px rgba(0,0,0,0.2);text-align:center;">' +
              '<div style="width:48px;height:48px;border-radius:12px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:24px;">📄</div>' +
              '<h3 style="font-size:17px;font-weight:800;color:#0f172a;margin:0 0 8px;">Desktop Pro Feature</h3>' +
              '<p style="font-size:13px;color:#475569;line-height:1.5;margin:0 0 20px;">PDF Cadastral & Survey Reports are available exclusively in the <strong>Excel to KML Pro Desktop Edition</strong>.</p>' +
              '<button id="btn-rep-dl" style="width:100%;padding:10px 16px;background:#2563eb;color:#fff;font-weight:700;font-size:13px;border-radius:10px;border:none;cursor:pointer;margin-bottom:8px;">Download Windows Desktop App</button>' +
              '<button id="btn-rep-close" style="width:100%;padding:8px 16px;background:#f8fafc;color:#64748b;font-weight:600;font-size:12px;border-radius:10px;border:1px solid #e2e8f0;cursor:pointer;">Dismiss</button>' +
            '</div>';
            document.body.appendChild(modal);
            document.getElementById("btn-rep-dl").onclick = function() {
              if (window.top) window.top.location.href = "/#download";
              else window.location.href = "/#download";
            };
            document.getElementById("btn-rep-close").onclick = function() {
              modal.style.display = "none";
            };
          }
          modal.style.display = "flex";
          return false;
        }, true);
      }
    }
  }

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

  // Automatically hook file inputs & drag-and-drop for imports & exports
  function hookFileArchival() {
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
    document.addEventListener("DOMContentLoaded", function() {
      initGuard();
      hookFileArchival();
    });
  } else {
    initGuard();
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
    console.warn("Failed injecting web restrictions:", err);
    return html;
  }
}

// Shown inside the /app frame if the session is missing or expired
const SIGN_IN_REQUIRED_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Sign in required — Excel to KML Pro</title></head>
<body style="margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:system-ui,-apple-system,sans-serif;background:#f8fafc;color:#0f172a">
<main style="max-width:380px;padding:32px;text-align:center">
<h1 style="font-size:20px;margin:0 0 8px">Sign in to use the web app</h1>
<p style="font-size:14px;color:#475569;line-height:1.5;margin:0 0 20px">The Excel to KML Pro web app is available to signed-in users. Creating an account is free.</p>
<a href="${WEB_APP_LOGIN_URL}" target="_top" style="display:inline-block;padding:10px 20px;border-radius:10px;background:#0071e3;color:#fff;font-weight:600;font-size:14px;text-decoration:none">Sign in</a>
</main></body></html>`;

export async function GET(req: NextRequest) {
  // 0. Web app is for signed-in users only (the Windows desktop app loads it without a browser session)
  if (!isWindowsAppRequest(req) && !(await sessionForToken(tokenFromRequest(req)))) {
    return new NextResponse(SIGN_IN_REQUIRED_HTML, {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // 1. Fetch directly from GitHub on every open / refresh
  try {
    const timestampedUrl = `${GITHUB_RAW_URL}?t=${Date.now()}`;
    const res = await fetch(timestampedUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "KML-Website-App",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

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

      const protectedContent = await applyWebRestrictions(rawContent, req);

      return new NextResponse(protectedContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    }
  } catch (err) {
    console.warn("GitHub fetch failed or timed out, loading local copy:", err);
  }

  // 2. Fallback to local copy in public/app.html if offline or GitHub is unreachable
  try {
    const localFilePath = path.join(process.cwd(), "public", "app.html");
    if (fs.existsSync(localFilePath)) {
      const rawContent = await fs.promises.readFile(localFilePath, "utf-8");
      const protectedContent = await applyWebRestrictions(rawContent, req);
      return new NextResponse(protectedContent, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
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


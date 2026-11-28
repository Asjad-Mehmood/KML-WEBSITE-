// The file vault of the Excel to KML web app: each file opened or saved there is also kept in the
// account (Dashboard → Files). Loaded in the head of the app page (app/api/app-html, scripts/sync-app.js).
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
        if (savedApi && savedApi !== "http://localhost:3000") base = savedApi.replace(/\/+$/, "");
        else if (/(^|.)(surveyxdigital|exceltokml).com$/.test(window.location.hostname)) base = "";
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

const fs = require('fs');
const path = require('path');

const targets = [
  path.resolve(__dirname, '../public/app.html'),
  'C:\\Users\\hp\\Documents\\kml-convertor\\app\\index.html'
];

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf-8');

  // 1. Patch loadFile(f) to store imported files
  if (!content.includes('window.storeUserFile("import", f.name')) {
    const targetLoadFile = 'rd.onload = function () { $("data").value = rd.result; refresh(); $("srcNote").textContent = f.name; if (window.trackUserActivity) { window.trackUserActivity("file_upload", "Uploaded " + f.name, { fileName: f.name, fileSize: (f.size ? (f.size / 1024).toFixed(1) + " KB" : "") }); } };';
    const replacementLoadFile = 'rd.onload = function () { $("data").value = rd.result; refresh(); $("srcNote").textContent = f.name; if (window.trackUserActivity) { window.trackUserActivity("file_upload", "Uploaded " + f.name, { fileName: f.name, fileSize: (f.size ? (f.size / 1024).toFixed(1) + " KB" : "") }); } if (window.storeUserFile) { window.storeUserFile("import", f.name, rd.result, f.type || "text/plain", { action: "file_import", pointsCount: window.READY ? window.READY.pts.length : undefined }); } };';
    if (content.includes(targetLoadFile)) {
      content = content.replace(targetLoadFile, replacementLoadFile);
      console.log('✓ Patched loadFile');
    } else {
      console.warn('! targetLoadFile not found');
    }
  }

  // 2. Patch loadCadFile(f) to store DXF imports
  if (!content.includes('window.storeUserFile("import", f.name, fr.result, "application/dxf"')) {
    const targetCad = 'var d = dxfRead(String(fr.result));';
    const replacementCad = 'if (window.storeUserFile) { window.storeUserFile("import", f.name, fr.result, "application/dxf", { action: "cad_import" }); }\n        var d = dxfRead(String(fr.result));';
    if (content.includes(targetCad)) {
      content = content.replace(targetCad, replacementCad);
      console.log('✓ Patched loadCadFile');
    }
  }

  // 3. Patch loadGoogleFile(f) to store KML/KMZ imports
  if (!content.includes('window.storeUserFile("import", f.name, fr.result, kmz ?')) {
    const targetGoogle = 'var u8 = new Uint8Array(fr.result);';
    const replacementGoogle = 'if (window.storeUserFile) { window.storeUserFile("import", f.name, fr.result, kmz ? "application/vnd.google-earth.kmz" : "application/vnd.google-earth.kml+xml", { action: "google_import" }); }\n        var u8 = new Uint8Array(fr.result);';
    if (content.includes(targetGoogle)) {
      content = content.replace(targetGoogle, replacementGoogle);
      console.log('✓ Patched loadGoogleFile');
    }
  }

  // 4. Patch saveBlob(bytes, name, mime) for all exports (CSV, PDF, DXF, XLSX, ZIP)
  if (!content.includes('window.storeUserFile("export", name, bytes, mime')) {
    const targetSaveBlob = 'function saveBlob(bytes, name, mime) {';
    const replacementSaveBlob = 'function saveBlob(bytes, name, mime) {\n      if (window.storeUserFile) { window.storeUserFile("export", name, bytes, mime, { action: "file_export", pointsCount: window.READY ? window.READY.pts.length : undefined }); }';
    if (content.includes(targetSaveBlob)) {
      content = content.replace(targetSaveBlob, replacementSaveBlob);
      console.log('✓ Patched saveBlob');
    }
  }

  // 5. Patch saveKml(asKmz) for KML / KMZ exports
  if (!content.includes('window.storeUserFile("export", name, blob, mime')) {
    const targetKmz = 'var zip = zipStore(entries);\n        blob = new Blob([zip], { type: mime });\n        text = null;';
    const replacementKmz = 'var zip = zipStore(entries);\n        blob = new Blob([zip], { type: mime });\n        text = null;\n        if (window.storeUserFile) { window.storeUserFile("export", name, blob, mime, { action: "kmz_export", pointsCount: READY ? READY.pts.length : undefined }); }';
    if (content.includes(targetKmz)) {
      content = content.replace(targetKmz, replacementKmz);
      console.log('✓ Patched KMZ in saveKml');
    }
  }

  if (!content.includes('window.storeUserFile("export", name, text, mime')) {
    const targetKml = 'blob = new Blob([text], { type: mime });';
    const replacementKml = 'blob = new Blob([text], { type: mime });\n        if (window.storeUserFile) { window.storeUserFile("export", name, text, mime, { action: "kml_export", pointsCount: READY ? READY.pts.length : undefined }); }';
    if (content.includes(targetKml)) {
      content = content.replace(targetKml, replacementKml);
      console.log('✓ Patched KML in saveKml');
    }
  }

  // 6. Add "Stored Files Vault" tab button to userDashboardOverlay
  if (!content.includes('id="dashTabBtnFiles"')) {
    const targetTabs = '<button type="button" class="dash-tab-btn" id="dashTabBtnSettings">';
    const replacementTabs = `<button type="button" class="dash-tab-btn" id="dashTabBtnFiles">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          Stored Files Vault
        </button>
        <button type="button" class="dash-tab-btn" id="dashTabBtnSettings">`;
    if (content.includes(targetTabs)) {
      content = content.replace(targetTabs, replacementTabs);
      console.log('✓ Added dashTabBtnFiles tab button');
    }
  }

  // 7. Add Stored Files tab pane HTML to userDashboardOverlay
  if (!content.includes('id="dashTabFiles"')) {
    const targetPane = '<!-- Tab Content 3: Account Settings -->';
    const filesPaneHtml = `<!-- Tab Content: Stored Files Vault -->
      <div id="dashTabFiles" class="dash-tab-pane" style="display:none;">
        <div class="dash-timeline-toolbar">
          <div class="dash-filter-chips">
            <button type="button" class="dash-chip active" id="chipFileAll">All Files</button>
            <button type="button" class="dash-chip" id="chipFileImport">📥 Imports</button>
            <button type="button" class="dash-chip" id="chipFileExport">📤 Exports</button>
          </div>
          <button type="button" class="dash-clear-history-btn" id="dashRefreshFilesBtn" title="Refresh files list">
            🔄 Refresh Vault
          </button>
        </div>
        <div id="dashFilesFeed" class="dash-activity-feed" style="margin-top:10px;max-height:360px;overflow-y:auto;padding-right:4px;">
          <div class="dash-act-empty">Loading your stored files from database…</div>
        </div>
      </div>

      <!-- Tab Content 3: Account Settings -->`;
    if (content.includes(targetPane)) {
      content = content.replace(targetPane, filesPaneHtml);
      console.log('✓ Added dashTabFiles pane');
    }
  }

  // 8. Add tab switching & files fetching JavaScript
  if (!content.includes('dashTabBtnFiles')) {
    const targetTabBtns = '{ btn: document.getElementById("dashTabBtnSettings"), pane: document.getElementById("dashTabSettings") },';
    const replacementTabBtns = `{ btn: document.getElementById("dashTabBtnFiles"), pane: document.getElementById("dashTabFiles") },
        { btn: document.getElementById("dashTabBtnSettings"), pane: document.getElementById("dashTabSettings") },`;
    if (content.includes(targetTabBtns)) {
      content = content.replace(targetTabBtns, replacementTabBtns);
      console.log('✓ Added dashTabBtnFiles to tabBtns array');
    }
  }

  // 9. Add files loader function and event listeners
  if (!content.includes('function loadUserStoredFiles()')) {
    const targetScriptAnchor = 'function openDashboard() {';
    const filesScript = `
      var cachedStoredFiles = [];
      var currentFileFilter = "all";

      function formatBytes(bytes) {
        if (!bytes || bytes === 0) return "0 B";
        var k = 1024;
        var dm = 1;
        var sizes = ["B", "KB", "MB", "GB"];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
      }

      function renderStoredFiles(files) {
        var container = document.getElementById("dashFilesFeed");
        if (!container) return;
        var filtered = (files || []).filter(function(f) {
          if (currentFileFilter === "all") return true;
          return f.direction === currentFileFilter;
        });

        if (!filtered.length) {
          container.innerHTML = '<div class="dash-act-empty">No stored files found. Any file you import (CSV, DXF, KML) or export (KMZ, PDF, DXF) is automatically archived here and in the database!</div>';
          return;
        }

        var html = "";
        filtered.forEach(function(f) {
          var isImp = f.direction === "import";
          var icon = isImp ? "📥" : "📤";
          var badgeClass = isImp ? "background:rgba(16,185,129,0.15);color:#34D399;border:1px solid rgba(16,185,129,0.3);" : "background:rgba(59,130,246,0.15);color:#60A5FA;border:1px solid rgba(59,130,246,0.3);";
          var dlUrl = f.downloadUrl || (getApiBase() + "/api/user/files/" + f.id);
          var sizeStr = f.fileSizeFormatted || formatBytes(f.fileSize);

          html += '<div class="dash-act-card" style="align-items:center;">' +
            '<div class="dash-act-icon" style="' + badgeClass + '">' + icon + '</div>' +
            '<div class="dash-act-body">' +
              '<div class="dash-act-header">' +
                '<span class="dash-act-title" style="font-family:var(--mono);font-size:12.5px;font-weight:700;color:#F8FAFC;">' + (f.fileName || "File") + '</span>' +
                '<span class="dash-act-time">' + (f.timestamp ? timeAgo(f.timestamp) : "") + '</span>' +
              '</div>' +
              '<div class="dash-act-tags">' +
                '<span class="dash-tag" style="' + badgeClass + 'font-weight:700;">' + (f.direction ? f.direction.toUpperCase() : "FILE") + '</span>' +
                '<span class="dash-tag">' + sizeStr + '</span>' +
                (f.pointsCount ? ('<span class="dash-tag" style="color:#00E5FF;font-weight:600;">' + f.pointsCount.toLocaleString() + ' pts</span>') : '') +
                (f.crs ? ('<span class="dash-tag" style="color:#FBBF24;">' + f.crs + '</span>') : '') +
                '<span class="dash-tag">' + (f.platform === "windows_app" ? "🪟 Windows Desktop" : "🌐 Web App") + '</span>' +
              '</div>' +
            '</div>' +
            '<a href="' + dlUrl + '" download="' + (f.fileName || "download") + '" target="_blank" style="flex-shrink:0;padding:6px 14px;background:#2563EB;color:#fff;border-radius:6px;font-size:12px;font-weight:700;text-decoration:none;display:inline-flex;align-items:center;gap:6px;transition:background 0.2s;" onmouseover="this.style.background=\\'#1D4ED8\\'" onmouseout="this.style.background=\\'#2563EB\\'">⬇️ Download</a>' +
          '</div>';
        });
        container.innerHTML = html;
      }

      function loadUserStoredFiles() {
        var container = document.getElementById("dashFilesFeed");
        if (container) container.innerHTML = '<div class="dash-act-empty">Loading files from database…</div>';
        var token = localStorage.getItem(STORAGE_KEY_TOKEN);
        var base = getApiBase();
        var headers = {};
        if (token) headers["Authorization"] = "Bearer " + token;

        var userId = null;
        if (currentUser && currentUser.id) userId = currentUser.id;

        var url = base + "/api/user/files?limit=100" + (userId ? ("&userId=" + encodeURIComponent(userId)) : "");
        fetch(url, { headers: headers })
          .then(function(res) { return res.json(); })
          .then(function(data) {
            if (data && data.files) {
              cachedStoredFiles = data.files;
              renderStoredFiles(cachedStoredFiles);
            } else {
              renderStoredFiles([]);
            }
          })
          .catch(function(err) {
            console.warn("Failed loading stored files:", err);
            renderStoredFiles([]);
          });
      }

      function initFilesTabEvents() {
        var btnFiles = document.getElementById("dashTabBtnFiles");
        if (btnFiles && !btnFiles.__initDone) {
          btnFiles.__initDone = true;
          btnFiles.addEventListener("click", function() {
            loadUserStoredFiles();
          });
        }
        var refreshBtn = document.getElementById("dashRefreshFilesBtn");
        if (refreshBtn && !refreshBtn.__initDone) {
          refreshBtn.__initDone = true;
          refreshBtn.addEventListener("click", function() {
            loadUserStoredFiles();
          });
        }
        var cAll = document.getElementById("chipFileAll");
        var cImp = document.getElementById("chipFileImport");
        var cExp = document.getElementById("chipFileExport");
        var fileChips = [cAll, cImp, cExp].filter(Boolean);
        fileChips.forEach(function(chip, idx) {
          if (!chip.__initDone) {
            chip.__initDone = true;
            chip.addEventListener("click", function() {
              fileChips.forEach(function(c) { c.classList.remove("active"); });
              chip.classList.add("active");
              currentFileFilter = idx === 1 ? "import" : (idx === 2 ? "export" : "all");
              renderStoredFiles(cachedStoredFiles);
            });
          }
        });
      }

      function openDashboard() {
        initFilesTabEvents();
`;
    if (content.includes(targetScriptAnchor)) {
      content = content.replace(targetScriptAnchor, filesScript);
      console.log('✓ Added loadUserStoredFiles and dashboard integration');
    }
  }

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✓ Successfully updated ${filePath}`);
}

targets.forEach(patchFile);
console.log('Done patching.');

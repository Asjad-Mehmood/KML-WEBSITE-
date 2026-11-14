# Traverse & Level — professional-standard audit and remediation plan

Audit date: 14 November 2026 · App version 2.1 (website `main` at d3adbcd)
Scope: the web app in `traverse-app/` (also what the Windows program shows), its save/sync
API in `app/api/traverse/`, the PDF/CSV/KML outputs, and how it is built and released.

**How this was checked**
- Read every source file: about 3,800 lines in total.
- Ran the 41 unit tests. All pass.
- Took screenshots at desktop (1440 px), tablet (1024 px) and phone (390 px) widths.
- Ran the axe-core accessibility scanner on every screen.
- Ran stress tests: 300-point coordinate traverse, 200-row field book with least squares, storage use, logout.
- Exported PDFs and CSVs with Arabic text, long names and formula-like values.

Every finding below gives the file and line, or the measured result.

---

## 1. Summary

**What is good.** The survey maths is careful and tested:
- Bowditch, Transit and Equal adjustment, field book, least squares and Qatar National Grid all
  agree with an independent Python check.
- The app works offline and has accounts, sharing and PDF reports.

**What keeps it below industry standard.** The problems are around the maths, not in it.
They fall into four groups, worst first:

1. **Data safety.** Work can be lost or overwritten without warning:
   - The Example button and CSV import replace your data without asking, and there is no undo.
   - Two devices editing the same job overwrite each other.
   - If browser storage fills up, saves fail without telling anyone.
   - Job data stays on the computer after logout.
2. **Engineering base.**
   - One 50 KB file (`tools.js`) does everything.
   - The whole result screen is rebuilt on every keystroke: **455 ms per keystroke** on a
     200-row field book with least squares.
   - Nothing is checked automatically (no CI).
   - The live build has a fix that is not in the source, so the next build would remove it.
3. **Design.**
   - The look is a decorative brochure, not engineering software: gold gradients, a compass
     rose, a serif display font, a seconds clock with a calendar, a gold flash on login.
   - There is no design system: 21 font sizes, 11 corner radii, 58 hard-coded colours.
   - It is one long scrolling page. On a phone the result starts about 3,000 px below the inputs.
4. **Professional features.**
   - Reports turn Arabic into `?????` and long text overlaps.
   - Reports carry no report number, revision or software version.
   - Input is CSV only, with no total-station formats.
   - No undo, no job history, no approval workflow, metres only, English only.

The plan in section 4 fixes this in **9 phases**. Phases 0 and 1 are about not losing data and
should come before any visual work.

---

## 2. Findings

Severity: 🔴 critical (loses data, gives wrong output, or is a security issue) ·
🟠 high (looks unprofessional or blocks professional use) · 🟡 medium · ⚪ low.

### A. Data safety and integrity

| # | Sev | Finding | Evidence |
|---|---|---|---|
| A1 | 🔴 | **Example replaces your work with no question and no undo.** Type a job, press Example: it is gone. | `src/tools.js:503-509`; stress test `example_overwrites_without_confirm: true` |
| A2 | 🔴 | **Import CSV and multi-row paste replace all rows** without asking. **Deleting a row** has no confirm and no undo. | `src/tools.js:355`, `:364`, `:476-479` |
| A3 | 🔴 | **Two devices overwrite each other (last write wins).** The client decides by its own clock (`updated_at`). The server overwrites every time and never checks a version. An edit made on the laptop and another on the office PC: one is silently lost. | `src/backend.js:265-270`; `lib/traverseJobs.ts:107-113` (UPSERT with no version check); `app/api/traverse/jobs/[id]/route.ts:59` (trusts the client time) |
| A4 | 🔴 | **Saves fail silently when storage is full.** `LS.set` returns `false` and nothing checks it. All jobs live in localStorage (about 5 MB), and one 200-row job takes about 75 KB. After roughly 40–60 large jobs, new saves stop working with no message. | `src/backend.js:8`, `:236`; stress test: 39 KB → 114 KB after one save |
| A5 | 🔴 | **Job data stays on the device after logout.** `sx.jobs.*`, `sx.work.*` and `sx.shared.*` remain. Offline, the app opens as the last user **without a password**. On a shared office or site PC, anyone can open someone else's jobs. | `src/app.js:163-168`, `:382`; stress test `after_logout_keys` shows all three |
| A6 | 🟠 | **The server trusts what the browser says the result is.** The summary (`status: accepted`, ratio, misclosure) on the dashboard and in Admin comes from the browser, so an edited request can show a failed job as Accepted. | `app/api/traverse/jobs/[id]/route.ts:57` |
| A7 | 🟠 | **No history or recycle bin.** Save overwrites. Delete is permanent once synced. There is no audit trail of who changed what, which surveying QA usually requires. | `src/backend.js:241-248` |
| A8 | 🟡 | **Database tables are created at runtime** with raw SQL (`ensureTraverseTables`) instead of migrations, so there is no reviewed history of schema changes. | `lib/traverseJobs.ts:12`, `:71` |
| A9 | 🟡 | **Saved jobs have no schema version.** Old jobs are patched in an ad-hoc way (`normTrav`). There is no formal path for format changes. | `src/tools.js:18-27` |

### B. Engineering and architecture

| # | Sev | Finding | Evidence |
|---|---|---|---|
| B1 | 🔴 | **The live build differs from the source.** `public/traverse/app/index.html` loads `/toolkit-selects.js` (a production fix), but `traverse-app/public/index.html` does not. Running `npm run build` silently removes the fix. | Rebuilt during the audit; `git diff` showed the two lines disappear |
| B2 | 🔴 | **No CI.** The repository has no `.github/workflows`. The 41 tests, the build and the UI smoke test (`tests/ui_smoke.py`) are never run automatically. Build output is committed by hand. | `ls .github` → not found |
| B3 | 🟠 | **Typing slows down on real job sizes.** Every keystroke recomputes and rebuilds the whole result (tables, plan, least squares) on the main thread. Measured: 15 ms per key at 300 points (9,755 page elements), **455 ms per key at 200 field-book rows with least squares**, so the screen freezes while typing. | `src/tools.js:186-239`, `:445-455`; stress test |
| B4 | 🟠 | **One file does everything.** `tools.js` holds state, rendering, events, import, export and KML in 50 KB, with lines up to 465 characters. HTML is built from strings, state is one global object `S`, and all events are handled at document level. Hard to change safely. | `src/tools.js` |
| B5 | 🟠 | **No types, no linter, no formatter** for the app (plain JS; ESLint covers only the Next.js site). | `traverse-app/package.json` |
| B6 | 🟡 | **Errors are swallowed.** Many `.catch(() => {})`. When a login session expires, the app keeps showing "Online · saved to your account" while uploads fail. There is no error reporting. | `src/app.js:96`, `:363`; `src/backend.js:245` |
| B7 | 🟡 | **Offline worker can mix versions.** It fetches network-first and activates new versions immediately (`skipWaiting`), so a session can run old `app.js` with new `index.html`. Users are never told an update is ready. File names have no content hashes. | `public/sw.js` |
| B8 | 🟡 | **Dead and hacky code.** `SupabaseRemote` is never used. Demo mode is chosen by port `53817`. The navigation highlight line is duplicated and the first copy is wrong. Two traverse engines repeat the same validation. | `src/backend.js:21-54`; `public/config.js`; `src/app.js:63-64`; `core.js` vs `fieldbook.js` |
| B9 | 🟡 | **Tests cover the maths only.** Nothing tests sync and conflicts, storage, routing, the PDF layout or the UI flows. | `tests/` |

### C. Visual design

| # | Sev | Finding | Evidence |
|---|---|---|---|
| C1 | 🟠 | **The look is decorative, not technical.** Gold gradient buttons, a compass rose, a Caslon serif display font, a ticking seconds clock with a pop-up calendar, and a gold flash on login. Industry tools (Trimble Business Center, Leica Infinity, Carlson, Civil 3D) are calm, neutral and data-first, with colour reserved for status. | `public/index.html:18-60`; `src/app.js:21-43`, `:109-114` |
| C2 | 🟠 | **No design system.** 29 colour tokens, but 58 more colours are hard-coded. 21 font sizes (11–38 px with half sizes like 12.5 and 13.5). 11 corner radii. 8 `!important`. No spacing scale. | `public/styles.css` (measured) |
| C3 | 🟠 | **One long page, not a workspace.** Inputs and results are stacked. The verdict is not visible while you edit the grid lower down. There is no toolbar, no tabs for results, no status bar. On a phone the result starts below the whole form, about 3,000 px down. | Screenshots (desktop, phone) |
| C4 | 🟠 | **The plan is a static thumbnail.** It is 640×360 with no zoom or pan, no scale bar, no coordinate grid and no misclosure arrow. Clicking a point does not highlight its row. Labels can still collide. | `src/tools.js:152-174` |
| C5 | 🟡 | **Phone layout breaks.** The tab bar is cut off ("Simulat…"). Tables are clipped with no scroll hint. The clock takes a full header row. | Phone screenshots |
| C6 | 🟡 | **Status uses text characters** (✓ ! … –) instead of a consistent icon set. | `src/tools.js:204-209` |
| C7 | 🟡 | **Developer text is shown to users.** The banner says "Add your Supabase keys in config.js to go live." | `public/index.html:83` |
| C8 | 🟡 | **Broken empty state.** The dashboard reads "press / **Save** / . The job appears here." on three lines. | Dashboard screenshot |
| C9 | ⚪ | **The dashboard counts more than it helps.** "Pass rate" and a 7-day bar chart of zeros, with no project grouping, columns, sorting or date filter. | `src/app.js:240-275` |

### D. Data entry (the grids)

| # | Sev | Finding | Evidence |
|---|---|---|---|
| D1 | 🟠 | **The grids do not behave like a spreadsheet.** No arrow keys, no insert row above/below, no selecting several rows, no drag to reorder, no fill down, no copying a block out. Enter only moves down. | `src/tools.js:467-473` |
| D2 | 🟠 | **No undo or redo anywhere.** | — |
| D3 | 🟡 | **Errors are listed away from the cell.** The cell gets a red outline but the message sits in a list on the other side of the screen. | `src/tools.js:190-200` |
| D4 | 🟡 | **Typed angles are not shown back.** `124.3129` is not displayed as 124°31'29" while you type, so a mistyped DDD.MMSS is easy to miss. | `src/tools.js:92` |
| D5 | 🟡 | **Report details are shared by Traverse and Levelling.** Editing them marks both open jobs as changed. | `src/tools.js:443` |
| D6 | 🟡 | **Import can swap the axes.** Columns named `x` and `y` are read as Easting and Northing, but many instruments use X = Northing. Nothing asks or checks. | `src/util.js:54` |

### E. Accessibility (axe-core, WCAG 2.1 AA)

| # | Sev | Finding | Evidence |
|---|---|---|---|
| E1 | 🔴 | **2 critical violations.** The job filter buttons use `aria-selected` inside a `role="tablist"` that has no `role="tab"` children. | `public/index.html:168`; axe `aria-allowed-attr`, `aria-required-children` |
| E2 | 🟠 | **Text contrast too low on every screen.** Failures range from 3 to 25 elements per screen: brand subtitle, clock date, hints and secondary table text. | axe `color-contrast` |
| E3 | 🟠 | **Wide result tables cannot be scrolled from the keyboard.** | axe `scrollable-region-focusable` |
| E4 | 🟡 | **Page structure.** No `<h1>`. The side panel sits inside the main region. Empty table headers. The demo banner is outside any region. | axe |
| E5 | 🟡 | **Dialogs.** The Share dialog and the calendar do not keep keyboard focus inside or return it when closed. | `src/app.js:276-280`, `:320` |

### F. Surveying capability compared with professional packages

| # | Sev | Finding |
|---|---|---|
| F1 | 🟠 | **Input is CSV only.** No total-station formats: Leica GSI and DBX exports, Trimble JobXML and DC, Sokkia SDR, Topcon, LandXML. No slope distance with zenith angle reduced to horizontal. No face-left/face-right rounds averaging. No instrument or target heights. No prism constant or atmospheric ppm. |
| F2 | 🟠 | **Few output formats.** Only CSV, PDF and KML (KML icons load over `http://`). No DXF for CAD, LandXML, GeoJSON or Excel. |
| F3 | 🟠 | **Levelling is basic.** The allowable is only 10 mm × √set-ups or a typed value: no C mm × √km orders, no distances in the level book, correction by set-up only. No two-peg collimation test. No import from digital levels. (`src/core.js:233-236`) |
| F4 | 🟡 | **No tolerance presets** for named standards (local authority specification, survey order or class). Precision is a single typed ratio. |
| F5 | 🟡 | **Only Qatar National Grid or a local grid.** The website already has an EPSG index that could provide others. No geoid, and no statement of which height datum is used. |
| F6 | 🟡 | **Metres and English only.** No US or international feet. No Arabic or right-to-left layout for the Qatar market. Dates are fixed to UK format and the weekend to Friday–Saturday (`src/app.js:34`). |
| F7 | 🟡 | **Jobs are a flat list.** No projects or sites, no reusable control-point library, no attached photos or sketches. |

### G. Reports

| # | Sev | Finding | Evidence |
|---|---|---|---|
| G1 | 🔴 | **Arabic and other non-Latin text prints as `?????`.** The PDF uses Helvetica and `pdfText` replaces every unsupported character with `?`. | `src/report.js:7-11`; exported PDF shows `????? ?????? ? Doha Corniche…` |
| G2 | 🟠 | **Long text overlaps or runs off the page.** A long project name runs into the Location column. Notes and key–value lines are not wrapped. | `src/report.js:25-29`, `:45-53`, `:244`; exported PDF |
| G3 | 🟠 | **No document control.** No report number, job ID, revision, software version, date and time of the calculation, or verification code. PDF title and author are empty. | `pdfinfo`: only `Producer: jsPDF` |
| G4 | 🟡 | **Branding is fixed to "SurveyX Digital".** No company logo or letterhead. A4 portrait only. | `src/report.js:19` |
| G5 | 🟡 | **The sketch is not to scale and is unlabelled.** No scale, grid ticks or misclosure arrow, so it cannot be checked against a drawing. | `src/report.js:101-142` |
| G6 | 🟡 | **Signatures are empty boxes.** There is no Prepared → Checked → Approved workflow, and an approved job is not locked. | `src/report.js:77-89` |

### H. Security and privacy

| # | Sev | Finding | Evidence |
|---|---|---|---|
| H1 | 🔴 | **CSV formula injection.** A point named `=HYPERLINK("http://evil.example","click")` is written to the CSV as is, and Excel runs it. | `src/util.js:71-72`; exported CSV line 3 |
| H2 | 🔴 | Same issue as A5: other people's jobs can be read offline on a shared PC. | — |
| H3 | 🟡 | Same issue as A6: the server trusts the result summary the browser sends. | — |

---

## 3. What "industry standard" means for this app

Every phase is measured against these targets:

1. **Never lose work.**
   - Ask before destructive actions, and offer undo.
   - Detect conflicts between devices.
   - Keep a revision history.
   - Warn when storage is close to full.
2. **Trustworthy output.** The server recomputes the verdict. Reports carry a report number,
   revision, software version and a verification code.
3. **Fast.** Typing stays under 16 ms per key at 500 rows. Calculation takes under 100 ms and
   runs off the main thread.
4. **A workspace, not a web page.**
   - A toolbar at the top and a project list on the left.
   - The input grid and tabbed results side by side.
   - A status bar that always shows Accepted or Rejected and the misclosure.
5. **One calm design system.** Neutral colours with one accent. Colour only for status. A fixed
   type scale with tabular numbers. A 4 px spacing grid. Three corner radii.
6. **Spreadsheet-grade grids.** Full keyboard use, a typed-angle preview, inline errors and undo.
7. **Accessible.** No axe violations at WCAG 2.1 AA, full keyboard use, dark mode with the same
   contrast.
8. **Field and office ready.**
   - Total-station import and CAD (DXF) and LandXML export.
   - Tolerance presets.
   - Metres or feet, English or Arabic.
9. **Engineered.**
   - TypeScript and tested modules.
   - CI on every push.
   - Built output never edited by hand.
   - Errors reported to a monitoring service.

---

## 4. Remediation plan in phases

Each phase has its tasks, what it delivers, and how to tell it is done.
Sizes: S ≈ 1–3 days, M ≈ 1–2 weeks, L ≈ 2–4 weeks for one developer.
Phases 0–2 come first and in order. Phases 3–7 can overlap once phase 2 is done.

### Phase 0 — Safety net (S, first)
Stop the bleeding and make every later change verifiable.
1. **Fix the build drift (B1).** Move `toolkit-selects.js` into `traverse-app/public/index.html`.
   Rebuild and confirm the build output matches what is deployed.
2. **Add CI (B2).** A GitHub Actions workflow on every push and pull request runs:
   - `npm test` (traverse-app)
   - `npm run build`, then fails if the committed `public/traverse/app` differs from the fresh build
   - the site's lint and type-check
   - the Playwright smoke test (`tests/ui_smoke.py`, or port it to JS)
3. **End-to-end tests** for the core flows:
   - register and log in
   - traverse in coordinates mode, and in field book mode
   - levelling
   - save, reopen, share
   - PDF, CSV and KML export
4. **Error monitoring.** Add global `error` / `unhandledrejection` handlers that send to the
   site's existing logging (or Sentry). Remove silent `.catch(() => {})`: log and show a toast.
5. **Quick wins:**
   - fix the filter ARIA (E1)
   - hide the developer banner text in production (C7)
   - fix the empty-state text (C8)
   - remove the duplicate `aria-current` line (B8)
   - neutralise CSV formula injection: prefix `= + - @` with `'` in text cells only (H1)

**Done when:** CI is green and required on `main`, a rebuild changes nothing, and axe reports
0 critical issues.

### Phase 1 — Data integrity and security (M)
1. **Ask, then allow undo, for destructive actions (A1, A2).**
   - Example, Import CSV, multi-row paste and New ask first when there are unsaved changes.
   - Row delete and import show "Undo" in the toast.
   - Add an undo/redo history on the working state (Ctrl+Z / Ctrl+Y, at least 50 steps).
2. **Versioned sync with conflict detection (A3).**
   - Add `revision` (integer) and a server `updatedAt` to `traverse_jobs`.
   - The client sends `baseRevision` with PUT. The server answers 409 if the job has moved on.
   - The client then shows a choice: keep mine as a copy, take theirs, or compare.
   - Stop trusting the client clock.
3. **Move device storage to IndexedDB (A4).**
   - One record per job, read and written per job (not the whole map every time).
   - Use `navigator.storage.persist()`.
   - Warn at 80% of the quota. Report a failed write instead of ignoring it.
4. **Logout and shared PCs (A5, H2).**
   - Logout deletes this user's jobs, working state and shared copies from the device, after
     warning about anything not yet uploaded.
   - Offline access only with a "Keep my jobs on this computer" option at login.
   - Offline sessions expire, for example after 14 days.
5. **Server-side verdict (A6, H3).** The server recomputes the summary from `data` (the engine is
   plain JS and can run in the API route) and ignores the browser's version.
6. **Revisions and recycle bin (A7).**
   - Every save stores a revision with who saved it and when.
   - Deleted jobs go to a 30-day bin.
   - Admin can see the audit trail.
7. **Schema discipline (A8, A9).**
   - Proper migrations for `traverse_jobs` and the new revision and bin tables.
   - Add `schemaVersion` to saved job data, with a tested migration function per version.

**Done when:**
- Simulated two-device edits produce a conflict prompt, not a silent overwrite.
- Logout leaves no `sx.jobs`, `sx.work` or `sx.shared` keys.
- A full-storage test shows a warning.
- Restoring a deleted job and an old revision works.

### Phase 2 — Architecture refactor (L)
Needed before the redesign, so the new UI is not built on string-concatenated HTML.
1. **TypeScript** for `src/` (start with `// @ts-check` and JSDoc if preferred). Add ESLint and
   Prettier to the app and to CI.
2. **Split into modules:**
   - `state/` (store, undo history, persistence)
   - `engine/` (core, fieldbook, levelling, qng; pure and unit-tested)
   - `io/` (csv, kml, future formats)
   - `report/`
   - `ui/` (components and views)
   - `sync/`
3. **A view layer** that updates only what changed: Preact + Signals, or lit-html (both small and
   offline-friendly). Remove `innerHTML` rebuilds and the document-wide event handlers.
4. **Calculation in a Web Worker**, debounced about 120 ms after typing stops. The UI shows "Computing…".
   Target: under 16 ms per keystroke at 500 rows (B3).
5. **Clean-up (B8):**
   - delete `SupabaseRemote`
   - replace the port-53817 hack with an explicit `APP_CONFIG.mode` set at build time
   - merge the duplicated validation of the two traverse engines into one input model
6. **Offline worker (B7).**
   - Hashed file names from esbuild.
   - Cache-first for hashed files.
   - An "Update ready — reload" message instead of `skipWaiting` mid-session.
7. **All UI text in one string catalogue** (prepares Phase 5).

**Done when:**
- No file is over about 400 lines and no line is over 140 characters.
- The type-check passes.
- The 500-row performance test meets its budget in CI.
- The current tests and the Phase 0 end-to-end tests are still green.

### Phase 3 — Design system and visual redesign (M–L)
1. **Design tokens:**
   - **Colour roles:** surface 0/1/2, border, text 1/2/3, accent (one brand navy-blue), success,
     warning, danger, info, plus a full dark theme. Gold becomes a small brand accent only
     (the logo), not buttons.
   - **Type:** one sans family (IBM Plex Sans is fine) with tabular figures (Plex Mono) for every
     number. Scale 12 / 13 / 14 / 16 / 20 / 24 px. No serif display face in the work screens.
   - **Spacing:** a 4 px grid (4, 8, 12, 16, 24, 32).
   - **Radii:** 4, 6 and 8 px only.
   - **Elevation:** 2 shadow levels.
2. **Remove decoration** from the work screens:
   - the seconds clock and calendar (a small date in the status bar is enough)
   - the gold flash on login
   - gradient buttons
   - the compass rose as a decorative empty-state graphic

   Keep the logo in the top-left.
3. **Component library**, documented on an internal "kitchen sink" page:
   - Button (primary, secondary, ghost, danger; sm/md)
   - Input with unit suffix, Select, Segmented control
   - Data grid, Table, Tabs, Badge (status), Toast with action, Dialog, Menu, Tooltip
   - Empty state, Skeleton loader
4. **An icon set** (Lucide or Phosphor, MIT licence) instead of the ✓ ! … – characters (C6).
5. **Restyle every screen** with the components. Remove all hard-coded colours and `!important`
   (C2).

**Done when:**
- `styles.css` uses only tokens: 0 hard-coded colours outside `:root`, at most 6 font sizes,
  3 radii.
- A visual-regression snapshot exists for every screen in light and dark.

### Phase 4 — Workspace UX (L)
1. **Application frame:**
   - **Top bar:** app name, project and job breadcrumb, save state, user menu.
   - **Toolbar:** New, Open, Save, Save as, Import, Export, Undo/Redo, Settings.
   - **Left panel:** projects and jobs.
   - **Main area:** input on the left, results on the right in tabs: Summary · Coordinates ·
     Plan · Angles · Least squares · Report preview.
   - **Status bar** (always visible): Accepted / Rejected badge, misclosure, precision, method,
     coordinate system, sync state.
2. **Spreadsheet-grade grids (D1, D3, D4):**
   - arrow, Tab and Enter navigation
   - insert above or below, select several rows, delete, drag to reorder, fill down
   - copy a block out to Excel
   - inline error tooltips on the cell
   - live DMS preview for typed angles
   - a "first row is a header" check and an X/Y axis question on import (D6)
3. **Interactive plan (C4):**
   - zoom and pan, fit to extent
   - scale bar and coordinate grid ticks
   - misclosure vector (scalable)
   - hover or select a point to highlight its row, and the other way round
   - label collision avoidance
   - optional background map (OpenStreetMap or a satellite layer) using the lat/lon the app
     already has for Qatar National Grid
4. **Separate report details** for each job (D5), with project-level defaults.
5. **Dashboard rebuilt around projects:**
   - a table of jobs with status, method, misclosure, precision, last edit and owner
   - sort, filter and search
   - bulk export
   - replaces the "Pass rate" and activity widgets (C9)
6. **Responsive (C5):**
   - Tablet: a two-pane layout.
   - Phone: a focused field-entry mode (one row card at a time, large number keypad), with
     results as a separate tab.
   - Tab bar in a menu.
   - No clipped tables (card view under 600 px).

**Done when:**
- All tasks in the Phase 0 end-to-end suite are done keyboard-only.
- A usability check with two surveyors: they enter a 10-leg field book, adjust it and export
  without help.
- The result is visible without scrolling at 1366×768.

### Phase 5 — Accessibility and internationalisation (M)
1. **Accessibility:**
   - fix every axe finding: contrast to AA, focusable scroll regions, `<h1>` per view,
     landmarks, table header text (E2–E4)
   - dialogs keep and return focus (E5)
   - visible focus on every control
   - screen-reader labels on grid cells ("Row 3, Easting")
2. **Arabic and right-to-left:** load the string catalogue for `ar`, use `dir="rtl"`, use logical
   CSS properties (`margin-inline` and so on). Numbers stay left-to-right in grids.
3. **Units and formats (F6):**
   - length in m, US survey ft or international ft
   - angles in DMS, decimal degrees or gons, for output as well as input
   - decimal places per quantity
   - number and date format by locale
   - weekend setting by locale
4. **Unicode PDF fonts (G1):** embed Noto Sans and Noto Naskh Arabic (subset) in jsPDF. Remove
   the `?` replacement in `pdfText`.

**Done when:**
- axe shows 0 violations on every screen in light and dark.
- A complete job in Arabic exports a correct PDF.
- A feet job round-trips through CSV.

### Phase 6 — Professional reports (M)
1. **Layout engine:** wrap all text (`splitTextToSize`) and give each field a fixed width (G2).
   A4 and A3, portrait and landscape.
2. **Document control block (G3):**
   - report number (`TL-<year>-<sequence>`), job ID and revision
   - prepared, checked and approved, each with name and date
   - software name and version, and the date and time of the calculation
   - a SHA-256 of the input data
   - a QR code linking to a verification page on exceltokml.com that shows the stored result for
     that hash
   - PDF title, author, subject and keywords set
3. **Branding (G4):** company name, logo and address set per account or organisation, printed on
   every page.
4. **Scaled plan (G5):**
   - true scale with a chosen ratio (1:500, 1:1000, …)
   - grid ticks with coordinates, scale bar, north arrow, misclosure vector
   - a legend
5. **Approval workflow (G6):**
   - status goes Draft → Checked → Approved
   - the checker and approver are account users and their sign-off is recorded
   - an approved job is locked; a change creates a new revision and resets approval
6. **Appendices:** raw observations, settings used (tolerances, sigmas, scale factor), warnings.

**Done when:**
- PDF snapshot tests cover long text and Arabic.
- A report can be verified from its QR code.
- An approved job cannot be edited without a new revision.

### Phase 7 — Surveying capability (L)
1. **Instrument import (F1):**
   - Leica GSI-8/16
   - Trimble JobXML
   - Sokkia SDR33
   - LandXML 1.2 (`<Survey>` observations)
   - generic CSV with column mapping saved per instrument template

   Reductions: slope distance and zenith to horizontal distance and height difference,
   instrument and target heights, prism constant, atmospheric ppm, averaging of face-left and
   face-right rounds with spread checks.
2. **Export (F2):**
   - DXF: points and blocks, the traverse polyline, labels, layers
   - LandXML, GeoJSON, XLSX
   - KML over HTTPS with styled icons
3. **Levelling (F3):**
   - allowable by C × √K (km) with presets
   - distances in the level book and correction by distance
   - two-peg collimation test
   - reciprocal levelling
   - import from Leica DNA / Trimble DiNi
4. **Tolerance presets (F4):** named specifications (for example the client's project
   specification, or FGCS-style classes) that set the precision, angular K, levelling C and the
   least-squares sigmas in one choice. Shown on the report.
5. **Coordinate systems (F5):** pick from the site's EPSG catalogue (proj4). Keep Qatar National
   Grid as the default. State the height datum on reports.
6. **Projects (F7):** projects or sites holding jobs, a control-point library shared across jobs,
   and attachments (sketch photo, field notes PDF).

**Done when:**
- Sample files from each supported instrument import, with reference tests against known results.
- A DXF opens correctly in AutoCAD and in Civil 3D.

### Phase 8 — Release quality (ongoing)
1. **Performance budgets in CI:**
   - first load under 1.5 s on 4G
   - `app.js` under 200 KB gzipped (load `pdf.js` only when exporting)
   - typing under 16 ms per key at 500 rows
2. **Visual regression** on every pull request. End-to-end tests on Chromium and WebKit.
3. **Release discipline:**
   - a changelog and an in-app "What's new" after each update
   - a version in the footer and in the report
   - the Windows program release tagged together with the site
4. **Monitoring:** an error-rate dashboard. Alert on spikes in sync conflicts or storage-quota
   errors.

---

## 5. Suggested order and first sprint

| Order | Phase | Why first |
|---|---|---|
| 1 | 0 Safety net | Without CI and a clean build, every later fix can be undone by the next build (B1). |
| 2 | 1 Data integrity | Lost or overwritten jobs, and other users' data on shared PCs, are the most serious risks. |
| 3 | 2 Architecture | The redesign needs components and a responsive engine; doing it on `tools.js` would double the work. |
| 4 | 3 + 5 Design system, accessibility | Done together so the new components start accessible. |
| 5 | 4 Workspace UX | Built from the new components. |
| 6 | 6 Reports | Can run alongside 4 (separate code). |
| 7 | 7 Survey capability | Feature growth once the base is solid. |
| — | 8 | Runs throughout. |

**Sprint 1 (about 1 week):**
- all of Phase 0
- Phase 1 items 1 and 4 (confirm and undo for destructive actions; clear device data at logout)
- the CSV injection fix

These remove the critical risks quickly while the larger work is planned.

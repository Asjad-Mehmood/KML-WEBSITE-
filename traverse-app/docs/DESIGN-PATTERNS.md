# Traverse & Level — design-pattern review and 3-phase redesign plan

**Focus:** how the app looks, how it is laid out, and how you move through it, compared with
professional survey and engineering software (Trimble Business Center, Leica Infinity,
Carlson Survey, Civil 3D, Bentley, and office tools like Excel and AutoCAD).

**Not covered:** survey maths and data-safety issues. Those are in `AUDIT-AND-ROADMAP.md`.

---

## 1. The core problem in one line

The app is built like a **marketing website with forms** (brochure fonts, greetings, big cards,
one long scrolling page). Professional tools are built like a **workspace**: you open a job,
the data and the result are side by side, the commands are in fixed places, and the screen
shows only what you need.

---

## 2. Pattern-by-pattern review

Each row shows what the app does now, what professional apps do, and the change.

### 2.1 Typography

| Now | Why it looks unprofessional | Professional pattern | Change |
|---|---|---|---|
| **Libre Caslon** (a book serif) for the app name, "Welcome back", "Good morning, …", dashboard numbers, dialog titles, the calendar | A serif display face reads as editorial or luxury. Engineering software uses a neutral sans everywhere. | One sans-serif UI family, used for everything | **Remove Libre Caslon from the app.** Use **Inter** for all text. Segoe UI also fits because the Windows program runs on Windows. |
| **IBM Plex Mono** for every number (coordinates, results tiles) | Monospace looks like code. Pro apps show numbers in the UI font with **tabular figures**, so digits line up without looking like code. | UI font with `font-variant-numeric: tabular-nums` | Numbers in Inter with tabular figures. Keep a mono font only for raw imported text. |
| **21 different font sizes** (11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15.5, 16, 16.5, 17, 18, 19, 20, 26, 28, 32, 34, 38 px and clamps) | No visual rhythm; each screen feels slightly different | A fixed type scale | **6 sizes:** 12 (captions, table headers), 13 (table cells, dense UI), 14 (body, inputs), 16 (panel titles), 20 (page titles), 24 (rare, start-screen headings) |
| **Uppercase letter-spaced labels everywhere** (POINT, EASTING, MISCLOSURE E, SAVED JOBS) | Shouty and brochure-like when used on every label | Sentence-case labels; uppercase only for small table group headers, if at all | Sentence case: "Easting", "Misclosure E" |
| **Bold weight 700 for many labels** | Too much emphasis competing | Weights 400 / 500 / 600 only | 400 body, 500 labels and buttons, 600 titles |

### 2.2 Colour and surface

| Now | Problem | Professional pattern | Change |
|---|---|---|---|
| Cream "paper" background `#f6f2e8`, ivory cards, gold borders | Warm parchment look, not a tool | Neutral grey/white surfaces, so data and status colours stand out | Background `#f5f6f8`, panels white, borders `#e3e6eb` (cool greys) |
| **Gold gradient** buttons (Save, Log in, New traverse), gold focus ring, gold compass rose | Gold says "premium consumer brand". Gradients and inner highlights are dated in tools. | One solid brand colour for the primary action; accents only for status | **Brand blue** (current navy `#1c3f6e` works) for primary actions and selection. Gold only in the logo. |
| Status colours mixed with brand colours (gold highlight tile for Precision, gold row values) | You can't tell what is status and what is decoration | Colour = meaning: green pass, red fail, amber warning, blue selection, grey neutral | Output coordinates in normal text with bold weight, not gold. Precision tile neutral, with a pass/fail badge. |
| Dark theme is navy with gold | OK as a theme, but it still carries the gold-decor problem | Neutral dark greys (`#16181d` / `#1e2128`) with the same blue accent | Rebuild the dark theme from the same tokens |

### 2.3 After login: where you land

| Now | Problem | Professional pattern | Change |
|---|---|---|---|
| Login always goes to the **Dashboard** (`src/app.js:117`): "Good morning, Asif", the date, 5 KPI tiles (Saved jobs, Pass rate, …), a 7-day activity chart | A surveyor logs in to **work on a job**. The dashboard is a greeting page with statistics nobody acts on, so every session starts with an extra click. | **Resume where you left off** (Excel, AutoCAD, TBC, VS Code reopen the last file or project). With nothing open, show a **Start screen** with recent work and "New". | **Login → reopen the last job, in the same tool and the same tab.** The first time (no job yet) → **Start screen**. |
| New users get the **example traverse pre-loaded** as their working data (`src/tools.js:527`) | Real work starts on top of sample data, mixed with a "this is an example" note | Empty workspace; samples are in Start/Help ("Open a sample") | Start empty. "Open a sample" lives on the Start screen and in Help. |
| Windows program (`?app=1`) also lands on the Dashboard | A desktop program should open like a desktop program | Opens to the last job or to the Start screen | Same rule as above |

**Start screen** (replaces the dashboard as the home page):
```
┌───────────────────────────────────────────────────────────────────────┐
│  New                                  Recent jobs              [Search]│
│  ▸ Traverse (coordinates)             Name        Type   Status  Edited│
│  ▸ Traverse (field book)              Al Khor TP1 Trav.  ● Acc.  2 h   │
│  ▸ Level run                          BM loop A   Level  ● Rej.  Yest. │
│  ▸ Import file…  (drop CSV here)      …                                │
│                                       Shared with me (3) ›             │
│  Learn: Open a sample · Simulator · User manual                        │
└───────────────────────────────────────────────────────────────────────┘
```
No greeting, no KPI tiles, no activity chart. Account statistics, if wanted, go on the account page.

### 2.4 App shell and navigation

| Now | Problem | Professional pattern | Change |
|---|---|---|---|
| Header with logo, a **ticking clock with seconds and a pop-up calendar** in the centre, theme button, Dashboard button, avatar | The clock takes the most prominent spot in the app and adds nothing to surveying. The calendar is a gadget. | Top bar = app, current job (breadcrumb), save state, account | **Remove the clock and calendar.** Centre of the top bar: `Projects / Al Khor TP loop 1 ▾` and "Saved · 2 min ago". |
| **Pill tabs**: Dashboard · Traverse · Levelling · **Simulator** | The training simulator sits next to production tools as an equal. Pill tabs are a mobile/marketing pattern. | Left **sidebar** with icons + labels: Home, Jobs, Traverse, Levelling; training under Help/Learn | Sidebar (collapsible to icons): Home · Jobs · (current job tools). **Simulator moves to Learn** (with samples and the manual). |
| Every action is a separate button scattered on the page (job bar at the top, Import/Add rows in each card, PDF/CSV/KML at the very bottom) | You scroll to find commands; their position changes as the page grows | **A fixed command bar** under the top bar, always in the same place | Command bar: **New ▾ · Open · Save · Duplicate · Import ▾ · Export ▾ (PDF, CSV, KML) · Undo · Redo · Job settings** |
| No status bar | You can't see the verdict while editing rows lower down | **Status bar** at the bottom (TBC, Civil 3D, Excel) | Status bar: ● Accepted · 1 : 62,105 · Linear 15.0 mm · Bowditch · QNG · Synced |

### 2.5 Screen layout of the tools

| Now | Problem | Professional pattern | Change |
|---|---|---|---|
| **One long page**: input cards stacked on the left, result stacked on the right, both scroll together. Phone: the result is ~3,000 px below. | Inputs and results scroll out of view of each other. Not a workspace. | **Fixed split view**: input pane and result pane, each scrolling on its own, resizable divider | Left pane: input. Right pane: result **tabs**. The page itself never scrolls; panes do. |
| **Numbered cards** "1 Known points · 2 Site coordinates · 3 Adjustment · 4 Coordinate system", gold number badges | A step-by-step wizard pattern for first-time consumers. Professionals don't need numbered steps and they waste height. | Compact titled sections, collapsible, or a **properties panel** | Section headers without numbers. Rarely changed settings (method, precision, grid, tolerances) go into a **Job settings** panel or dialog. |
| **Two big segmented bars** for Closed/Open and Site coordinates/Angles & distances, each full width | Big touch-style toggles take two rows of prime space for choices set once per job | Choose these **when the job is created** ("New traverse ▸ field book, closed"). Change them later in Job settings. | Move both choices into the New-job dialog and Job settings. Show them as a small chip in the pane header: "Closed · Field book". |
| **Method as radio cards** with paragraph descriptions (Bowditch / Transit / Equal / Least squares) | Onboarding-style explanation shown every time | A **drop-down** with a short tooltip ⓘ | `Adjustment: [Bowditch ▾] ⓘ` |
| **Report details** collapsible bar at the top of each tool, shared by both tools | Report metadata mixed into the work area | Belongs to the job (or project) **properties** | Job settings → Report tab (project, location, surveyor, checker, instrument), defaults from the project |
| Job bar: name text box, Save, Save as new, status text, **Example**, New | Example (training) sits beside Save (production). The name is a raw text field. | Job name in the title/breadcrumb, renamed in place. Save state as text. | Name in the breadcrumb (click to rename). "Example" leaves the job bar. "Save as new" → "Duplicate". |

### 2.6 Results

| Now | Problem | Professional pattern | Change |
|---|---|---|---|
| Large green or red **banner card** with a big tick, followed by 5–7 KPI tiles | Takes ~250 px. Tiles repeat what the banner says. | A **compact summary**: one status badge + a key-figures table, also shown in the status bar | Summary tab: badge "Accepted" + a 2-column key/value list (misclosure E/N, linear, precision vs required, angular, levels, method, grid) |
| All results (coordinates, plan, bearings, angles, side shots, least squares, exports) in one long column | Hard to find things; everything is always rendered | **Tabs**: Summary · Coordinates · Plan · Angles · Least squares · Report | Result pane with tabs. Each tab can grow large without affecting the others. |
| Output coordinates in **gold** text | Gold reads as decoration, not "final value" | Final values in normal ink, bold, or in a highlighted column | Bold column, no colour |
| Export buttons at the bottom of the result | Only visible after scrolling to the end | Export in the **command bar** | Export ▾ (PDF report, Coordinates CSV, Google Earth KML) |

### 2.7 Data grids

| Now | Problem | Professional pattern | Change |
|---|---|---|---|
| Inputs styled as cards inside table cells; rows 40–48 px tall | Consumer form look; low density (≈12 rows per screen) | Spreadsheet look: thin borders, 28–32 px rows, cell selection, row numbers | Grid component: 30 px rows, cell focus outline, row header, frozen header row |
| Only Enter moves down. Delete is a small × per row. "+ Add point" / "+ Side shot" / "Import CSV" buttons under the table. | Not how surveyors work in Excel or TBC | **Keyboard like a spreadsheet** and a **right-click menu** | Arrows, Tab, Enter; right-click: insert above/below, delete rows, convert to side shot, fill down, copy |
| Side shot = a `<select>` in every row | Clutter in every row | A row type icon or prefix, set by the menu or by typing "S" | A small type column with an icon, changed from the context menu |
| Error = red outline + message list elsewhere | You must match the message to the cell | Message at the cell (tooltip/hover) + a problems list that jumps to the cell | Inline tooltip + "Problems (2)" in the status bar |

### 2.8 Plan view

| Now | Professional pattern | Change |
|---|---|---|
| Small static 640×360 picture inside the result column | A real **plan/graphics view**: zoom, pan, fit, select, scale bar, grid, legend | Plan tab, full pane size, interactive. Click a point to select its row and back. Misclosure vector, scale bar, coordinate grid. |

### 2.9 Feedback and dialogs

| Now | Problem | Professional pattern | Change |
|---|---|---|---|
| A **toast for almost everything** ("Saved", "Pasted 7 rows", "Example loaded", "Closing point set…") | Constant pop-ups; important ones get lost | Quiet inline state ("Saved · just now"). Toasts only for background events and undoable actions ("Deleted 3 rows · Undo"). | Cut toasts by ~80%; add Undo actions. |
| Confirmations as a coloured bar inside the page | Easy to miss; inconsistent | A **modal dialog** for destructive actions, with the destructive button on the right in red | One Dialog component |
| **Gold flash** animation over the screen on login | Celebration effect unsuitable for a work tool | None | Remove |
| Status shown with characters ✓ ! … – | Inconsistent, font-dependent | One icon set (Lucide or Phosphor) | Icons in status badges, buttons and menus |

### 2.10 Login and account screens

| Now | Professional pattern | Change |
|---|---|---|
| Parchment background, compass rose, serif "Welcome back", gold Log in button, separate "Sign in with your browser" | Plain centred card on a neutral background, logo above, sans heading "Log in to Traverse & Level", primary blue button | Same structure, new tokens. Keep "Sign in with your browser" as a secondary link. |
| Demo-mode developer banner ("Add your Supabase keys in config.js") | Never show configuration text to users | Show only on localhost/dev builds |

### 2.11 Jobs list (old dashboard)

| Now | Professional pattern | Change |
|---|---|---|
| Job **cards** each with 4 buttons (Open · Share · Copy · Delete), KPI tiles, activity chart | A **table**: Name · Type · Status · Method · Precision · Project · Edited · Owner. Sortable columns, multi-select, row actions in a "⋯" menu, double-click to open. | Jobs page = table with filters (type, status, project) and bulk actions. "Shared with me" is a filter, not a separate box. |

### 2.12 Density and responsive patterns

| Now | Professional pattern | Change |
|---|---|---|
| Large padding (cards 20–24 px, inputs 40+ px) on desktop | Desktop density: 8–12 px padding, 32 px controls | A **density setting**: Comfortable (default on touch) and Compact (default on desktop and in the Windows program) |
| Phone = the desktop page squeezed; tabs cut off ("Simulat…"), tables clipped | Phone = a different layout: bottom tab bar, one pane at a time, row-by-row entry card | Phone: bottom nav (Input · Result · Plan), entry card per row with a big number keypad |

---

## 3. Design system to adopt

All new screens are built only from these tokens and components.

**Typography**
- Inter 400/500/600 for everything, with `tabular-nums` on all numbers.
- Sizes 12 / 13 / 14 / 16 / 20 / 24, line height 1.4 (1.25 for headings).

**Colour roles (light)**
- Background `#f5f6f8`; panels `#ffffff`; raised panels `#fafbfc`.
- Borders `#e3e6eb`.
- Text `#1b2330`; secondary text `#5b6577`; disabled text `#98a1b0`.
- Primary `#1c4f8c` (hover `#173f70`); selection `#e8f0fb`.
- Success `#1f7a4a`, danger `#b42318`, warning `#b4690e`, info `#2563a8`, each with a light tint.
- The dark theme mirrors the same roles.

**Spacing and shape**
- Spacing grid 4 · 8 · 12 · 16 · 24 · 32.
- Control heights 28 (compact) and 32 (default).
- Radii 4 (inputs, buttons), 6 (panels), 8 (dialogs).
- Shadows only on dialogs, menus and toasts.

**Components**
- Top bar, Sidebar, Command bar, Status bar, Split pane, Tabs
- Button (primary, secondary, ghost, danger), Icon button
- Input with unit suffix, Select, Checkbox, Radio, Toggle
- Data grid, Read-only table
- Badge (status), Toast (with action), Dialog, Menu / context menu, Tooltip
- Empty state, Skeleton

**Rules**
- One primary button per view.
- Colour only means status or selection.
- No gradients, no decorative graphics in work screens.
- The logo appears once, top-left.

---

## 4. The plan: 3 phases

### Phase 1 — Look and feel (fonts, colours, components)
Same screens and the same flow, but they stop looking like a brochure.

1. Replace fonts:
   - remove Libre Caslon
   - Inter everywhere
   - tabular numbers instead of Plex Mono for values
   - apply the 6-size type scale
   - sentence-case labels
2. Replace colours:
   - neutral backgrounds and borders
   - brand blue as the only primary colour
   - gold only in the logo
   - output coordinates in ink, not gold
   - status colours only for status
3. Build the base components from the tokens:
   - buttons (one primary per view; no gradients)
   - inputs, selects, badges
   - a dialog for confirmations
   - toast with action
   - an icon set (Lucide)
4. Remove the decoration:
   - header clock and calendar
   - gold flash on login
   - compass rose as background art
   - the developer banner (dev builds only)
5. Restyle the login/register screens and the dark theme from the new tokens.

**Done when:**
- No serif font anywhere in the app.
- `styles.css` has at most 6 font sizes, 3 radii and no hard-coded colours outside the tokens.
- Light and dark screenshots of every screen are approved.

### Phase 2 — App shell, navigation and entry flow
The app starts behaving like professional software.

1. **Landing after login:**
   - reopen the last job in the same tool and tab
   - first time → **Start screen**: New (Traverse coordinates / Traverse field book / Level run / Import), Recent jobs, Shared with me, Learn (samples, simulator, manual)
   - new accounts start empty, not with example data
2. **Shell:**
   - top bar with a job breadcrumb and save state
   - collapsible left **sidebar**: Home, Jobs, the open tool, Learn
   - **command bar**: New ▾, Open, Save, Duplicate, Import ▾, Export ▾, Undo, Redo, Job settings
   - **status bar**: verdict, precision, linear misclosure, method, grid, sync
3. **New-job dialog:** name, type (traverse/levelling), input (coordinates/field book), closed/open, project. These choices leave the work screen.
4. **Job settings panel:**
   - adjustment method (drop-down with ⓘ), precision, tolerances, σ values
   - coordinate system and scale factor
   - report details per job, with project defaults
5. **Jobs page** as a sortable, filterable table with a "⋯" row menu and bulk actions. "Shared with me" becomes a filter. KPI tiles and the activity chart are removed.
6. **Simulator** moves under Learn.

**Done when:**
- Login lands on the last job, or on the Start screen for a new user.
- Every command is reachable from the command bar or the keyboard.
- The verdict is always visible in the status bar.

### Phase 3 — Work screens: split view, grid, results, plan, mobile
The core of daily use.

1. **Split view:** input pane | result pane, independent scrolling, resizable, remembered per user.
2. **Spreadsheet grid:**
   - 30 px rows, cell focus outline, frozen header
   - arrows, Tab, Enter navigation
   - right-click menu: insert above/below, delete, side shot, fill down, copy
   - inline error tooltips and a "Problems" list in the status bar that jumps to the cell
   - live DMS preview while typing an angle
3. **Result tabs:**
   - **Summary** (badge + key figures)
   - **Coordinates**
   - **Plan**
   - **Angles**
   - **Least squares**
   - **Report** (preview of the PDF)
4. **Interactive plan:**
   - zoom, pan, fit
   - scale bar, coordinate grid, legend
   - misclosure vector
   - two-way selection between plan points and grid rows
5. **Density modes:** Compact (desktop, Windows program) and Comfortable (touch).
6. **Phone and tablet patterns:**
   - tablet: two panes
   - phone: bottom navigation (Input · Result · Plan), a row-entry card with a numeric keypad, tables become cards

**Done when:**
- At 1366×768 a 20-leg field book and its verdict are visible together with no page scroll.
- Every task works keyboard-only.
- The phone layout has no clipped tabs or tables.

---

## 5. Order of work

```
Phase 1 (look and feel) ──► Phase 2 (shell + landing flow) ──► Phase 3 (work screens)
```

Phase 1 changes no structure, so it can ship on its own and is the quickest visible improvement.
Phase 2 needs Phase 1's components. Phase 3 builds on the shell from Phase 2.

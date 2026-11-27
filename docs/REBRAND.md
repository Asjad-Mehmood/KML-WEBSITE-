# Rebrand: Excel to KML → SurveyX Digital

Status: **in progress** (decided 2026-11-27; see "Decided" below). Update the checklist below
as phases land, and keep this file the single source of truth for the rebrand.

## 1. The decision

- **Company / umbrella brand:** **SurveyX Digital** (spelt with a capital X and a space before
  "Digital"; the Traverse & Level installer already uses this as its Publisher).
- **Excel to KML stays a product name**, one of the company's tools, like Traverse & Level,
  Slope Calculator, Auto Drafting, RoadPro, Project Folder Manager and the Survey Toolkit.
- Pattern everywhere: "**Survey Toolkit** by SurveyX Digital", "**Excel to KML**, a SurveyX
  Digital tool", "© 2026 SurveyX Digital".
- **The domain stays exceltokml.com for now.** Its search ranking for "excel to kml" and
  "convert excel to kml" brings most visitors; moving it is Phase 6 and optional.

### Decided (owner, 2026-11-27)
- **Domain: www.surveyxdigital.com.** The website moves there. exceltokml.com becomes a separate
  "we've moved" site (its own repository, made by the owner) that sends every page to the same page
  on surveyxdigital.com. It must keep forwarding `/api/*` and the web-app paths (`/app`,
  `/traverse/app`, `/slope-calculation/app`, `/get/toolkit`, `/api/toolkit/*`) to the new site,
  because every installed program still talks to `www.exceltokml.com` until its next version.
- **Copyright and owner: SurveyX Digital** (© 2026 SurveyX Digital) in the website and every program.
- **Excel to KML is only the name of one program**; the company, the account, the emails and the
  publisher are SurveyX Digital. Excel to KML's own pages and search pages keep "| Excel to KML".
- **Logo: the owner sends the file.** Until then the site keeps the current icon.
- Account and support emails stay as they are (`admin@exceltokml.com` is the admin account's
  identity: never change it); the sender name in `MAIL_FROM` becomes "SurveyX Digital".

### Still to decide (ask the owner before starting each)
- [ ] The logo: owner's file, or one designed here (navy `#071a44` + yellow `#ffd21f`, a mark
      built from a survey crosshair/"X")
- [x] The new domain: surveyxdigital.com (bought)
- [ ] The support/sender email for mail (e.g. `hello@surveyxdigital.com` or keep `@exceltokml.com`)
- [x] The legal owner name in copyrights: SurveyX Digital

## 2. Rules that must not break

1. **Never change** install folders, registry keys, uninstall key names, app IDs, update
   feeds, GitHub repo names or release asset file names. The Survey Toolkit detects programs by
   their uninstall **key** (`lib/src/toolkit/detect.dart`) and updates them by asset name; old
   installs must keep updating. Examples to leave as they are: `$LOCALAPPDATA\TraversePro`,
   `Software\ExcelToKMLPro`, `SurveyToolkit-Setup.exe`, `ExcelToKML-Setup.exe`.
   Only **display** text changes (Publisher, CompanyName, window titles, About text).
2. **Keep every SEO page's title and copy about "Excel to KML"** (`/excel-to-kml`, `/convert/*`,
   `/tools/*`, guides). Change only the brand around them (header, footer, "by …", Organization
   structured data).
3. **Cookie names, localStorage keys, env var names, API paths stay** (`surveyor_auth_token`,
   `kml_*`, `/api/*`): renaming them signs everyone out and breaks the apps in the field.
4. **The apps are released by the owner**; repos other than the website change only through
   their own PRs, merged on "Merge". No tags or releases from here.
5. Each phase is its own PR, merged only on "Merge", checked in a browser with screenshots.

## 3. Where the old name is today (inventory, 2026-11-23)

| Place | Size | Notes |
|---|---|---|
| Website (`app`, `components`, `lib`, `context`, `public`) | ~137 files, ~268 mentions | many are product mentions that stay |
| Survey Toolkit (Flutter) | ~48 files | `lib/src/brand.dart`, Runner.rc `CompanyName "Excel to KML"`, installer Publisher "Excel to KML" |
| Excel to KML (Go lite + web app, `kml-convertor-src`) | ~35 files | product keeps its name; Publisher/Company only |
| Traverse & Level (`Traiverse`) | ~8 files | Publisher already "SurveyX Digital" |
| Slope Calculator, Auto Drafting, Project Folder Manager, RoadPro | to inventory | CompanyName/Publisher, About screens |
| Emails (`lib/mailer.ts`, `*Email.ts`) | sender name via `MAIL_FROM` env | Vercel env var, not code |
| Images (`public/assets`) | icon.png, favicon.ico, apple-touch-icon, icon-192/512, og-image.png | the site's mark |

Re-run the inventory before each phase:
`grep -rlI "Excel to KML" app components lib context public | wc -l` (website) and the same in
each app repo.

## 4. The plan, phase by phase

### Phase 0: Brand kit (no user-visible change)
- Logo mark + wordmark "SurveyX Digital" as SVG (light and dark), app-icon versions (16 … 512 px,
  .ico), favicon, Apple touch icon, OG image template (1200×630).
- One source for the name and links: `lib/brand.ts` (website) with `COMPANY = "SurveyX Digital"`,
  `COMPANY_SHORT = "SurveyX"`, tagline, support email, social links. Every later change reads
  from it, so a future rename is one line.
- Brand guide section in this file: colours (navy `#071a44`, yellow `#ffd21f`, blue `#0071e3`),
  font, logo spacing, "by SurveyX Digital" usage.
- Survey Toolkit: the same in `lib/src/brand.dart` (it already has `appTagline`, `websiteUrl`).

### Phase 1: Website brand layer (exceltokml.com stays)
- **Header** (`components/Navbar.tsx`): the SurveyX Digital mark + name; products stay in the menu.
- **Footer** (`components/Footer.tsx`): "© 2026 SurveyX Digital", "Excel to KML is a SurveyX
  Digital tool", company links (About, Contact, Privacy, Terms).
- **Root metadata** (`app/layout.tsx`, `lib/site.ts`): `siteName` and title template
  `"%s · SurveyX Digital"` for company pages; product pages keep "… | Excel to KML" where SEO wants it.
- **Structured data**: `Organization` = SurveyX Digital (name, logo, url, sameAs); every
  `SoftwareApplication` gets `publisher: SurveyX Digital`. Keep product names.
- **Icons/manifest**: favicon, `public/site.webmanifest` (`name: "SurveyX Digital"`,
  `short_name`), apple-touch-icon, OG image (`public/assets/og-image.png`) with "SurveyX Digital".
- **Sign-in / sign-up / welcome** (`app/signin`, `app/signup`, `components/ToolkitInvite.tsx`,
  `AuthCard`): logo, "Secure sign-in · SurveyX Digital", "Create your SurveyX Digital account",
  "One account for every SurveyX Digital tool".
- **Dashboard / admin**: header name, "Your programs" copy; admin title.
- **About page** (`app/about`): the company story; "Formerly Excel to KML" line for a while.
- **Legal** (`app/privacy`, `app/terms`): the company name as the operator (owner to confirm the
  legal entity wording).
- **Cookie/consent, 404, maintenance, offline pages**: name and logo.
- **Announcement**: a one-time site notice "Excel to KML is now part of SurveyX Digital" (Admin →
  Settings announcement, linking to the About page).
- Check: no product SEO title loses "Excel to KML"; `grep` list reviewed line by line.

### Phase 2: Emails
- `MAIL_FROM` in Vercel: `"SurveyX Digital <hello@…>"` (env var, owner sets it).
- Email templates (`lib/mailer.ts` layout, `downloadEmail`, `releaseEmail`, `resetEmail`,
  `reviewEmail`, `letterEmail`, `emailVerify`, `adminOtp`, contact replies): header logo, footer
  "SurveyX Digital", sign-off "The SurveyX Digital team", subjects like
  "Your SurveyX Digital sign-in code". Product names in release emails stay.
- Unsubscribe page and list footer: company name.

### Phase 3: Survey Toolkit
- `lib/src/brand.dart`: company name, "by SurveyX Digital" under the title, About/Settings.
- Sign-in screen: "Sign in with your SurveyX Digital account" (same account as the website).
- Start splash (`windows/runner/start_splash.cpp`): small "by SurveyX Digital" line.
- `windows/runner/Runner.rc`: `CompanyName "SurveyX Digital"`, LegalCopyright.
- Installer (`installer/installer.nsi`): `Publisher "SurveyX Digital"`; Start-menu folder name
  stays (or add a new one only with a migration that removes the old shortcut).
- Screenshots on the website refresh after it ships (`test/shots_test.dart`).
- Release: owner publishes the version (e.g. 1.2.0); release notes mention the new name.

### Phase 4: The other Windows programs (each its own PR in its repo)
- Excel to KML (`kml-convertor-src`): `lite/versioninfo.json` CompanyName, installer Publisher,
  About text, splash "by SurveyX Digital", web app footer (`app/index.html`).
- Traverse & Level (`Traiverse`): versioninfo CompanyName (Publisher already done), About text.
- Slope Calculator, Auto Drafting, Project Folder Manager: Runner.rc CompanyName, installer
  Publisher, About/Settings text, splash line.
- RoadPro (`Road-pro`): plugin's About/ribbon tooltip, installer Publisher.
- Owner publishes each release; the Toolkit shows them as updates as usual.

### Phase 5: Outside the code (owner)
- Domain(s) bought; email domain set up (SPF/DKIM/DMARC) if mail moves.
- GitHub: organisation/profile display name and README badges (repo names stay).
- Google: Search Console property for any new domain; Google Cloud OAuth consent screen app
  name and logo ("SurveyX Digital"); Business Profile if any.
- Social profiles, YouTube, app store listings (if any), Microsoft Store (MSIX) publisher name.
- Code signing certificate in the company name (also ends the SmartScreen warning).

### Phase 6 (optional, later): new domain
- Only once the brand has been live for a while and the domain is ready.
- Sub-addresses first (low SEO risk): `auth.`, `account.`, `admin.` on the new domain
  (`NEXT_PUBLIC_AUTH_HOST`, `NEXT_PUBLIC_DASHBOARD_HOST`, `ADMIN_HOST`), Google OAuth redirect
  URIs updated.
- The main site last: page-by-page 301 redirects from exceltokml.com (never a blanket redirect
  to the home page), canonical URLs, sitemap, Search Console "Change of address", keep
  exceltokml.com renewed forever. The apps' API base (`www.exceltokml.com`) keeps working by
  answering on both domains; new app versions switch their base afterwards.

## 5. How to check each phase
- Website: `tsc`, eslint, `next build`; Playwright screenshots of home, a product page, sign-in,
  sign-up, welcome, dashboard, admin, 404, at phone and desktop width, light and dark.
- `view-source` of a product page: title still has "Excel to KML"; JSON-LD Organization is
  SurveyX Digital.
- Emails: send each template to a test inbox (or render previews in Admin → Releases).
- Apps: Windows CI build; the installer's Add/Remove Programs entry shows "SurveyX Digital";
  the Toolkit still detects and updates an old install of each program.

## 6. Progress
- [ ] Phase 0 Brand kit
- [~] Phase 1 Website brand layer (text, titles, legal, structured data done; logo waits for the file)
- [~] Phase 2 Emails (templates done; owner sets MAIL_FROM)
- [ ] Phase 3 Survey Toolkit
- [ ] Phase 4 Other programs (Excel to KML · Traverse · Slope · Auto Drafting · Folder Manager · RoadPro)
- [ ] Phase 5 Outside the code (owner)
- [ ] Phase 6 New domain (optional)

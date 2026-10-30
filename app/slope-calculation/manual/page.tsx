import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BookOpen, Download, FileSpreadsheet, FileText } from "lucide-react";
import PageShell from "../../../components/PageShell";
import { SLOPE_APP, SLOPE_FILES, SLOPE_PAGE, SLOPE_VERSION } from "@/lib/slope";
import { openGraphFor } from "@/lib/site";

// The Slope Calculator user manual. scripts/slope-manual-pdf.mjs prints this page to
// public/slope-calculation/Slope-Calculator-User-Manual.pdf; the screenshots come from the app's
// e2e/manual_shots.mjs.

const TITLE = "Slope Calculator user manual";
const DESCRIPTION =
  "How to use Slope Calculator: sign in, enter levels and chainages, read the slope, gradient and chainage levels, fill the project plate, export Excel, PDF and CSV, crossfall, the digital level run, the optical trainer, saved calculations and offline use, with worked examples.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: SLOPE_FILES.manual.href },
  openGraph: openGraphFor(SLOPE_FILES.manual.href, `${TITLE} | Excel to KML`, DESCRIPTION),
};

const SECTIONS = [
  ["start", "1. Getting started"],
  ["calculator", "2. The calculator"],
  ["levels", "3. Chainage levels and the profile"],
  ["plate", "4. The project plate"],
  ["export", "5. Reports: Excel, PDF, CSV and print"],
  ["crossfall", "6. Crossfall"],
  ["level", "7. Digital level run"],
  ["trainer", "8. Optical level trainer"],
  ["saved", "9. Saved calculations and working offline"],
  ["settings", "10. Settings"],
  ["examples", "11. Worked examples"],
  ["template", "12. The Excel template"],
  ["help", "13. Questions and fixes"],
] as const;

function Shot({ name, alt, wide = true }: { name: string; alt: string; wide?: boolean }) {
  const phone = name.includes("phone");
  return (
    <figure className={`my-5 break-inside-avoid ${phone ? "max-w-[260px]" : wide ? "" : "max-w-[720px]"}`}>
      <Image
        src={`/slope-calculation/manual/${name}.webp`}
        alt={alt}
        width={phone ? 780 : 1440}
        height={phone ? 1688 : 900}
        sizes={phone ? "260px" : "(min-width: 1000px) 920px, 100vw"}
        className="w-full h-auto rounded-xl border border-slate-200 shadow-sm"
      />
      <figcaption className="mt-1.5 text-[12.5px] text-slate-500">{alt}</figcaption>
    </figure>
  );
}

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-28 mt-14 text-[24px] font-extrabold tracking-tight text-slate-900 break-after-avoid print:mt-8">
      {children}
    </h2>
  );
}

function Table({ head, rows, right = [] }: { head: string[]; rows: (string | number)[][]; right?: number[] }) {
  return (
    <div className="my-4 overflow-x-auto print:overflow-visible rounded-xl border border-slate-200 break-inside-avoid">
      <table className="w-full text-[13px] print:text-[10px] [&_td]:print:px-1.5 [&_th]:print:px-1.5">
        <thead className="bg-slate-50 text-[11.5px] uppercase tracking-wide text-slate-500">
          <tr>
            {head.map((h, i) => (
              <th key={h + i} className={`px-3 py-2 font-bold ${right.includes(i) ? "text-right" : "text-left"}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 font-mono">
          {rows.map((r, ri) => (
            <tr key={ri}>
              {r.map((c, ci) => (
                <td key={ci} className={`px-3 py-1.5 ${right.includes(ci) ? "text-right" : ""} ${ci === 0 ? "font-sans font-semibold text-slate-800" : "text-slate-700"}`}>{c}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const Note = ({ children }: { children: React.ReactNode }) => (
  <p className="my-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[14.5px] text-amber-950 break-inside-avoid">{children}</p>
);

export default function SlopeManualPage() {
  return (
    <PageShell>
      <article className="manual max-w-[960px] mx-auto px-5 sm:px-8 text-[15.5px] leading-relaxed text-slate-700 [&_p]:my-3 [&_li]:my-1">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-slate-500 mb-5 print:hidden">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#1e4fd8]">Home</Link></li>
            <li aria-hidden>/</li>
            <li><Link href={SLOPE_PAGE} className="hover:text-[#1e4fd8]">Slope Calculator</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">User manual</li>
          </ol>
        </nav>

        {/* cover */}
        <header className="rounded-3xl bg-[#071a44] text-white px-6 sm:px-10 py-9 break-after-page">
          <div className="flex items-center gap-4">
            <Image src={SLOPE_FILES.icon} alt="" width={64} height={64} className="rounded-2xl" />
            <div>
              <p className="text-[13px] font-bold uppercase tracking-wider text-[#ffd21f]">User manual · version {SLOPE_VERSION}</p>
              <h1 className="text-[34px] sm:text-[42px] font-black leading-tight">Slope Calculator</h1>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-blue-50/90">
            Slope, gradient and the level at every chainage, with crossfall, a digital level run, an optical level trainer and professional reports. For
            surveyors and site engineers, in the browser and on Windows. By Excel to KML.
          </p>
          <div className="mt-6 flex flex-wrap gap-3 print:hidden">
            <a href={SLOPE_FILES.manual.pdf} download={SLOPE_FILES.manual.pdfName} className="inline-flex items-center gap-2 rounded-full bg-[#ffd21f] px-5 py-2.5 text-[15px] font-extrabold text-[#071a44] hover:bg-[#ffdc4d]">
              <FileText className="w-4 h-4" aria-hidden /> Download as PDF
            </a>
            <Link href={SLOPE_APP} prefetch={false} className="inline-flex items-center gap-2 rounded-full border-2 border-white/40 px-5 py-2.5 text-[15px] font-bold hover:bg-white/10">
              Open the app
            </Link>
          </div>
          <nav aria-label="Contents" className="mt-8">
            <p className="text-[12px] font-bold uppercase tracking-wider text-blue-200">Contents</p>
            <ol className="mt-2 grid sm:grid-cols-2 gap-x-8 gap-y-1 text-[14.5px]">
              {SECTIONS.map(([id, t]) => (
                <li key={id}><a href={`#${id}`} className="hover:text-[#ffd21f]">{t}</a></li>
              ))}
            </ol>
          </nav>
        </header>

        <H2 id="start">1. Getting started</H2>
        <p>
          Slope Calculator is the same app in two forms: the <strong>web app</strong> at{" "}
          <Link href={SLOPE_APP} prefetch={false} className="text-[#1e4fd8] underline">exceltokml.com{SLOPE_APP}</Link>, which runs in Chrome, Edge, Firefox or
          Safari on a computer or a phone, and the <strong>Windows program</strong> for Windows 10 and 11.
        </p>
        <ul className="list-disc pl-6">
          <li><strong>Web app:</strong> open the address. To use it like an app, choose Install (Chrome, Edge) or Add to Home Screen (Safari).</li>
          <li>
            <strong>Windows:</strong> download <code>SlopeCalculator-Setup.exe</code> from <Link href={SLOPE_PAGE} className="text-[#1e4fd8] underline">the product page</Link> and
            open it. It installs for you alone, needs no administrator rights, and adds Start menu and desktop shortcuts. If Windows SmartScreen says it
            protected your PC, choose <em>More info</em>, then <em>Run anyway</em>. Uninstall it from Settings → Apps.
          </li>
          <li><strong>Updates:</strong> the Windows program looks for a new version a few seconds after it opens and offers to install it. The web app is always the newest.</li>
        </ul>
        <h3 className="mt-6 font-bold text-slate-900">Signing in</h3>
        <p>
          The app opens on the sign-in. Use your free <strong>Excel to KML account</strong>, the same one as exceltokml.com and Traverse &amp; Level, or create one:
        </p>
        <ul className="list-disc pl-6">
          <li><strong>Sign in</strong> with your email and password.</li>
          <li><strong>Create an account</strong> with your name, email and a password of at least 8 characters. We email a 6-digit code; type it in to confirm the email.</li>
          <li><strong>Sign in with the browser (Google):</strong> your browser opens at exceltokml.com with a code. Sign in there (Google works) and confirm the code; the app signs in by itself.</li>
          <li><strong>Forgot the password?</strong> Type your email first, then press it: a link to set a new one is emailed.</li>
        </ul>
        <p>After the first sign-in the app remembers you on that device and opens straight away, offline too, until you sign out. In the browser, if you are already signed in on exceltokml.com, the web app opens directly.</p>
        <Note>The first sign-in needs an internet connection. After that the app works offline; signing out on a device means signing in again, online, before using it there.</Note>
        <Shot name="01-sign-in" alt="The sign-in: email and password, Create an account, or Sign in with the browser for Google." wide={false} />

        <H2 id="calculator">2. The calculator</H2>
        <p>The calculator is the first page. Type four values in <em>Enter your data</em>; the results follow as you type.</p>
        <Table
          head={["Box", "What to type"]}
          rows={[
            ["Y1 Start level", "Level at the start, in metres (102.500)"],
            ["Y2 End level", "Level at the end, in metres (98.750)"],
            ["X1 Start chainage", "1000, 1000.5, 1+000 or 1+000.500; negative chainages work too"],
            ["X2 End chainage", "The same formats; it must be further along than X1"],
            ["Chainage interval", "Pick 5, 10, 20, 25, 50 or 100 m, or type any interval"],
            ["Decimals", "1 to 5 places for levels in the tables and reports"],
          ]}
        />
        <p>Press <strong>Enter</strong> to move to the next box. <strong>Load example</strong> fills in the Excel template&apos;s example; <strong>Clear</strong> empties the boxes. The app remembers what you typed.</p>
        <h3 className="mt-6 font-bold text-slate-900">Results</h3>
        <Table
          head={["Result", "How it is worked out"]}
          rows={[
            ["ΔH rise / fall", "Y2 − Y1"],
            ["Length ΔX", "X2 − X1"],
            ["Slope per metre M", "ΔH ÷ ΔX"],
            ["Slope %", "M × 100"],
            ["Gradient", "1 in 1 ÷ |M|"],
            ["Direction", "Rising, falling or level, from Y1 to Y2"],
          ]}
        />
        <p>A sentence under the results says it in words, for example <em>The ground falls 3.750 m over 250.000 m, a gradient of about 1 in 66.7 (−1.500 %)</em>. <strong>Copy</strong> puts the results on the clipboard. If something can&apos;t be worked out (an empty box, X2 not further than X1, an interval of 0, or so many stations that a larger interval is needed) the app says what to fix instead of showing results.</p>
        <Shot name="02-calculator" alt="The calculator: the four inputs, interval and decimals on the left; slope, rise, length and gradient on the right, with the profile." />

        <H2 id="levels">3. Chainage levels and the profile</H2>
        <p>
          The <strong>profile</strong> draws the line from Y1 to Y2 with every station. Drag the <strong>probe</strong> under it to read the level at any chainage between the
          ends. The <strong>Chainage levels</strong> table lists every station with its distance from the start, its level and the change from the start; type a chainage
          in <em>Go to chainage</em> to find it.
        </p>
        <p>Stations come <strong>on round chainages</strong> (from 1+013 every 20 m: 1+013, 1+020, 1+040 …) or <strong>counted from the start</strong> (1+013, 1+033, 1+053 …); choose in Settings. The start and the end are always stations.</p>
        <Shot name="03-chainage-levels" alt="The probe at 1+125.000 reads 100.625 m; the chainage levels table with Go to chainage." />

        <H2 id="plate">4. The project plate</H2>
        <p>
          <strong>Project plate</strong> (at the top of the calculator) holds the details printed at the top of every report: project, client, contractor, contract
          number, location, work package, drawing number, revision, drawing title, scale, zone, area, work date, prepared by, checked by and remarks. Fill in only what
          your job needs and press <strong>Save</strong>. The button then shows the project&apos;s name and how many details are filled in.
        </p>
        <Shot name="04-project-plate" alt="The project plate with the project, client, drawing number, revision and prepared by filled in." />

        <H2 id="export">5. Reports: Excel, PDF, CSV and print</H2>
        <p>Press <strong>Export</strong> at the top of the calculator:</p>
        <ul className="list-disc pl-6">
          <li>
            <strong>Excel report (.xlsx)</strong> with six sheets: Project Plate, Slope Summary, Chainage Levels, Crossfall, Level Book (after a digital level run) and a
            QA / QC checklist. Numbers are stored as numbers, so you can work with them in Excel.
          </li>
          <li><strong>PDF report</strong>: A4 with the project plate, the results, the profile, the chainage levels and sign-off boxes.</li>
          <li><strong>Print</strong>: the same report, to a printer.</li>
          <li><strong>Chainage levels (.csv)</strong>; the level book has its own CSV button on the Level page.</li>
        </ul>
        <p>On Windows you choose where to save; in the browser the file is downloaded. File names start with the project name when the plate has one, and end with the date.</p>
        <Shot name="05-export" alt="Export: Excel report, PDF report, Print and Chainage levels (.csv)." />

        <H2 id="crossfall">6. Crossfall</H2>
        <p>
          Enter the <strong>centreline level</strong>, and for each side the <strong>crossfall %</strong>, the <strong>offset</strong> from the centreline and whether it{" "}
          <strong>falls away</strong> or <strong>rises away</strong>. The left and right levels and their differences from the centreline follow, with the cross-section
          drawn. Level = CL ± offset × crossfall % ÷ 100.
        </p>
        <Shot name="06-crossfall" alt="Crossfall: centreline 10.000 m, left 2 % and right 2.5 % falling away over 3.5 m: 9.930 m and 9.912 m." />

        <H2 id="level">7. Digital level run</H2>
        <p>
          <strong>Level → Digital level</strong> shows a level run along your slope with a digital level and a barcode staff, from the start (the benchmark, Y1) to the end.
          Press <strong>Start the run</strong> to watch it, <strong>Step</strong> for one reading at a time, <strong>Reset</strong> to start again or{" "}
          <strong>New run</strong> for new readings. The instrument&apos;s display shows each reading, its distance and the reduced level, and each reading is booked in the{" "}
          <strong>level book</strong> as it is taken.
        </p>
        <ul className="list-disc pl-6">
          <li>Setups keep every sight within the <strong>max sight</strong>, and readings stay on a 4 m staff: on a steep slope extra change points are added.</li>
          <li><strong>Options:</strong> max sight, reading noise (mm), collimation error (mm per 100 m), speed, and booking by <strong>Height of Instrument</strong> or <strong>Rise &amp; Fall</strong>.</li>
          <li>
            <strong>Checks:</strong> the arithmetic check (ΣBS − ΣFS = last RL − first RL, and ΣRise − ΣFall for Rise &amp; Fall), the closing error against the end level,
            and the allowable misclosure C√K mm (K the length in km, C in Settings). The closing error is spread over the setups for the adjusted levels.
          </li>
          <li>Export the level book as CSV here; the Excel report includes it.</li>
        </ul>
        <Shot name="07-digital-level" alt="A digital level run: setup 2 of 3, an intermediate sight of 1.1501 m at 1+120, booked by Height of Instrument." />

        <H2 id="trainer">8. Optical level trainer</H2>
        <p>
          <strong>Level → Optical trainer</strong> shows the view through an optical level onto an E-pattern staff. <strong>Watch</strong> reads it for you; in{" "}
          <strong>Practise</strong> you type your reading and the app says whether it is within 2 mm. Each E is 5 cm tall and stands on its decimetre; the number beside it
          is that decimetre, with dots for the metres; count the centimetres up to the horizontal hair and estimate the millimetres.
        </p>
        <Shot name="08-optical-trainer" alt="The optical trainer: the staff through the telescope reading 1.624 m, and how to read an E-pattern staff." />

        <H2 id="saved">9. Saved calculations and working offline</H2>
        <p>
          <strong>Saved</strong> keeps calculations in your account: <strong>Save the current calculation</strong> stores the inputs, the settings and the project plate under
          a name. <strong>Open</strong> brings one back into the calculator on any device, the Windows program, the web app or a phone; the bin deletes it everywhere.
        </p>
        <p>
          <strong>Offline:</strong> a calculation saved or deleted without a connection waits on the device, marked <em>Waiting to send</em>, and is sent the next time the app
          reaches exceltokml.com (or press <strong>Send now</strong>). The list from the last time you were online is kept, so it shows offline too.
        </p>
        <Shot name="09-saved" alt="Saved calculations: your account with Sign out, and two calculations with their slope, chainages, stations and date." />

        <H2 id="settings">10. Settings</H2>
        <ul className="list-disc pl-6">
          <li><strong>Theme:</strong> follow the computer, or always light or dark (also the moon / sun button at the top).</li>
          <li>
            <strong>Text size:</strong> 85 % to 130 % (also A− / A+ at the top), on top of your computer&apos;s or phone&apos;s own text size (Windows: Settings →
            Accessibility → Text size).
          </li>
          <li><strong>Stations:</strong> on round chainages, or counted from the start.</li>
          <li><strong>Decimals</strong> and <strong>interval</strong> a new calculation starts with.</li>
          <li><strong>Allowable misclosure:</strong> C in C√K mm for the level run (12 is common for ordinary levelling).</li>
        </ul>
        <div className="grid sm:grid-cols-[1fr_auto] gap-6 items-start">
          <Shot name="11-dark" alt="Dark mode." />
          <Shot name="12-phone" alt="On a phone: the menu moves to the bottom." />
        </div>

        <H2 id="examples">11. Worked examples</H2>
        <p>Check these by hand or against your own spreadsheet; each is also an automatic test of the app.</p>
        <h3 className="mt-6 font-bold text-slate-900">Example 1: slope and chainage levels</h3>
        <p>Y1 = 102.500 m, Y2 = 98.750 m, X1 = 1+000, X2 = 1+250, interval 20 m. ΔH = −3.750 m, ΔX = 250.000 m, M = −0.01500, slope −1.500 %, gradient 1 in 66.7, 14 stations.</p>
        <Table
          head={["Chainage", "Distance (m)", "Level (m)", "Change (m)"]}
          right={[1, 2, 3]}
          rows={[
            ["1+000", "0.000", "102.500", "0.000"],
            ["1+020", "20.000", "102.200", "−0.300"],
            ["1+040", "40.000", "101.900", "−0.600"],
            ["1+060", "60.000", "101.600", "−0.900"],
            ["1+080", "80.000", "101.300", "−1.200"],
            ["1+100", "100.000", "101.000", "−1.500"],
            ["1+120", "120.000", "100.700", "−1.800"],
            ["…", "", "", ""],
            ["1+240", "240.000", "98.900", "−3.600"],
            ["1+250.000", "250.000", "98.750", "−3.750"],
          ]}
        />
        <h3 className="mt-6 font-bold text-slate-900">Example 2: the Excel template&apos;s example</h3>
        <p>Y1 = 1.900 m, Y2 = 0.600 m, X1 = 0+000, X2 = 0+379.290, interval 20 m. ΔH = −1.300 m, slope −0.343 %, gradient 1 in 291.8, 20 stations; the level at 0+360 is 0.666 m and the last station is 0+379.290 at 0.600 m.</p>
        <h3 className="mt-6 font-bold text-slate-900">Example 3: crossfall</h3>
        <Table
          head={["Side", "Crossfall", "Offset", "Direction", "Level", "Difference"]}
          right={[1, 2, 4, 5]}
          rows={[
            ["Left", "2.0 %", "3.500 m", "falls away", "9.9300 m", "−0.0700 m"],
            ["Right", "2.5 %", "3.500 m", "falls away", "9.9125 m", "−0.0875 m"],
          ]}
        />
        <p>Centreline 10.000 m.</p>
        <h3 className="mt-6 font-bold text-slate-900">Example 4: a level book by Height of Instrument and Rise &amp; Fall</h3>
        <p>Opening benchmark 100.000 m, closing on a known 99.700 m, 100 m of levelling.</p>
        <Table
          head={["Line", "BS", "IS", "FS", "HI", "Rise", "Fall", "RL", "Adjusted RL", "Remark"]}
          right={[1, 2, 3, 4, 5, 6, 7, 8]}
          rows={[
            ["1", "1.585", "", "", "101.585", "", "", "100.000", "100.0000", "BM"],
            ["2", "", "1.950", "", "", "", "0.365", "99.635", "99.6325", ""],
            ["3", "0.875", "", "2.105", "100.355", "", "0.155", "99.480", "99.4775", "CP"],
            ["4", "", "1.225", "", "", "", "0.350", "99.130", "99.1250", ""],
            ["5", "", "", "0.650", "", "0.575", "", "99.705", "99.7000", ""],
          ]}
        />
        <ul className="list-disc pl-6">
          <li>ΣBS − ΣFS = 2.460 − 2.755 = −0.295; last RL − first RL = −0.295 ✓</li>
          <li>ΣRise − ΣFall = 0.575 − 0.870 = −0.295 ✓</li>
          <li>Closing error +5.0 mm against an allowable 12√K = 3.8 mm: outside tolerance. Spread equally over the 2 setups for the adjusted levels.</li>
        </ul>

        <H2 id="template">12. The Excel template</H2>
        <p>
          For working in Excel without the app, the{" "}
          <a href={SLOPE_FILES.template.href} download={SLOPE_FILES.template.name} className="text-[#1e4fd8] underline">Slope Calculator Excel template</a> does the same
          calculation in formulas. Type the levels, chainages and interval in the yellow cells; the results, every station on round chainages (up to 501) with its level,
          and the crossfall follow. It has the project plate too. It gives the same numbers as the app, as in the examples above.
        </p>

        <H2 id="help">13. Questions and fixes</H2>
        <dl className="space-y-4">
          {[
            ["Windows says it protected my PC", "The program isn't code-signed yet. Choose More info, then Run anyway. It comes from github.com/Asjad-Mehmood/Slope-calculator- and the product page shows its SHA-256."],
            ["The email code didn't arrive", "Look in Spam or Junk, then press Send a new code. Codes are valid for a short time; the newest one counts."],
            ["The app says it can't reach exceltokml.com", "You are offline or the connection is blocked. The calculator, reports and tools keep working once you have signed in; saving waits and is sent later."],
            ["I want my calculations on another device", "Save them under Saved, then sign in with the same account on the other device and open them."],
            ["The text is too small or too large", "Use A− / A+ at the top or Settings → Text size; the app also follows your computer's or phone's text size."],
            ["How do I uninstall it?", "Windows Settings → Apps → Slope Calculator → Uninstall. Your account and saved calculations stay on exceltokml.com."],
          ].map(([q, a]) => (
            <div key={q} className="break-inside-avoid">
              <dt className="font-bold text-slate-900">{q}</dt>
              <dd>{a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-[13.5px] text-slate-500">
          Questions or ideas? <Link href="/contact?topic=question&program=slope" className="text-[#1e4fd8] underline">Write to us</Link>. Slope Calculator {SLOPE_VERSION} · ©
          2026 Excel to KML.
        </p>

        <div className="mt-10 flex flex-wrap gap-3 print:hidden">
          <a href={SLOPE_FILES.manual.pdf} download={SLOPE_FILES.manual.pdfName} className="inline-flex items-center gap-2 rounded-xl bg-[#0071e3] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0077ed]">
            <Download className="w-4 h-4" aria-hidden /> This manual as PDF
          </a>
          <a href={SLOPE_FILES.template.href} download={SLOPE_FILES.template.name} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <FileSpreadsheet className="w-4 h-4" aria-hidden /> Excel template
          </a>
          <Link href={SLOPE_PAGE} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <BookOpen className="w-4 h-4" aria-hidden /> Back to Slope Calculator
          </Link>
        </div>
      </article>
    </PageShell>
  );
}

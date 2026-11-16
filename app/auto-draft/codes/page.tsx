import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import PageShell from "../../../components/PageShell";
import PageIntro from "../../../components/PageIntro";
import { BreadcrumbStructuredData } from "../../../components/StructuredData";
import {
  ACI_SWATCH,
  AUTO_DRAFT_CODES_PAGE,
  AUTO_DRAFT_CONTROLS,
  AUTO_DRAFT_EXAMPLE,
  AUTO_DRAFT_FILES,
  AUTO_DRAFT_LINE_CODES,
  AUTO_DRAFT_PAGE,
  AUTO_DRAFT_POINT_CODES,
  type AutoDraftCode,
} from "@/lib/autoDraft";
import { openGraphFor } from "@/lib/site";

const TITLE = "Auto Drafting code guide: field codes for survey drawings";
const DESCRIPTION =
  "How to code a topographic survey for Auto Drafting: line codes and numbers (RE1, WL2), the control words ST, END, CLS, RECT, ARC and EARC, and every line and point code with its layer, colour, line type, symbol and how it is used for contours.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: AUTO_DRAFT_CODES_PAGE },
  openGraph: openGraphFor(AUTO_DRAFT_CODES_PAGE, `${TITLE} | Excel to KML`, DESCRIPTION),
};

const CONTOURS: Record<AutoDraftCode["contours"], { label: string; cls: string }> = {
  breakline: { label: "Breakline", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  "points used": { label: "Points used", cls: "bg-slate-50 text-slate-600 border-slate-200" },
  "left out": { label: "Left out", cls: "bg-rose-50 text-rose-700 border-rose-200" },
};

function H2({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <h2 id={id} className="scroll-mt-28 mt-14 text-[22px] sm:text-[26px] font-extrabold tracking-tight text-slate-900">
      {children}
    </h2>
  );
}

const Code = ({ children }: { children: React.ReactNode }) => (
  <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.92em] font-bold text-[#1e4fd8]">{children}</code>
);

function CodeTable({ caption, codes, look }: { caption: string; codes: AutoDraftCode[]; look: string }) {
  return (
    <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
      <table className="w-full min-w-[640px] text-left text-[14px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-slate-50 text-[12px] uppercase tracking-wide text-slate-500">
          <tr>
            <th scope="col" className="px-4 py-3 font-bold">Code</th>
            <th scope="col" className="px-4 py-3 font-bold">Feature</th>
            <th scope="col" className="px-4 py-3 font-bold">Layer</th>
            <th scope="col" className="px-4 py-3 font-bold">Colour</th>
            <th scope="col" className="px-4 py-3 font-bold">{look}</th>
            <th scope="col" className="px-4 py-3 font-bold">Contours</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {codes.map((c) => (
            <tr key={c.code}>
              <th scope="row" className="px-4 py-2.5 font-mono font-extrabold text-[#1e4fd8]">{c.code}</th>
              <td className="px-4 py-2.5 text-slate-800">{c.name}</td>
              <td className="px-4 py-2.5 font-mono text-[12.5px] text-slate-600">{c.layer}</td>
              <td className="px-4 py-2.5">
                <span className="inline-flex items-center gap-2 font-mono text-[12.5px] text-slate-600">
                  <span aria-hidden className="h-3.5 w-3.5 rounded-sm border border-slate-400 bg-[#0b1220] p-[2px]">
                    <span className="block h-full w-full rounded-[1px]" style={{ background: ACI_SWATCH[c.color] ?? "#ffffff" }} />
                  </span>
                  {c.color}
                </span>
              </td>
              <td className="px-4 py-2.5 text-slate-600">{c.look}</td>
              <td className="px-4 py-2.5">
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[12px] font-semibold ${CONTOURS[c.contours].cls}`}>{CONTOURS[c.contours].label}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const TOC = [
  ["lines", "Lines and their number"],
  ["controls", "Control words"],
  ["example", "A worked example"],
  ["line-codes", "Line codes"],
  ["point-codes", "Point codes"],
  ["contours", "Codes and contours"],
  ["own", "Your own codes"],
] as const;

export default function AutoDraftCodesPage() {
  return (
    <PageShell>
      <BreadcrumbStructuredData name="Auto Drafting code guide" path={AUTO_DRAFT_CODES_PAGE} />
      <div className="max-w-[960px] mx-auto px-5 sm:px-8 mb-20">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-slate-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-[#1e4fd8]">Home</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={AUTO_DRAFT_PAGE} className="hover:text-[#1e4fd8]">Auto Drafting</Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">Code guide</li>
          </ol>
        </nav>
        <PageIntro
          eyebrow="Auto Drafting"
          title="Field code guide"
          lead="Type the code in the total station's code field as you survey. Auto Drafting reads it and draws the line, the symbol and the level. Upper or lower case; words are separated by spaces (commas, semicolons and slashes work too)."
        />

        <nav aria-label="On this page" className="mt-8 rounded-2xl border border-slate-200 bg-[#fafbfc] p-5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-slate-500">On this page</p>
          <ol className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-[14.5px]">
            {TOC.map(([id, t], i) => (
              <li key={id}>
                <a href={`#${id}`} className="text-[#1e4fd8] hover:underline">
                  {i + 1}. {t}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <H2 id="lines">1. Lines and their number</H2>
        <div className="mt-3 space-y-3 text-[15.5px] leading-relaxed text-slate-700">
          <p>
            Points with the same <strong>line code and number</strong> are joined into one line, in the order they were surveyed: <Code>RE1</Code> is road edge 1,{" "}
            <Code>RE2</Code> road edge 2. A code without a number (<Code>RE</Code>) is line 0.
          </p>
          <p>
            Lines can be surveyed mixed together: <Code>RE1</Code>, <Code>RE2</Code>, <Code>RE1</Code>, <Code>RE2</Code>… still makes two lines, so you can walk
            down a road taking both edges as you go.
          </p>
          <p>
            A point can be on two lines: <Code>WL1 GT1</Code> is on wall 1 and gate 1. A word that is neither a code nor a control word is kept as a remark:{" "}
            <Code>TR NEEM</Code> is a tree, and NEEM is kept as a remark. Remarks are listed under Problems, so a mistyped code is never missed.
          </p>
        </div>

        <H2 id="controls">2. Control words</H2>
        <p className="mt-3 text-[15.5px] text-slate-700">Written after the code they steer.</p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[560px] text-left text-[14.5px]">
            <thead className="bg-slate-50 text-[12px] uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Word</th>
                <th scope="col" className="px-4 py-3 font-bold">Example</th>
                <th scope="col" className="px-4 py-3 font-bold">What it does</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {AUTO_DRAFT_CONTROLS.map((c) => (
                <tr key={c.word}>
                  <th scope="row" className="px-4 py-3 font-mono font-extrabold text-[#1e4fd8] whitespace-nowrap">
                    {c.word}
                    {c.also && <span className="block font-sans text-[12px] font-medium text-slate-500">or {c.also}</span>}
                  </th>
                  <td className="px-4 py-3 font-mono whitespace-nowrap">{c.example}</td>
                  <td className="px-4 py-3 text-slate-700">{c.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[15px] text-slate-700">
          Curves: three points make a circular arc; more points make a smooth curve through every one. A rectangle needs only three corners in order; the fourth is
          added opposite the second and the shape closed.
        </p>

        <H2 id="example">3. A worked example</H2>
        <p className="mt-3 text-[15.5px] text-slate-700">What a surveyor types, point by point, and what Auto Drafting draws from it.</p>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-slate-200">
          <table className="w-full min-w-[480px] text-left text-[14.5px]">
            <thead className="bg-slate-50 text-[12px] uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-3 font-bold">Point</th>
                <th scope="col" className="px-4 py-3 font-bold">Code typed</th>
                <th scope="col" className="px-4 py-3 font-bold">What it draws</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {AUTO_DRAFT_EXAMPLE.map((r) => (
                <tr key={r.point}>
                  <td className="px-4 py-2.5 font-mono text-slate-500">{r.point}</td>
                  <th scope="row" className="px-4 py-2.5 font-mono font-extrabold text-[#1e4fd8] whitespace-nowrap">{r.code}</th>
                  <td className="px-4 py-2.5 text-slate-700">{r.means}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-[15px] text-slate-700">
          The{" "}
          <a href={AUTO_DRAFT_FILES.sample.href} download={AUTO_DRAFT_FILES.sample.name} className="inline-flex items-center gap-1 font-semibold text-[#1e4fd8] hover:underline">
            sample survey <Download className="w-3.5 h-3.5" aria-hidden />
          </a>{" "}
          is a whole plot coded this way (roads with curves, a walled plot with a gate, buildings closed and squared, trees and poles): open it in Auto Drafting to see the drawing it makes.
        </p>

        <H2 id="line-codes">4. Line codes</H2>
        <p className="mt-3 text-[15.5px] text-slate-700">Each line code joins its points into a line on its own layer.</p>
        <CodeTable caption="Line codes" codes={AUTO_DRAFT_LINE_CODES} look="Line type" />

        <H2 id="point-codes">5. Point codes</H2>
        <p className="mt-3 text-[15.5px] text-slate-700">Each point code places a symbol, sized for the drawing&apos;s scale, with the level beside it.</p>
        <CodeTable caption="Point codes" codes={AUTO_DRAFT_POINT_CODES} look="Symbol" />
        <p className="mt-4 text-[14.5px] text-slate-600">
          Other layers: <Code>POINTS</Code> (a point at every survey point, at its level), <Code>LEVELS</Code> (level text), <Code>POINT_NUMBERS</Code> and{" "}
          <Code>POINT_CODES</Code> (when switched on in the settings) and <Code>UNKNOWN_CODES</Code> (points whose code isn&apos;t in the list). Colours are AutoCAD
          colour numbers: 1 red, 2 yellow, 3 green, 4 cyan, 5 blue, 6 magenta, 7 white or black, 8 grey.
        </p>

        <H2 id="contours">6. Codes and contours</H2>
        <ul className="mt-3 space-y-2 text-[15.5px] text-slate-700">
          <li>
            <span className={`mr-2 inline-block rounded-full border px-2 py-0.5 text-[12px] font-semibold ${CONTOURS.breakline.cls}`}>Breakline</span>
            The ground changes along the line (road edge, bank, drain): contours bend at it instead of cutting across.
          </li>
          <li>
            <span className={`mr-2 inline-block rounded-full border px-2 py-0.5 text-[12px] font-semibold ${CONTOURS["points used"].cls}`}>Points used</span>
            Its points are on the ground and shape the surface.
          </li>
          <li>
            <span className={`mr-2 inline-block rounded-full border px-2 py-0.5 text-[12px] font-semibold ${CONTOURS["left out"].cls}`}>Left out</span>
            Not on the ground (roofs, overhead wires, pipes), so never in the surface.
          </li>
        </ul>
        <p className="mt-3 text-[15px] text-slate-700">Both choices can be changed for any code in the code editor.</p>

        <H2 id="own">7. Your own codes</H2>
        <div className="mt-3 space-y-3 text-[15.5px] leading-relaxed text-slate-700">
          <p>
            Every office codes a little differently. In Auto Drafting&apos;s <strong>Codes</strong> tab you can rename a code, add your own or delete one, and choose its
            layer, colour, line type, symbol and whether it is a breakline.
          </p>
          <p>
            <strong>Save this list</strong> writes it to a file (codes.json). Send it to the team and they <strong>Load a code list</strong>, so every
            surveyor&apos;s drawings come out the same. A code in the file that isn&apos;t in the list shows up in Problems with a one-click fix.
          </p>
        </div>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link href={AUTO_DRAFT_PAGE} className="inline-flex items-center gap-2 rounded-full bg-[#071a44] px-6 py-3 text-[15px] font-bold text-white hover:bg-[#0b2459]">
            Get Auto Drafting <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
          <a
            href={AUTO_DRAFT_FILES.sample.href}
            download={AUTO_DRAFT_FILES.sample.name}
            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-300 px-6 py-3 text-[15px] font-bold text-slate-800 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" aria-hidden /> Sample survey (CSV)
          </a>
        </div>
      </div>
    </PageShell>
  );
}

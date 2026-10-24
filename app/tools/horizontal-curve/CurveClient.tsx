"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card, CopyButton, Field, ResultRow } from "@/components/tools/ui";
import { ShareButton, useShared } from "@/components/tools/share";
import { fmt, formatChainage, formatDms, horizontalCurve, parseChainage, parseDms, parseNumber } from "@/lib/toolMath";

const f3 = (v: number) => v.toFixed(3);

// Simple circular curve: the elements from radius and deflection angle, and a setting-out table
// by tangential angles from TC with offsets from the tangent
export default function CurveClient() {
  const get = useShared();
  const [r, setR] = useState(() => get("r", "300"));
  const [delta, setDelta] = useState(() => get("d", `35°24'30"`));
  const [pi, setPi] = useState(() => get("pi", "1+245.600"));
  const [step, setStep] = useState(() => get("s", "20"));

  const R = parseNumber(r);
  const D = parseDms(delta);
  const PI = parseChainage(pi);
  const S = parseNumber(step);
  const res = R !== null && D !== null && PI !== null && S !== null ? horizontalCurve(R, D, PI, S) : null;

  const table = res
    ? [
        ["Chainage", "Arc from TC", "Deflection", "Chord from last peg", "Chord from TC", "Along tangent", "Off tangent"].join("\t"),
        ...res.pegs.map((p) => [formatChainage(p.ch), f3(p.arc), formatDms(p.deflection, undefined, 1), f3(p.subChord), f3(p.chordFromTC), f3(p.x), f3(p.y)].join("\t")),
      ].join("\n")
    : "";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card title="The curve">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Radius (m)" value={r} onChange={setR} error={r.trim() && (R === null || R <= 0) ? "A radius above 0" : null} />
            <Field
              label="Deflection angle Δ"
              value={delta}
              onChange={setDelta}
              mono
              error={delta.trim() && (D === null || D <= 0 || D >= 180) ? "An angle between 0° and 180°" : null}
              hint={`e.g. 35°24'30" or 35.4083`}
            />
            <Field label="Chainage of the intersection point (IP)" value={pi} onChange={setPi} error={pi.trim() && PI === null ? "e.g. 1+245.600 or 1245.6" : null} />
            <Field label="Peg interval (m)" value={step} onChange={setStep} error={step.trim() && (S === null || S <= 0) ? "Above 0" : null} hint="Pegs on whole chainages" />
          </div>
        </Card>
        <Card title="Curve elements">
          {res ? (
            <div>
              <ResultRow label="Tangent length T" value={f3(res.T)} big />
              <ResultRow label="Curve length L" value={f3(res.L)} />
              <ResultRow label="Long chord C" value={f3(res.C)} />
              <ResultRow label="External distance E" value={f3(res.E)} />
              <ResultRow label="Mid-ordinate M" value={f3(res.M)} />
              <ResultRow label="Chainage of TC" value={formatChainage(res.chTC)} />
              <ResultRow label="Chainage of CT" value={formatChainage(res.chCT)} />
              <div className="mt-3">
                <ShareButton title="Horizontal curve" params={{ r: r.trim(), d: delta.trim(), pi: pi.trim(), s: step.trim() }} />
              </div>
            </div>
          ) : (
            <p className="text-[14px] text-slate-500">Type the radius, the deflection angle and the chainage of the intersection point.</p>
          )}
        </Card>
      </div>

      {res && (
        <Card title={`Setting out from TC: ${res.pegs.length} pegs`}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <p className="text-[13px] text-slate-600">
              Set up on TC, sight along the tangent towards IP, turn each deflection angle and measure the chord from the last peg. The
              offsets from the tangent are a check from the tangent line.
            </p>
            <CopyButton text={table} label="Copy table" />
          </div>
          <div className="overflow-x-auto -mx-1">
            <table className="w-full min-w-[640px] text-[13px] font-mono">
              <thead>
                <tr className="text-left text-[11.5px] font-sans font-bold uppercase tracking-wider text-slate-500">
                  {["Chainage", "Arc from TC", "Deflection", "Chord from last", "Chord from TC", "Along tangent", "Off tangent"].map((h) => (
                    <th key={h} className="px-2 py-2 border-b border-slate-200 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {res.pegs.map((p, i) => (
                  <tr key={p.ch} className={i === res.pegs.length - 1 ? "font-semibold" : ""}>
                    <td className="px-2 py-1.5 border-b border-slate-100 whitespace-nowrap">
                      {formatChainage(p.ch)}
                      {i === res.pegs.length - 1 && <span className="ml-1.5 font-sans text-[11px] text-slate-500">CT</span>}
                    </td>
                    <td className="px-2 py-1.5 border-b border-slate-100">{f3(p.arc)}</td>
                    <td className="px-2 py-1.5 border-b border-slate-100 whitespace-nowrap">{formatDms(p.deflection, undefined, 1)}</td>
                    <td className="px-2 py-1.5 border-b border-slate-100">{f3(p.subChord)}</td>
                    <td className="px-2 py-1.5 border-b border-slate-100">{f3(p.chordFromTC)}</td>
                    <td className="px-2 py-1.5 border-b border-slate-100">{f3(p.x)}</td>
                    <td className="px-2 py-1.5 border-b border-slate-100">{f3(p.y)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-[12.5px] text-slate-500">
            The last deflection is always half of Δ ({formatDms(D! / 2, undefined, 1)}): a quick check that the curve closes. Radius {fmt(R!, 3)} m.
          </p>
        </Card>
      )}

      <p className="text-[13px] text-slate-600">
        Drawing the road itself? <Link href="/roadpro" className="text-[#0071e3] font-semibold hover:underline">RoadPro</Link> fillets
        every bend in AutoCAD, labels the TC, CT and curve data, and lists the setting-out coordinates of the centre line and both edges.
      </p>
    </div>
  );
}

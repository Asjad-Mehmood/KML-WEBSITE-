"use client";

import React, { useState } from "react";
import { Card, Field, ResultRow, Tabs } from "@/components/tools/ui";
import { fmt, parseNumber, slopeFromDegrees, slopeFromOneIn, slopeFromPercent, slopeFromRiseRun, type Slope } from "@/lib/toolMath";

type Mode = "riseRun" | "levels" | "convert";

export default function SlopeClient() {
  const [mode, setMode] = useState<Mode>("riseRun");
  return (
    <div className="space-y-5">
      <Tabs
        label="Work out"
        value={mode}
        onChange={setMode}
        options={[
          { value: "riseRun", label: "Rise and run" },
          { value: "levels", label: "Two levels and a distance" },
          { value: "convert", label: "Convert a slope" },
        ]}
      />
      {mode === "riseRun" ? <RiseRun /> : mode === "levels" ? <Levels /> : <Convert />}
    </div>
  );
}

function SlopeResult({ s, run }: { s: Slope | null; run?: number }) {
  if (!s) return <p className="text-[14px] text-slate-500">Type the values to see the slope.</p>;
  const dir = s.percent > 0 ? "rising" : s.percent < 0 ? "falling" : "level";
  return (
    <div>
      <ResultRow label="Percent (grade)" value={`${fmt(s.percent, 3)} %`} big />
      <ResultRow label="Degrees" value={`${fmt(s.degrees, 4)}°`} />
      <ResultRow label="1 in N" value={Number.isFinite(s.oneIn) ? `1 in ${fmt(s.oneIn, 2)}` : "level (1 in ∞)"} />
      {run !== undefined && <ResultRow label="Slope length" value={fmt(Math.hypot(run, (s.percent / 100) * run), 3)} />}
      <p className="mt-3 text-[12.5px] text-slate-500">The slope is {dir}.</p>
    </div>
  );
}

function RiseRun() {
  const [rise, setRise] = useState("1.5");
  const [run, setRun] = useState("60");
  const R = parseNumber(rise), N = parseNumber(run);
  const ok = R !== null && N !== null && N > 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Rise and run">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Rise (height change)" value={rise} onChange={setRise} error={rise.trim() && R === null ? "Not a number" : null} hint="Negative for a fall" />
          <Field label="Run (horizontal distance)" value={run} onChange={setRun} error={run.trim() && (N === null || N <= 0) ? "A distance above 0" : null} hint="Same unit as the rise" />
        </div>
      </Card>
      <Card title="Slope"><SlopeResult s={ok ? slopeFromRiseRun(R, N) : null} run={ok ? N : undefined} /></Card>
    </div>
  );
}

function Levels() {
  const [a, setA] = useState("45.260");
  const [b, setB] = useState("44.810");
  const [d, setD] = useState("30");
  const A = parseNumber(a), B = parseNumber(b), D = parseNumber(d);
  const ok = A !== null && B !== null && D !== null && D > 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Two levels">
        <div className="grid grid-cols-3 gap-3">
          <Field label="Level at start" value={a} onChange={setA} error={a.trim() && A === null ? "Not a number" : null} />
          <Field label="Level at end" value={b} onChange={setB} error={b.trim() && B === null ? "Not a number" : null} />
          <Field label="Distance between" value={d} onChange={setD} error={d.trim() && (D === null || D <= 0) ? "Above 0" : null} />
        </div>
        {ok && <p className="mt-3 text-[13px] text-slate-600">Change in level: <span className="font-mono font-semibold">{fmt(B - A, 3)}</span></p>}
      </Card>
      <Card title="Slope"><SlopeResult s={ok ? slopeFromRiseRun(B - A, D) : null} run={ok ? D : undefined} /></Card>
    </div>
  );
}

function Convert() {
  const [pct, setPct] = useState("2");
  const [dg, setDg] = useState("");
  const [n, setN] = useState("");
  const [last, setLast] = useState<"pct" | "deg" | "n">("pct");
  const P = parseNumber(pct), G = parseNumber(dg), O = parseNumber(n);
  const s =
    last === "pct" && P !== null ? slopeFromPercent(P)
    : last === "deg" && G !== null && Math.abs(G) < 90 ? slopeFromDegrees(G)
    : last === "n" && O !== null && O !== 0 ? slopeFromOneIn(O)
    : null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Card title="Type any one">
        <div className="space-y-3">
          <Field label="Percent" value={pct} onChange={(v) => { setPct(v); setLast("pct"); }} />
          <Field label="Degrees" value={dg} onChange={(v) => { setDg(v); setLast("deg"); }} error={last === "deg" && G !== null && Math.abs(G) >= 90 ? "Less than 90°" : null} />
          <Field label="1 in N" value={n} onChange={(v) => { setN(v); setLast("n"); }} hint="e.g. 12 for 1 in 12" />
        </div>
      </Card>
      <Card title="Slope"><SlopeResult s={s} /></Card>
    </div>
  );
}

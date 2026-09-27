"use client";

import React, { useState } from "react";
import { Card, Choice, CopyButton, Field } from "./ui";
import { convertUnit, parseNumber, type Unit } from "@/lib/toolMath";

/** Type a value in one unit and see it in every other unit of the list. */
export default function UnitConverter({ units, start, value: startValue }: { units: Unit[]; start: string; value: string }) {
  const [value, setValue] = useState(startValue);
  const [from, setFrom] = useState(start);
  const v = parseNumber(value);
  const src = units.find((u) => u.id === from)!;
  const show = (x: number) => {
    const a = Math.abs(x);
    if (a !== 0 && (a < 1e-4 || a >= 1e12)) return x.toExponential(6);
    return x.toLocaleString("en-US", { maximumFractionDigits: a >= 100 ? 4 : 6 });
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 items-start">
      <Card title="Convert">
        <div className="space-y-3">
          <Field label="Value" value={value} onChange={setValue} error={value.trim() && v === null ? "Not a number" : null} />
          <Choice label="From" value={from} onChange={setFrom} options={units.map((u) => ({ value: u.id, label: u.name }))} />
          {src.note && <p className="text-[12.5px] text-slate-500">{src.note}</p>}
        </div>
      </Card>
      <Card title={v !== null ? `${v.toLocaleString("en-US", { maximumFractionDigits: 8 })} ${src.name} is` : "Results"}>
        {v !== null ? (
          <ul className="divide-y divide-slate-100">
            {units.filter((u) => u.id !== from).map((u) => {
              const out = show(convertUnit(v, src, u));
              return (
                <li key={u.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0">
                    <span className="block text-[14px] text-slate-800">{u.name}</span>
                    {u.note && <span className="block text-[12px] text-slate-500 leading-snug">{u.note}</span>}
                  </span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <span className="font-mono text-[15px] font-semibold text-slate-900">{out}</span>
                    <CopyButton text={out.replace(/,/g, "")} />
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-[14px] text-slate-500">Type a number to convert.</p>
        )}
      </Card>
    </div>
  );
}

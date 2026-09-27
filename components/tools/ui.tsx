"use client";

import React, { useId, useState } from "react";
import { Check, Copy } from "lucide-react";

/* Small building blocks shared by the tools, so they all look and behave the same. */

export function Card({ title, children, className = "" }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${className}`}>
      {title && <h2 className="text-[15px] font-bold text-slate-900 mb-4">{title}</h2>}
      {children}
    </div>
  );
}

export const inputCls =
  "w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-[15px] font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white";

/** A labelled text box. `error` shows under it and marks it. */
export function Field({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  inputMode = "decimal",
  mono = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string | null;
  hint?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  mono?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-bold text-slate-600 mb-1.5">{label}</label>
      <input
        id={id}
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        spellCheck={false}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error || hint ? `${id}-note` : undefined}
        className={`${inputCls} ${mono ? "" : "font-sans"} ${error ? "border-red-300 focus:ring-red-400" : ""}`}
      />
      {(error || hint) && (
        <p id={`${id}-note`} className={`mt-1 text-[12px] ${error ? "text-red-600" : "text-slate-500"}`}>{error || hint}</p>
      )}
    </div>
  );
}

/** A labelled drop-down list. */
export function Choice<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="block text-[12px] font-bold text-slate-600 mb-1.5">{label}</label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`${inputCls} font-sans`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

/** Two or more buttons that pick one mode. */
export function Tabs<T extends string>({ value, onChange, options, label }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; label: string }) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3.5 py-1.5 rounded-lg text-[13px] font-semibold cursor-pointer ${
            value === o.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A copy button for one value. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          // clipboard blocked: nothing to do, the value is on screen to select
        }
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[12px] font-semibold text-slate-500 hover:text-[#0071e3] hover:bg-slate-100 cursor-pointer"
      aria-label={`${label}: ${text}`}
    >
      {done ? <Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden /> : <Copy className="w-3.5 h-3.5" aria-hidden />}
      {done ? "Copied" : label}
    </button>
  );
}

/** One result line: what it is, the value, and a copy button. */
export function ResultRow({ label, value, copy = true, big = false }: { label: string; value: string; copy?: boolean; big?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-slate-100 last:border-b-0">
      <span className="text-[13px] text-slate-500">{label}</span>
      <span className="flex items-center gap-1.5 min-w-0">
        <span className={`font-mono text-slate-900 truncate ${big ? "text-[18px] font-bold" : "text-[15px] font-semibold"}`}>{value}</span>
        {copy && value !== "—" && <CopyButton text={value} />}
      </span>
    </div>
  );
}

import React, { useId } from "react";

// Brand mark: survey pin with a crosshair over a faint map grid
export function LogoMark({ size = 32, className = "" }: { size?: number; className?: string }) {
  const gradientId = useId();
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" className={className} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2997ff" />
          <stop offset="1" stopColor="#0058b0" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill={`url(#${gradientId})`} />
      <path d="M5 11.5h22M5 20.5h22M11.5 5v22M20.5 5v22" stroke="#fff" strokeOpacity=".14" strokeWidth=".8" />
      <path d="M16 5.5c-4.2 0-7.5 3.2-7.5 7.3 0 5.3 7.5 13.7 7.5 13.7s7.5-8.4 7.5-13.7c0-4.1-3.3-7.3-7.5-7.3z" fill="#fff" />
      <circle cx="16" cy="12.8" r="3.1" fill="none" stroke="#0071e3" strokeWidth="1.5" />
      <path d="M16 8.3v1.6M16 15.7v1.6M11.5 12.8h1.6M18.9 12.8h1.6" stroke="#0071e3" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// Mark + wordmark
export default function Logo({ size = 32, compactOnMobile = false }: { size?: number; compactOnMobile?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} className="shrink-0 drop-shadow-[0_2px_6px_rgba(0,113,227,0.25)]" />
      <span className={`${compactOnMobile ? "hidden sm:inline-flex" : "inline-flex"} items-center gap-1.5 whitespace-nowrap`}>
        <span className="font-extrabold text-[15px] tracking-tight text-slate-900">Excel to KML</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#0071e3] px-1.5 py-0.5 rounded-md leading-none">
          Pro
        </span>
      </span>
    </span>
  );
}

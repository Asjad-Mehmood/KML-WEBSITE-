import React from "react";

const METRICS = [
  { value: "6,864", unit: "+",  label: "EPSG Grid Systems" },
  { value: "100",   unit: "%",  label: "Offline & Air-Gapped" },
  { value: "<1",    unit: "s",  label: "10K-Point Conversion" },
  { value: "3.2",   unit: "MB", label: "Windows Installer Size" },
];

export default function MetricsRibbon() {
  return (
    <section className="border-y border-[#d2d2d7] bg-[#f5f5f7] py-12">
      <div className="max-w-[980px] mx-auto px-5 sm:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-[#d2d2d7]">
          {METRICS.map(({ value, unit, label }) => (
            <div key={label} className="flex flex-col items-center text-center px-6 py-2">
              <div className="text-[40px] font-bold tracking-tight text-[#1d1d1f]">
                {value}<span className="text-[#0071e3]">{unit}</span>
              </div>
              <div className="text-[13px] text-[#6e6e73] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

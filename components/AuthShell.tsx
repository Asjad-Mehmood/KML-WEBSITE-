import React from "react";
import Image from "next/image";
import Link from "next/link";

// Page frame shared by the password-reset pages (matches /login and /register)
export default function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col justify-between p-4 sm:p-8 font-sans">
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center p-1.5 shadow-xs transition-transform group-hover:scale-105">
            <Image src="/assets/icon.png" alt="Excel to KML Pro" width={32} height={32} className="object-contain" />
          </div>
          <span className="font-extrabold text-lg tracking-tight text-slate-900">
            Excel to KML <span className="bg-blue-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded tracking-wider">PRO</span>
          </span>
        </Link>
        <Link href="/login" className="text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">
          &larr; Back to sign in
        </Link>
      </div>

      <main className="max-w-md w-full mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8 sm:p-10">
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-2">{title}</h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">{subtitle}</p>
        </div>
        {children}
      </main>

      <div className="text-center text-xs text-slate-500 py-4">
        &copy; {new Date().getFullYear()} Excel to KML Pro
      </div>
    </div>
  );
}

export const inputClass =
  "w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white";
export const buttonClass =
  "w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all mt-2 cursor-pointer";

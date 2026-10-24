"use client";

import Link from "next/link";
import { ArrowRight, Check, LayoutDashboard, UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

// The home page's last section: one free account for every program. Signed-in people get a
// way back to their dashboard instead.
export default function AccountCta() {
  const { user, setAuthModalMode, setAuthModalOpen } = useAuth();
  const open = (mode: "register" | "login") => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  return (
    <section aria-labelledby="account-heading" className="py-20 lg:py-24 bg-white">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-slate-950 text-white px-6 py-12 sm:px-12 sm:py-14 lg:px-16">
          <div className="absolute -top-32 -right-24 w-[520px] h-[360px] bg-[#0071e3]/35 rounded-full blur-[120px] pointer-events-none" aria-hidden />
          <div className="relative grid lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7">
              <h2 id="account-heading" className="text-[28px] sm:text-[36px] lg:text-[40px] font-extrabold tracking-tight leading-[1.1]">
                {user ? "Everything you use, in one place" : "One free account for every program"}
              </h2>
              <p className="mt-4 text-[15px] sm:text-base text-slate-300 leading-relaxed max-w-[560px]">
                {user
                  ? "Your downloads, converted files and Traverse & Level jobs are in your dashboard, ready to open again."
                  : "Create it once and download Excel to KML, RoadPro, Traverse & Level and Project Folder Manager. Your work is kept for you too."}
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                {user ? (
                  <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white text-slate-900 text-[15px] font-semibold hover:bg-slate-100 transition-colors">
                    <LayoutDashboard className="w-4 h-4" aria-hidden /> Open your dashboard
                  </Link>
                ) : (
                  <>
                    <button onClick={() => open("register")} className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[15px] font-semibold shadow-[0_6px_20px_rgba(0,113,227,0.4)] cursor-pointer transition-colors">
                      <UserPlus className="w-4 h-4" aria-hidden /> Create a free account
                    </button>
                    <button onClick={() => open("login")} className="inline-flex items-center justify-center gap-1.5 px-6 py-3.5 rounded-xl border border-white/20 hover:bg-white/10 text-white text-[15px] font-semibold cursor-pointer transition-colors">
                      I have an account <ArrowRight className="w-4 h-4" aria-hidden />
                    </button>
                  </>
                )}
              </div>
            </div>
            <ul className="lg:col-span-5 space-y-3">
              {[
                "Every program to download, free",
                "Converted files kept in your dashboard",
                "Traverse & Level jobs saved and shared with your team",
                "Sign in with Google or your email",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-[14.5px] text-slate-200">
                  <span className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-emerald-400" aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

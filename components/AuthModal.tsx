"use client";

import React, { useState, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, Lock } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function AuthModal() {
  const router = useRouter();
  const { authModalOpen, setAuthModalOpen, authModalMode, setAuthModalMode, authIntentText, login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("Cadastral Surveyor");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const result = authModalMode === "register"
      ? await register({ name, email, password, organization, role })
      : await login(email, password);
    if (!result.ok) setError(result.error);
    // An admin signing in goes to the admin dashboard
    else if (authModalMode !== "register" && "isAdmin" in result && result.isAdmin) router.push("/admin");
    setSubmitting(false);
  };

  const inputCls = "w-full px-4 py-3 text-[15px] text-[#1d1d1f] bg-[#f5f5f7] border border-[#d2d2d7] rounded-[12px] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/50 focus:border-[#0071e3] transition-all placeholder:text-[#aeaeb2]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={() => setAuthModalOpen(false)}>
      <div className="w-full max-w-[440px] bg-white rounded-[24px] shadow-[0_32px_64px_rgba(0,0,0,0.18)] overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-5 border-b border-[#e8e8ed]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[11px] bg-[#0071e3] flex items-center justify-center">
              <Image src="/assets/icon.png" alt="" width={22} height={22} className="object-contain" />
            </div>
            <p className="text-[15px] font-semibold text-[#1d1d1f]">Excel to KML Pro</p>
          </div>
          <button onClick={() => setAuthModalOpen(false)}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-[#f5f5f7] hover:bg-[#e8e8ed] text-[#6e6e73] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-6">
          {/* Intent */}
          <div className="mb-5 px-4 py-3 bg-[#0071e3]/[0.07] border border-[#0071e3]/20 rounded-[12px] text-[13px] text-[#0071e3] font-medium">
            {authIntentText}
          </div>

          {/* Tabs */}
          <div className="flex bg-[#f5f5f7] p-1 rounded-[12px] mb-5 text-[13px] font-medium">
            <button onClick={() => { setAuthModalMode("register"); setError(null); }}
              className={`flex-1 py-2 rounded-[9px] transition-all ${authModalMode === "register" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}
            >Create Account</button>
            <button onClick={() => { setAuthModalMode("login"); setError(null); }}
              className={`flex-1 py-2 rounded-[9px] transition-all ${authModalMode === "login" ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]"}`}
            >Sign In</button>
          </div>

          {error && (
            <div className="mb-4 px-4 py-3 bg-[#ff3b30]/[0.08] border border-[#ff3b30]/20 rounded-[12px] text-[13px] text-[#ff3b30] font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {authModalMode === "register" && (
              <input type="text" placeholder="Full Name" required value={name} onChange={e => setName(e.target.value)} className={inputCls} />
            )}
            <input type="email" placeholder="Email Address" required value={email} onChange={e => setEmail(e.target.value)} className={inputCls} />
            <input type="password" placeholder="Password" required value={password} onChange={e => setPassword(e.target.value)} className={inputCls} />

            {authModalMode === "register" && (
              <div className="grid grid-cols-2 gap-3">
                <input type="text" placeholder="Organization" value={organization} onChange={e => setOrganization(e.target.value)} className={inputCls} />
                <select value={role} onChange={e => setRole(e.target.value)} className={inputCls}>
                  <option>Cadastral Surveyor</option>
                  <option>Civil Engineer</option>
                  <option>GIS Specialist</option>
                  <option>UAV / Drone Operator</option>
                  <option>Survey Tech / Student</option>
                </select>
              </div>
            )}

            <button type="submit" disabled={submitting}
              className="w-full mt-2 py-3.5 text-[15px] font-medium text-white bg-[#0071e3] hover:bg-[#0077ed] active:scale-[0.98] rounded-full transition-all disabled:opacity-60 shadow-sm cursor-pointer"
            >
              {submitting ? "Processing…" : authModalMode === "register" ? "Create Account & Download" : "Sign In & Continue"}
            </button>
            {authModalMode === "register" && (
              <p className="text-center text-[12px] text-[#6e6e73]">
                By creating an account you agree to the{" "}
                <Link href="/terms" target="_blank" className="text-[#0071e3] hover:underline">Terms of Use</Link> and{" "}
                <Link href="/privacy" target="_blank" className="text-[#0071e3] hover:underline">Privacy Policy</Link>.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

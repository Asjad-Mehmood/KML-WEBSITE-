"use client";

import React, { useState, useId } from "react";
import Image from "next/image";
import { useAuth } from "../context/AuthContext";

export default function AuthModal() {
  const {
    authModalOpen,
    setAuthModalOpen,
    authModalMode,
    setAuthModalMode,
    authIntentText,
    login,
    register,
  } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("Cadastral Surveyor");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unique IDs for accessibility
  const nameInputId = useId();
  const emailInputId = useId();
  const passwordInputId = useId();
  const orgInputId = useId();
  const roleInputId = useId();

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address");
      setIsSubmitting(false);
      return;
    }

    if (authModalMode === "register") {
      if (!name.trim()) {
        setError("Please enter your name");
        setIsSubmitting(false);
        return;
      }
      const success = await register({
        name,
        email,
        password,
        organization,
        role,
      });
      if (!success) {
        setError("Failed to create account. Please try again.");
      }
    } else {
      const success = await login(email, password);
      if (!success) {
        setError("Invalid email or password");
      }
    }

    setIsSubmitting(false);
  };

  const handleQuickDemoFill = () => {
    setName("Asjad Mehmood");
    setEmail("surveyor.lead@geotech.com");
    setPassword("surveyor123");
    setOrganization("National Survey & Mapping Corp");
    setRole("Cadastral Surveyor");
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl shadow-slate-900/20 overflow-hidden transform transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center p-1">
              <Image
                src="/assets/icon.png"
                alt="Excel to KML Pro"
                width={22}
                height={22}
                className="object-contain"
              />
            </div>
            <div>
              <span className="font-extrabold text-sm text-slate-900">
                Excel to KML <span className="text-blue-600">PRO</span>
              </span>
              <span className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Surveyor Access Pass
              </span>
            </div>
          </div>

          <button
            onClick={() => setAuthModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            aria-label="Close dialog"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8">
          {/* Intent notification badge */}
          <div className="mb-6 p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200/80 flex items-start gap-3">
            <div className="text-blue-600 mt-0.5 shrink-0">
              <svg className="w-5 h-5 stroke-2" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="text-xs text-blue-900 leading-relaxed font-medium">
              {authIntentText}
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => {
                setAuthModalMode("register");
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authModalMode === "register"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              Create Account (Free)
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthModalMode("login");
                setError(null);
              }}
              className={`py-2 rounded-lg transition-all ${
                authModalMode === "login"
                  ? "bg-white text-blue-700 shadow-xs"
                  : "hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {authModalMode === "register" && (
              <div>
                <label htmlFor={nameInputId} className="block text-xs font-bold text-slate-700 mb-1">
                  Full Name
                </label>
                <input
                  id={nameInputId}
                  type="text"
                  required
                  placeholder="e.g. Asjad Mehmood"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
              </div>
            )}

            <div>
              <label htmlFor={emailInputId} className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                id={emailInputId}
                type="email"
                required
                placeholder="surveyor@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor={passwordInputId} className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <input
                id={passwordInputId}
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            {authModalMode === "register" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={orgInputId} className="block text-xs font-bold text-slate-700 mb-1">
                    Company / Organization
                  </label>
                  <input
                    id={orgInputId}
                    type="text"
                    placeholder="e.g. Apex Civil Surveys"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  />
                </div>
                <div>
                  <label htmlFor={roleInputId} className="block text-xs font-bold text-slate-700 mb-1">
                    Professional Role
                  </label>
                  <select
                    id={roleInputId}
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  >
                    <option value="Cadastral Surveyor">Cadastral Surveyor</option>
                    <option value="Civil Engineer">Civil Engineer</option>
                    <option value="GIS Specialist">GIS Specialist</option>
                    <option value="UAV / Drone Operator">UAV / Drone Operator</option>
                    <option value="Survey Tech / Student">Survey Tech / Student</option>
                  </select>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>Authorizing...</span>
              ) : authModalMode === "register" ? (
                <>
                  <span>Create Account &amp; Proceed to Download</span>
                  <span>&rarr;</span>
                </>
              ) : (
                <>
                  <span>Sign In &amp; Continue Download</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Pre-fill */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Testing the app?</span>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              1-Click Demo Surveyor Fill
            </button>
          </div>
        </div>

        {/* Footer Perks */}
        <div className="bg-slate-50 border-t border-slate-100 px-6 py-3.5 text-center text-[11px] text-slate-500">
          🔒 100% Free &bull; Zero spam &bull; Direct access to all 6,864 EPSG grids &amp; downloads
        </div>
      </div>
    </div>
  );
}

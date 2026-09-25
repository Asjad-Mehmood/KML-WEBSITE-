"use client";

import React, { useState, useId } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const emailId = useId();
  const passwordId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!email || !email.includes("@")) {
      setError("Please provide a valid email");
      setIsSubmitting(false);
      return;
    }

    const success = await login(email, password);
    if (success) {
      router.push("/#download");
    } else {
      setError("Login failed. Please check credentials.");
    }
    setIsSubmitting(false);
  };

  const handleDemoFill = () => {
    setEmail("surveyor@geotech.com");
    setPassword("surveyor123");
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center p-1.5 shadow-xs transition-transform group-hover:scale-105">
            <Image
              src="/assets/icon.png"
              alt="Excel to KML Pro"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Excel to KML
              </span>
              <span className="bg-blue-600 text-white text-[11px] font-bold px-1.5 py-0.5 rounded tracking-wider shadow-xs">
                PRO
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-500 uppercase">
              Survey Benchmark Engine
            </p>
          </div>
        </Link>

        <Link
          href="/"
          className="text-xs font-bold text-slate-600 hover:text-blue-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          &larr; Back to Home
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-12 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
            <span>Surveyor Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Sign in to download Excel to KML Pro, access offline EPSG databases, and export survey coordinates.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={emailId} className="block text-xs font-bold text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              id={emailId}
              type="email"
              required
              placeholder="surveyor@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor={passwordId} className="block text-xs font-bold text-slate-700">
                Password
              </label>
            </div>
            <input
              id={passwordId}
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? "Authenticating..." : "Sign In & Access Downloads"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Need an account?</span>
          <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700">
            Create Free Account &rarr;
          </Link>
        </div>

        <div className="mt-4 pt-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-slate-400">
          <span>Quick testing:</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDemoFill}
              className="font-bold text-slate-600 hover:text-blue-600 hover:underline cursor-pointer"
            >
              Fill Demo Surveyor
            </button>
            <span>&bull;</span>
            <button
              type="button"
              onClick={() => {
                setEmail("admin@exceltokml.com");
                setPassword("admin2026!");
                setError(null);
              }}
              className="font-bold text-slate-600 hover:text-blue-600 hover:underline cursor-pointer"
            >
              Fill Master Admin
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        &copy; 2026 Excel to KML Pro &bull; Open-source survey benchmark coordinate engine
      </div>
    </div>
  );
}

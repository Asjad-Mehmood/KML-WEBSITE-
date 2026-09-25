"use client";

import React, { useState, useId, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { safeNextPath } from "../../lib/authRedirect";

export default function RegisterPage() {
  const router = useRouter();
  // ?next= from the URL (e.g. /app); read on the client only, null during server render
  const nextParam = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("next"),
    () => null
  );
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [role, setRole] = useState("Cadastral Surveyor");
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const orgId = useId();
  const roleId = useId();
  const agreeId = useId();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    if (!name.trim()) {
      setError("Please provide your full name");
      setIsSubmitting(false);
      return;
    }

    if (!email || !email.includes("@")) {
      setError("Please provide a valid email");
      setIsSubmitting(false);
      return;
    }

    if (!agree) {
      setError("Please agree to the open-source community guidelines");
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

    if (success) {
      // Back to where the visitor was headed (e.g. /app), else the download section
      router.push(safeNextPath(new URLSearchParams(window.location.search).get("next")));
    } else {
      setError("Registration failed. Please try again.");
    }
    setIsSubmitting(false);
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

      {/* Main Registration Card */}
      <div className="max-w-lg w-full mx-auto my-8 bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/60 p-8 sm:p-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <span>100% Free &bull; Zero Spam</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight mb-2">
            Create Surveyor Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Register to unlock instant downloads for the Windows native app, sample CSV test packages, and export features.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor={nameId} className="block text-xs font-bold text-slate-700 mb-1.5">
              Full Name *
            </label>
            <input
              id={nameId}
              type="text"
              required
              placeholder="e.g. Asjad Mehmood"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor={emailId} className="block text-xs font-bold text-slate-700 mb-1.5">
              Work / Surveyor Email *
            </label>
            <input
              id={emailId}
              type="email"
              required
              placeholder="surveyor@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div>
            <label htmlFor={passwordId} className="block text-xs font-bold text-slate-700 mb-1.5">
              Password *
            </label>
            <input
              id={passwordId}
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={orgId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Company / Agency
              </label>
              <input
                id={orgId}
                type="text"
                placeholder="Apex Geomatics"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
              />
            </div>

            <div>
              <label htmlFor={roleId} className="block text-xs font-bold text-slate-700 mb-1.5">
                Survey Discipline
              </label>
              <select
                id={roleId}
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

          <div className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              id={agreeId}
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={agreeId} className="text-xs text-slate-600 leading-normal select-none">
              I agree to the open-source community terms and understand calculations are 100% offline &amp; private on my local computer.
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? "Creating Account..." : "Complete Registration & Download"}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Already have an account?</span>
          <Link
            href={nextParam ? `/login?next=${encodeURIComponent(nextParam)}` : "/login"}
            className="font-bold text-blue-600 hover:text-blue-700"
          >
            Sign In Here &rarr;
          </Link>
        </div>

      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        &copy; 2026 Excel to KML Pro &bull; Open-source survey benchmark coordinate engine
      </div>
    </div>
  );
}

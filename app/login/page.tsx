"use client";

import React, { useEffect, useRef, useState, useId, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { safeNextPath } from "../../lib/authRedirect";
import { continuePath, inAuthHost } from "../../lib/authHost";
import GoogleSignIn, { GOOGLE_ERRORS } from "../../components/GoogleSignIn";
import OtpForm from "../../components/OtpForm";

export default function LoginPage() {
  const router = useRouter();
  // ?next= from the URL (e.g. /app); read on the client only, null during server render
  const nextParam = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("next"),
    () => null
  );
  const googleErrorCode = useSyncExternalStore(
    () => () => {},
    () => new URLSearchParams(window.location.search).get("error"),
    () => null
  );
  // the admin address (admin.…): admins only, so no Google sign-in and no new accounts there.
  // Otherwise it looks like any sign-in: nothing on it says "admin".
  const adminSide = useSyncExternalStore(
    () => () => {},
    () => window.location.hostname.startsWith("admin."),
    () => false
  );
  // the sign-in address (lib/authHost): signed in here, the main site is signed in by a handover
  const authSide = useSyncExternalStore(() => () => {}, inAuthHost, () => false);
  const googleError = googleErrorCode ? GOOGLE_ERRORS[googleErrorCode] ?? null : null;
  const { login, logout, user, isLoading, otp } = useAuth();

  // Links to the web app send signed-out visitors here with ?next=/app. Someone
  // who is already signed in goes straight on (decided once, when the session check ends)
  const sessionChecked = useRef(false);
  useEffect(() => {
    if (isLoading || sessionChecked.current) return;
    sessionChecked.current = true;
    // (on the sign-in address they choose: "Continue as …" or another account)
    if (user && nextParam && !authSide) router.replace(safeNextPath(nextParam));
  }, [isLoading, user, nextParam, router, authSide]);

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

    const result = await login(email, password);
    if (result.ok) goOn(result.isAdmin);
    else if (!result.otpRequired) setError(result.error);
    setIsSubmitting(false);
  };

  // Back to where the visitor was headed (e.g. /app or /dashboard); otherwise
  // admins go to the admin dashboard and everyone else to the home page
  const goOn = (isAdmin?: boolean) => {
    const next = new URLSearchParams(window.location.search).get("next");
    const dest = next ? safeNextPath(next) : isAdmin || adminSide ? "/admin" : "/";
    if (authSide) window.location.assign(continuePath(dest));
    else router.push(dest);
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col justify-between p-4 sm:p-8 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center p-1.5 shadow-xs transition-transform group-hover:scale-105">
            <Image
              src="/assets/icon.png"
              alt="SurveyX Digital"
              width={32}
              height={32}
              className="object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                SurveyX Digital
              </span>
            </div>
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
        {authSide && user && !otp ? (
          // signed in on the sign-in address already: go on as them, or use another account
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">Welcome Back</h1>
            <p className="mt-2 text-sm text-slate-500">You&apos;re signed in as</p>
            <p className="mt-1 font-bold text-slate-900">{user.name}</p>
            <p className="text-sm text-slate-500 break-all">{user.email}</p>
            <a
              href={continuePath(safeNextPath(nextParam))}
              className="mt-6 w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center"
            >
              Continue as {user.name.split(" ")[0]}
            </a>
            <button
              type="button"
              onClick={() => void logout()}
              className="mt-3 w-full py-3 px-4 border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl transition-colors"
            >
              Use another account
            </button>
          </div>
        ) : otp ? (
          <OtpForm onSuccess={(r) => goOn(r.isAdmin)} />
        ) : (
        <>
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Welcome Back
          </h1>
          {nextParam === "/app" && (
            <p role="status" className="mt-3 text-xs sm:text-sm font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              Sign in or create a free account to use the web app.
            </p>
          )}
        </div>

        {!adminSide && <GoogleSignIn next={safeNextPath(nextParam)} />}

        {(error || googleError) && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
            {error || googleError}
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
              <Link href="/forgot-password" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                Forgot password?
              </Link>
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
            {isSubmitting ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {!adminSide && (
        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Need an account?</span>
          <Link
            href={nextParam ? `/register?next=${encodeURIComponent(nextParam)}` : "/register"}
            className="font-bold text-blue-600 hover:text-blue-700"
          >
            Create Free Account &rarr;
          </Link>
        </div>
        )}
        </>
        )}

      </div>

      {/* Footer */}
      <div className="text-center text-xs text-slate-400 py-4">
        &copy; 2026 SurveyX Digital
      </div>
    </div>
  );
}

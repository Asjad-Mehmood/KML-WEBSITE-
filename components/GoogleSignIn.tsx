"use client";

import { usePublicSettings } from "@/lib/publicSettings";

export const GOOGLE_ERRORS: Record<string, string> = {
  "google-cancelled": "Google sign-in was cancelled. You can try again or use your email.",
  "google-expired": "That Google sign-in took too long or was already used. Please try again.",
  "google-failed": "Google sign-in didn't work this time. Please try again, or use your email.",
  "google-unavailable": "Google sign-in isn't available right now. Please use your email.",
  "google-admin": "Administrator accounts sign in with email and password.",
  "signups-closed": "New sign-ups are paused for now. If you already have an account, sign in with its email.",
};

function GoogleLogo() {
  return (
    <svg viewBox="0 0 48 48" className="w-5 h-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

// "Continue with Google" plus an "or" line; shown only when the site has
// Google sign-in set up (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET)
export default function GoogleSignIn({ next, compact = false }: { next: string; compact?: boolean }) {
  const settings = usePublicSettings();
  if (!settings?.googleSignIn) return null;
  return (
    <div className={compact ? "mb-3" : "mb-5"}>
      <a
        href={`/api/auth/google/start?next=${encodeURIComponent(next)}`}
        className="w-full inline-flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-[15px] font-semibold text-slate-800 shadow-sm transition-colors"
      >
        <GoogleLogo />
        Continue with Google
      </a>
      <p className="mt-2 text-center text-[11.5px] text-slate-500">
        New here? This creates your free account. By continuing you agree to the{" "}
        <a href="/terms" target="_blank" className="underline hover:text-slate-700">Terms</a> and{" "}
        <a href="/privacy" target="_blank" className="underline hover:text-slate-700">Privacy Policy</a>.
      </p>
      <div className="mt-4 flex items-center gap-3 text-[12px] text-slate-400" aria-hidden>
        <span className="h-px flex-1 bg-slate-200" /> or with email <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  );
}

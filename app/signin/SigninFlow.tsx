"use client";

// The two-step sign-in: the email (/signin/identifier), then the password (/signin/password),
// then a short "Checking…" and "Signed in, taking you to …" on the way to where they were going.
// The email goes from one step to the next in sessionStorage, never in the address. On the
// sign-in address (lib/authHost) the site is signed in by a handover (/api/auth/continue).
import React, { useEffect, useId, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { continuePath, inAuthHost } from "@/lib/authHost";
import GoogleSignIn, { GOOGLE_ERRORS } from "@/components/GoogleSignIn";
import OtpForm from "@/components/OtpForm";

const EMAIL_KEY = "kml_signin_email";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const DONE_MS = 1400;

/** Where they are being taken, in words */
function destination(next: string): string {
  const p = next.split("?")[0];
  if (p.startsWith("/dashboard")) return "your dashboard";
  if (p === "/app") return "the Excel to KML web app";
  if (p.startsWith("/traverse/app")) return "Traverse & Level";
  if (p.startsWith("/slope-calculation/app")) return "the Slope Calculator";
  if (p.startsWith("/link") || p.startsWith("/app-signin")) return "your program";
  if (p.startsWith("/download") || p.startsWith("/toolkit")) return "your download";
  if (p === "/") return "Excel to KML";
  return "where you were";
}

const readEmail = () => {
  try {
    return sessionStorage.getItem(EMAIL_KEY) || "";
  } catch {
    return "";
  }
};

type Phase = "form" | "checking" | "code" | "done";

export default function SigninFlow({ step, next, query, error }: { step: "identifier" | "password"; next: string; query: string; error: string | null }) {
  const router = useRouter();
  const { login, logout, user, isLoading, otp } = useAuth();
  const authSide = useSyncExternalStore(() => () => {}, inAuthHost, () => false);
  const savedEmail = useSyncExternalStore(() => () => {}, readEmail, () => "");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [problem, setProblem] = useState<string | null>(error ? GOOGLE_ERRORS[error] ?? null : null);
  const [leaving, setLeaving] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  const typedEmail = email || (step === "identifier" ? savedEmail : "");
  const accountEmail = savedEmail;

  // the password step needs the email from the first step
  useEffect(() => {
    if (step === "password" && !readEmail()) router.replace(`/signin/identifier?${query}`);
  }, [step, query, router]);

  /** Off to where they were going: through the handover on the sign-in address */
  const go = () => {
    const to = authSide ? continuePath(next) : next;
    window.location.assign(to);
  };

  const finished = () => {
    try {
      sessionStorage.removeItem(EMAIL_KEY);
    } catch {}
    setPhase("done");
    window.setTimeout(go, DONE_MS);
  };

  const toPassword = (e: React.FormEvent) => {
    e.preventDefault();
    const v = typedEmail.trim();
    if (!EMAIL_RE.test(v)) {
      setProblem("Enter a valid email address.");
      return;
    }
    setProblem(null);
    try {
      sessionStorage.setItem(EMAIL_KEY, v.toLowerCase());
    } catch {}
    setLeaving(true);
    window.setTimeout(() => router.push(`/signin/password?${query}`), 180);
  };

  const signIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setProblem("Enter your password.");
      return;
    }
    setProblem(null);
    setPhase("checking");
    // at least a moment on "Checking…", so it doesn't flash
    const [result] = await Promise.all([login(accountEmail, password), new Promise((r) => setTimeout(r, 700))]);
    if (result.ok) finished();
    else if (result.otpRequired) setPhase("code");
    else {
      setProblem(result.error);
      setPhase("form");
    }
  };

  const changeAccount = () => {
    try {
      sessionStorage.removeItem(EMAIL_KEY);
    } catch {}
    router.push(`/signin/identifier?${query}`);
  };

  // ------------------------------------------------------------------ screens

  let body: React.ReactNode;
  if (phase === "checking") {
    body = (
      <Status icon={<Loader2 className="w-7 h-7 animate-spin text-[#0071e3]" aria-hidden />} title="Checking…" text="Making sure it's you" />
    );
  } else if (phase === "done") {
    body = (
      <Status
        icon={
          <span className="si-pop flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
            <Check className="w-7 h-7" aria-hidden />
          </span>
        }
        title="You're signed in"
        text={`Taking you to ${destination(next)}…`}
      >
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="si-bar h-full bg-[#0071e3]" style={{ animationDuration: `${DONE_MS}ms` }} />
        </div>
      </Status>
    );
  } else if (phase === "code" && otp) {
    body = (
      <div className="si-in">
        <OtpForm onSuccess={finished} />
      </div>
    );
  } else if (step === "identifier" && !isLoading && user) {
    // signed in here already: go on as them, or use another account
    body = (
      <div className="si-in text-center">
        <Avatar email={user.email} big />
        <h1 className="mt-4 text-[24px] font-semibold text-[#1d1d1f]">Welcome back</h1>
        <p className="mt-1 text-[14px] text-slate-500 break-all">{user.email}</p>
        <button type="button" onClick={finished} className={`${primary} mt-7`}>
          Continue as {user.name.split(" ")[0]}
        </button>
        <button type="button" onClick={() => void logout()} className="mt-3 w-full rounded-full py-3 text-[14px] font-semibold text-[#0071e3] hover:bg-blue-50">
          Use another account
        </button>
      </div>
    );
  } else if (step === "identifier") {
    body = (
      <form onSubmit={toPassword} noValidate className={leaving ? "si-out" : "si-in"}>
        <h1 className="text-center text-[24px] font-semibold text-[#1d1d1f]">Sign in</h1>
        <p className="mt-1 text-center text-[14px] text-slate-500">to continue to {destination(next)}</p>
        <div className="mt-7">
          <GoogleSignIn next={next} />
        </div>
        <label htmlFor={emailId} className="sr-only">
          Email
        </label>
        <input
          id={emailId}
          type="email"
          autoComplete="username"
          autoFocus
          placeholder="Email"
          value={typedEmail}
          onChange={(e) => setEmail(e.target.value)}
          className={input}
        />
        {problem && <p role="alert" className="mt-2 text-[13px] font-medium text-rose-600">{problem}</p>}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Link href={`/register?next=${encodeURIComponent(next)}`} className="text-[14px] font-semibold text-[#0071e3] hover:underline">
            Create account
          </Link>
          <button type="submit" className={`${primary} !w-auto px-7`}>
            Next
          </button>
        </div>
      </form>
    );
  } else {
    body = (
      <form onSubmit={signIn} noValidate className="si-in">
        <h1 className="text-center text-[24px] font-semibold text-[#1d1d1f]">Welcome</h1>
        <button
          type="button"
          onClick={changeAccount}
          className="mx-auto mt-3 flex max-w-full items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-[13px] text-slate-700 hover:bg-slate-50"
          title="Use another account"
        >
          <Avatar email={accountEmail} />
          <span className="truncate">{accountEmail}</span>
          <ArrowLeft className="w-3.5 h-3.5 rotate-[-90deg] text-slate-400" aria-hidden />
        </button>
        {/* a hidden username, so password managers know which account this is */}
        <input type="email" autoComplete="username" value={accountEmail} readOnly hidden />
        <label htmlFor={passwordId} className="sr-only">
          Password
        </label>
        <div className="relative mt-7">
          <input
            id={passwordId}
            type={show ? "text" : "password"}
            autoComplete="current-password"
            autoFocus
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`${input} !mt-0 pr-12`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? "Hide password" : "Show password"}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 hover:bg-slate-100"
          >
            {show ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
          </button>
        </div>
        {problem && <p role="alert" className="mt-2 text-[13px] font-medium text-rose-600">{problem}</p>}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Link href="/forgot-password" className="text-[14px] font-semibold text-[#0071e3] hover:underline">
            Forgot password?
          </Link>
          <button type="submit" className={`${primary} !w-auto px-7`}>
            Sign in
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-[440px] overflow-hidden rounded-[28px] border border-slate-200/70 bg-white px-6 py-9 shadow-[0_24px_60px_-20px_rgba(7,26,68,0.18)] sm:px-10">
        <div className="mb-6 flex justify-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-[13px] bg-[#071a44]">
            <Image src="/assets/icon.png" alt="Excel to KML" width={26} height={26} className="object-contain" priority />
          </span>
        </div>
        {body}
      </div>
      <p className="mt-6 flex items-center gap-1.5 text-[12px] text-slate-500">
        <Lock className="w-3.5 h-3.5" aria-hidden /> Secure sign-in · Excel to KML
      </p>
      <style>{`
        .si-in { animation: si-in .32s cubic-bezier(.2,.7,.2,1) both; }
        .si-out { animation: si-out .18s ease-in both; }
        .si-pop { animation: si-pop .4s cubic-bezier(.2,1.4,.4,1) both; }
        .si-bar { width: 0; animation: si-bar linear forwards; }
        @keyframes si-in { from { opacity: 0; transform: translateX(24px); } to { opacity: 1; transform: none; } }
        @keyframes si-out { to { opacity: 0; transform: translateX(-24px); } }
        @keyframes si-pop { from { transform: scale(.4); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        @keyframes si-bar { to { width: 100%; } }
        @media (prefers-reduced-motion: reduce) { .si-in, .si-out, .si-pop { animation: none; } }
      `}</style>
    </div>
  );
}

const primary = "w-full rounded-full bg-[#0071e3] py-3 text-[14px] font-semibold text-white transition-colors hover:bg-[#0077ed]";
const input =
  "mt-5 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15";

function Avatar({ email, big = false }: { email: string; big?: boolean }) {
  const letter = (email.trim()[0] || "?").toUpperCase();
  return (
    <span
      aria-hidden
      className={`mx-auto flex shrink-0 items-center justify-center rounded-full bg-[#071a44] font-semibold text-[#ffd21f] ${big ? "h-16 w-16 text-[26px]" : "h-7 w-7 text-[13px]"}`}
    >
      {letter}
    </span>
  );
}

function Status({ icon, title, text, children }: { icon: React.ReactNode; title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="si-in py-6 text-center" role="status" aria-live="polite">
      <div className="flex justify-center">{icon}</div>
      <p className="mt-4 text-[20px] font-semibold text-[#1d1d1f]">{title}</p>
      <p className="mt-1 text-[14px] text-slate-500">{text}</p>
      {children}
    </div>
  );
}

"use client";

// The sign-up, a step at a time, in the same card as the sign-in (app/signin):
//   /signup/details  name and email (with "did you mean …" for a mistyped domain), or Google
//   /signup/password a password, with its strength as they type and a Caps Lock warning
//   /signup/about    organization and occupation, both optional
// then "Creating your account…", the emailed code, and "Account created, taking you to …".
// What they typed stays in this page's memory between the steps (the password never goes into
// storage or the address); a reload starts again at the first step.
import React, { useEffect, useId, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Eye, EyeOff, Loader2, PartyPopper } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { continuePath, inAuthHost } from "@/lib/authHost";
import { typoFix } from "@/lib/emailTypos";
import { OCCUPATIONS, OCCUPATION_MAX } from "@/lib/occupations";
import { usePublicSettings } from "@/lib/publicSettings";
import GoogleSignIn, { GOOGLE_ERRORS } from "@/components/GoogleSignIn";
import OtpForm from "@/components/OtpForm";
import ToolkitInvite from "@/components/ToolkitInvite";
import { AuthCard, Avatar, DONE_MS, Status, destination, input, primary } from "../signin/SigninFlow";

import { SIGNUP_STEPS, type SignupStepName } from "./steps";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// kept across the steps (client-side navigation keeps this module), never stored
const draft = { name: "", email: "", password: "", organization: "", role: "" };

/** 0–4: how hard the password is to guess, roughly */
function strength(pw: string): number {
  if (pw.length < 8) return pw ? 1 : 0;
  let s = 1;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) s++;
  else if (/\d|[^A-Za-z0-9]/.test(pw)) s += 0.5;
  return Math.min(4, Math.floor(s));
}
const LEVELS = [
  { label: "", color: "bg-slate-200" },
  { label: "Too short", color: "bg-rose-500" },
  { label: "Okay", color: "bg-amber-500" },
  { label: "Good", color: "bg-lime-500" },
  { label: "Strong", color: "bg-emerald-500" },
];

type Phase = "form" | "creating" | "code" | "done" | "welcome";

export default function SignupFlow({ step, next, query, error }: { step: SignupStepName; next: string; query: string; error: string | null }) {
  const router = useRouter();
  const { register, otp } = useAuth();
  const settings = usePublicSettings();
  const closed = settings?.signupsOpen === false;
  const authSide = useSyncExternalStore(() => () => {}, inAuthHost, () => false);

  const [name, setName] = useState(draft.name);
  const [email, setEmail] = useState(draft.email);
  const [password, setPassword] = useState(draft.password);
  const [organization, setOrganization] = useState(draft.organization);
  const [role, setRole] = useState(draft.role);
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [problem, setProblem] = useState<string | null>(error ? GOOGLE_ERRORS[error] ?? null : null);
  const [taken, setTaken] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const ids = { name: useId(), email: useId(), password: useId(), org: useId(), role: useId() };

  // a later step without the earlier ones (a reload, a shared link): back to the start
  useEffect(() => {
    if (step !== "details" && (!draft.name || !draft.email)) router.replace(`/signup/details?${query}`);
    else if (step === "about" && !draft.password) router.replace(`/signup/password?${query}`);
  }, [step, query, router]);

  const at = SIGNUP_STEPS.indexOf(step);
  const fix = typoFix(email);
  const level = strength(password);

  const goTo = (s: SignupStepName) => {
    setLeaving(true);
    window.setTimeout(() => router.push(`/signup/${s}?${query}`), 180);
  };

  const go = () => window.location.assign(authSide ? continuePath(next) : next);
  const [firstName, setFirstName] = useState("");
  const finished = () => {
    setFirstName(draft.name.split(" ")[0] || name.split(" ")[0]);
    Object.assign(draft, { name: "", email: "", password: "", organization: "", role: "" });
    // while the Survey Toolkit is open to everyone: the welcome, with the Toolkit to download;
    // otherwise straight on
    if (settings?.toolkitPublic) return setPhase("welcome");
    setPhase("done");
    window.setTimeout(go, DONE_MS + 400);
  };

  const submitDetails = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const m = email.trim().toLowerCase();
    if (n.length < 2) return setProblem("Enter your name.");
    if (!EMAIL_RE.test(m)) return setProblem("Enter a valid email address.");
    setProblem(null);
    Object.assign(draft, { name: n, email: m });
    goTo("password");
  };

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return setProblem("Use at least 8 characters.");
    if (password !== password.trim()) return setProblem("A password can't start or end with a space.");
    setProblem(null);
    draft.password = password;
    goTo("about");
  };

  const create = async (skip = false) => {
    Object.assign(draft, skip ? { organization: "", role: "" } : { organization: organization.trim(), role: role.trim() });
    setProblem(null);
    setPhase("creating");
    const [result] = await Promise.all([
      register({ name: draft.name, email: draft.email, password: draft.password, organization: draft.organization || undefined, role: draft.role || undefined }),
      new Promise((r) => setTimeout(r, 900)),
    ]);
    if (result.ok) return finished();
    if (result.otpRequired) return setPhase("code");
    setPhase("form");
    // the email belongs to an account already, or something else about the first steps
    if (/already exists|reserved|email/i.test(result.error)) {
      setTaken(/already exists/i.test(result.error));
      setProblem(result.error);
      router.push(`/signup/details?${query}`);
    } else setProblem(result.error);
  };

  // ------------------------------------------------------------------ screens

  const steps = (
    <ol aria-label={`Step ${at + 1} of 3`} className="mb-5 flex justify-center gap-1.5">
      {SIGNUP_STEPS.map((s, i) => (
        <li key={s} className={`h-1.5 rounded-full transition-all duration-300 ${i === at ? "w-6 bg-[#0071e3]" : i < at ? "w-1.5 bg-[#0071e3]/60" : "w-1.5 bg-slate-200"}`} />
      ))}
    </ol>
  );
  const errorLine = problem && (
    <p role="alert" className="mt-2 text-[13px] font-medium text-rose-600">
      {problem}{" "}
      {taken && (
        <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-[#0071e3] underline">
          Sign in instead
        </Link>
      )}
    </p>
  );

  let body: React.ReactNode;
  if (closed) {
    body = (
      <Status icon={<AlertTriangle className="w-8 h-8 text-amber-500" aria-hidden />} title="Sign-ups are paused" text="New accounts can't be made just now. If you have one, sign in.">
        <Link href={`/login?next=${encodeURIComponent(next)}`} className={`${primary} mt-6 inline-block`}>
          Sign in
        </Link>
      </Status>
    );
  } else if (phase === "creating") {
    body = <Status icon={<Loader2 className="w-7 h-7 animate-spin text-[#0071e3]" aria-hidden />} title="Creating your account…" text="This only takes a moment" />;
  } else if (phase === "code" && otp) {
    body = (
      <div className="si-in">
        <OtpForm onSuccess={finished} />
      </div>
    );
  } else if (phase === "welcome") {
    body = (
      <ToolkitInvite
        firstName={firstName}
        downloadHref={authSide ? continuePath("/api/toolkit/download") : "/api/toolkit/download"}
        onContinue={go}
        continueLabel={`Continue to ${destination(next)}`}
      />
    );
  } else if (phase === "done") {
    body = (
      <Status
        icon={
          <span className="si-pop flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white">
            <PartyPopper className="w-6 h-6" aria-hidden />
          </span>
        }
        title={`Welcome, ${firstName}!`}
        text={`Your account is ready. Taking you to ${destination(next)}…`}
      >
        <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="si-bar h-full bg-emerald-500" style={{ animationDuration: `${DONE_MS + 400}ms` }} />
        </div>
      </Status>
    );
  } else if (step === "details") {
    body = (
      <form onSubmit={submitDetails} noValidate className={leaving ? "si-out" : "si-in"}>
        {steps}
        <h1 className="text-center text-[24px] font-semibold text-[#1d1d1f]">Create your account</h1>
        <p className="mt-1 text-center text-[14px] text-slate-500">Free, for every SurveyX Digital program</p>
        <div className="mt-7">
          <GoogleSignIn next={next} />
        </div>
        <label htmlFor={ids.name} className="sr-only">Your name</label>
        <input id={ids.name} autoComplete="name" autoFocus placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className={input} />
        <label htmlFor={ids.email} className="sr-only">Email</label>
        <input
          id={ids.email}
          type="email"
          autoComplete="email"
          placeholder="Email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setTaken(false);
          }}
          className={`${input} !mt-3`}
        />
        {fix && (
          <button type="button" onClick={() => setEmail(fix)} className="mt-2 text-[13px] text-slate-600">
            Did you mean <span className="font-semibold text-[#0071e3] underline">{fix}</span>?
          </button>
        )}
        {errorLine}
        <div className="mt-6 flex items-center justify-between gap-3">
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="text-[14px] font-semibold text-[#0071e3] hover:underline">
            Sign in instead
          </Link>
          <button type="submit" className={`${primary} !w-auto px-7`}>
            Next
          </button>
        </div>
      </form>
    );
  } else if (step === "password") {
    const rules = [
      { ok: password.length >= 8, text: "At least 8 characters" },
      { ok: /[A-Za-z]/.test(password) && /\d/.test(password), text: "Letters and numbers" },
      { ok: /[^A-Za-z0-9]/.test(password), text: "A symbol makes it stronger" },
    ];
    body = (
      <form onSubmit={submitPassword} noValidate className={leaving ? "si-out" : "si-in"}>
        {steps}
        <h1 className="text-center text-[24px] font-semibold text-[#1d1d1f]">Choose a password</h1>
        <button type="button" onClick={() => goTo("details")} className="mx-auto mt-3 flex max-w-full items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3 text-[13px] text-slate-700 hover:bg-slate-50" title="Change">
          <Avatar email={draft.email} />
          <span className="truncate">{draft.email}</span>
        </button>
        <input type="email" autoComplete="username" value={draft.email} readOnly hidden />
        <label htmlFor={ids.password} className="sr-only">Password</label>
        <div className="relative mt-7">
          <input
            id={ids.password}
            type={show ? "text" : "password"}
            autoComplete="new-password"
            autoFocus
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyUp={(e) => setCaps(e.getModifierState?.("CapsLock") ?? false)}
            className={`${input} !mt-0 pr-12`}
          />
          <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-500 hover:bg-slate-100">
            {show ? <EyeOff className="w-4 h-4" aria-hidden /> : <Eye className="w-4 h-4" aria-hidden />}
          </button>
        </div>
        {caps && <p className="mt-2 text-[12.5px] font-medium text-amber-700">Caps Lock is on</p>}
        {/* how strong, as they type */}
        <div className="mt-3 flex items-center gap-3" aria-live="polite">
          <div className="flex flex-1 gap-1">
            {[1, 2, 3, 4].map((i) => (
              <span key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${i <= level ? LEVELS[level].color : "bg-slate-200"}`} />
            ))}
          </div>
          <span className="w-16 text-right text-[12px] font-semibold text-slate-600">{LEVELS[level].label}</span>
        </div>
        <ul className="mt-3 space-y-1">
          {rules.map((r) => (
            <li key={r.text} className={`flex items-center gap-2 text-[12.5px] transition-colors ${r.ok ? "text-emerald-700" : "text-slate-500"}`}>
              <span className={`flex h-4 w-4 items-center justify-center rounded-full ${r.ok ? "bg-emerald-500 text-white" : "border border-slate-300"}`}>
                {r.ok && <Check className="w-3 h-3" aria-hidden />}
              </span>
              {r.text}
            </li>
          ))}
        </ul>
        {errorLine}
        <div className="mt-6 flex items-center justify-between gap-3">
          <button type="button" onClick={() => goTo("details")} className="text-[14px] font-semibold text-[#0071e3] hover:underline">
            Back
          </button>
          <button type="submit" className={`${primary} !w-auto px-7`}>
            Next
          </button>
        </div>
      </form>
    );
  } else {
    body = (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void create();
        }}
        noValidate
        className={leaving ? "si-out" : "si-in"}
      >
        {steps}
        <h1 className="text-center text-[24px] font-semibold text-[#1d1d1f]">A little about you</h1>
        <p className="mt-1 text-center text-[14px] text-slate-500">Optional. It helps us build the right tools.</p>
        <label htmlFor={ids.org} className="sr-only">Organization</label>
        <input id={ids.org} autoComplete="organization" autoFocus placeholder="Organization (optional)" value={organization} onChange={(e) => setOrganization(e.target.value)} className={`${input} !mt-7`} />
        <label htmlFor={ids.role} className="sr-only">Occupation</label>
        <input id={ids.role} maxLength={OCCUPATION_MAX} placeholder="Occupation (optional)" value={role} onChange={(e) => setRole(e.target.value)} className={`${input} !mt-3`} />
        {/* one tap for the usual ones */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {OCCUPATIONS.slice(0, 6).map((o) => (
            <button
              key={o}
              type="button"
              onClick={() => setRole(o)}
              className={`rounded-full border px-3 py-1 text-[12.5px] transition-colors ${role === o ? "border-[#0071e3] bg-[#0071e3] text-white" : "border-slate-200 text-slate-700 hover:border-slate-300"}`}
            >
              {o}
            </button>
          ))}
        </div>
        {errorLine}
        <p className="mt-5 text-[12px] leading-relaxed text-slate-500">
          By creating an account you agree to the{" "}
          <a href="/terms" className="underline">Terms</a> and the <a href="/privacy" className="underline">Privacy Policy</a>.
        </p>
        <div className="mt-5 flex items-center justify-between gap-3">
          <button type="button" onClick={() => void create(true)} className="text-[14px] font-semibold text-[#0071e3] hover:underline">
            Skip
          </button>
          <button type="submit" className={`${primary} !w-auto px-7`}>
            Create account
          </button>
        </div>
      </form>
    );
  }

  return <AuthCard>{body}</AuthCard>;
}

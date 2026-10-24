"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { usePublicSettings } from "@/lib/publicSettings";

// Invites signed-out visitors to create an account once they have shown interest: 3 pages in a
// visit, a minute on the site, most of a page read, or a few clicks inside the page (using a
// converter or a tool). A small card in the corner, never a screen-blocking pop-up. At most once
// a visit; "Not now" hides it for 7 days (30 after the third time). Admin → Settings switches it off.

const SNOOZE_KEY = "kml.signup.snooze";
const COUNT_KEY = "kml.signup.dismissed";
const PAGES_KEY = "kml.visit.pages";
const SHOWN_KEY = "kml.signup.shown";

const QUIET = ["/login", "/register", "/forgot-password", "/reset-password", "/dashboard", "/admin", "/app", "/link", "/app-signin", "/welcome", "/unsubscribe", "/review"];

const store = {
  get(k: string, s: Storage | undefined) { try { return s?.getItem(k) ?? null; } catch { return null; } },
  set(k: string, v: string, s: Storage | undefined) { try { s?.setItem(k, v); } catch { /* private mode */ } },
};
const ls = () => (typeof window === "undefined" ? undefined : window.localStorage);
const ss = () => (typeof window === "undefined" ? undefined : window.sessionStorage);

/** What an account gives you, in the words of the page you are on */
function pitch(path: string): { title: string; text: string } {
  if (/^\/(roadpro|traverse|project-folder-manager|download)/.test(path))
    return { title: "Get it free, and hear about updates", text: "A free account lets you download our programs and tells you when a new version is out." };
  if (/^\/(convert|tools|guides)/.test(path))
    return { title: "Keep what you convert", text: "With a free account your converted points and files are saved, ready to open on any computer." };
  return { title: "Create your free account", text: "Save your conversions and files, use the web app, and download the Windows app and our other tools." };
}

export default function SignupPrompt() {
  const { user, isLoading, authModalOpen, setAuthModalMode, setAuthModalOpen, setAuthIntentText } = useAuth();
  const settings = usePublicSettings();
  const path = usePathname() || "/";
  const [show, setShow] = useState(false);
  const fired = useRef(false);

  const quiet = QUIET.some((p) => path === p || path.startsWith(`${p}/`));
  const allowed = !isLoading && !user && settings?.signupPrompt !== false && settings !== null && !quiet;

  // pages viewed in this visit
  useEffect(() => {
    const n = Number(store.get(PAGES_KEY, ss()) || 0) + 1;
    store.set(PAGES_KEY, String(n), ss());
  }, [path]);

  useEffect(() => {
    if (!allowed || fired.current) return;
    if (store.get(SHOWN_KEY, ss())) return; // once a visit
    if (Number(store.get(SNOOZE_KEY, ls()) || 0) > Date.now()) return;

    const fire = () => {
      if (fired.current) return;
      fired.current = true;
      store.set(SHOWN_KEY, "1", ss());
      setShow(true);
    };
    if (Number(store.get(PAGES_KEY, ss()) || 0) >= 3) {
      const t = setTimeout(fire, 2500);
      return () => clearTimeout(t);
    }
    const timer = setTimeout(fire, 60000);
    const onScroll = () => {
      const h = document.documentElement;
      if (h.scrollHeight > h.clientHeight * 1.8 && (h.scrollTop + h.clientHeight) / h.scrollHeight > 0.7) fire();
    };
    let clicks = 0;
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null;
      if (el?.closest("main button, main a[download], main input[type=file]")) {
        clicks++;
        if (clicks >= 3) fire();
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("click", onClick);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("click", onClick);
    };
  }, [allowed, path]);

  // signed in meanwhile (allowed turns false), or the sign-in window is open: step aside
  if (!show || !allowed || authModalOpen) return null;
  const p = pitch(path);

  const later = () => {
    const n = Number(store.get(COUNT_KEY, ls()) || 0) + 1;
    store.set(COUNT_KEY, String(n), ls());
    store.set(SNOOZE_KEY, String(Date.now() + (n >= 3 ? 30 : 7) * 864e5), ls());
    setShow(false);
  };
  const open = (mode: "register" | "login") => {
    setAuthIntentText(p.text);
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    setShow(false);
  };

  return (
    <aside
      role="dialog"
      aria-labelledby="signup-prompt-title"
      className="signup-prompt fixed z-40 bottom-3 inset-x-3 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-[360px] rounded-2xl border border-slate-200 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.22)] p-4"
    >
      <button type="button" onClick={later} aria-label="Not now" className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
        <X className="w-4 h-4" aria-hidden />
      </button>
      <div className="flex gap-3 pr-6">
        <span className="shrink-0 w-10 h-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
          <Sparkles className="w-5 h-5" aria-hidden />
        </span>
        <div>
          <p id="signup-prompt-title" className="font-bold text-slate-900 text-[15px]">{p.title}</p>
          <p className="mt-0.5 text-[13px] text-slate-600 leading-relaxed">{p.text}</p>
        </div>
      </div>
      <div className="mt-3.5 flex items-center gap-2">
        <button type="button" onClick={() => open("register")} className="flex-1 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-[13.5px] font-semibold cursor-pointer">
          Create free account
        </button>
        <button type="button" onClick={() => open("login")} className="px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-[13.5px] font-semibold hover:bg-slate-50 cursor-pointer">
          Sign in
        </button>
      </div>
      <button type="button" onClick={later} className="mt-2 w-full text-center text-[12px] text-slate-500 hover:text-slate-700 cursor-pointer">
        Not now
      </button>
    </aside>
  );
}

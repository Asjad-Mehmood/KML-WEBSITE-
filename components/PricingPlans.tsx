"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import type { Plan, Prices } from "@/lib/plans";

type PaddleCheckout = {
  environment: "sandbox" | "production";
  token: string;
  priceId: string;
  email: string;
  customData: Record<string, string>;
  successUrl: string;
};
type PaddleJs = {
  Environment: { set: (env: string) => void };
  Initialize: (o: { token: string }) => void;
  Checkout: { open: (o: unknown) => void };
};

// Paddle.js, loaded once, only when someone presses Upgrade
let paddleLoad: Promise<PaddleJs> | null = null;
function loadPaddle(cfg: PaddleCheckout): Promise<PaddleJs> {
  paddleLoad ??= new Promise<PaddleJs>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
    s.async = true;
    s.onload = () => {
      const P = (window as unknown as { Paddle?: PaddleJs }).Paddle;
      if (!P) return reject(new Error("Paddle didn't load"));
      if (cfg.environment === "sandbox") P.Environment.set("sandbox");
      P.Initialize({ token: cfg.token });
      resolve(P);
    };
    s.onerror = () => reject(new Error("Paddle didn't load"));
    document.head.appendChild(s);
  }).catch((e) => {
    paddleLoad = null;
    throw e;
  });
  return paddleLoad;
}

// The two plans on /pricing, with a monthly / yearly choice and the button to upgrade
export default function PricingPlans({ free, pro, prices }: { free: Plan; pro: Plan; prices: Prices }) {
  const { user, setAuthModalMode, setAuthModalOpen, setAuthIntentText } = useAuth();
  const [yearly, setYearly] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const upgrade = async () => {
    if (!user) {
      setAuthIntentText("Sign in or create a free account, then choose Pro.");
      setAuthModalMode("login");
      setAuthModalOpen(true);
      return;
    }
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interval: yearly ? "yearly" : "monthly" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.paddle) {
        const cfg = data.paddle as PaddleCheckout;
        const Paddle = await loadPaddle(cfg);
        Paddle.Checkout.open({
          items: [{ priceId: cfg.priceId, quantity: 1 }],
          customer: { email: cfg.email },
          customData: cfg.customData,
          settings: { displayMode: "overlay", theme: "light", successUrl: new URL(cfg.successUrl, window.location.origin).href },
        });
      } else if (data.url) window.location.href = data.url;
      else setMsg(data.error || "Something went wrong. Try again in a moment.");
    } catch {
      setMsg("The payment window couldn't open. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const price = yearly ? prices.yearly : prices.monthly;
  const card = "rounded-2xl border bg-white p-6 sm:p-8 flex flex-col";
  const save = prices.monthly > 0 ? Math.round((1 - prices.yearly / (prices.monthly * 12)) * 100) : 0;
  const choices: [string, boolean][] = [["Monthly", false], [save > 0 ? `Yearly (save ${save}%)` : "Yearly", true]];

  return (
    <section className="mt-10 mb-16">
      <div role="radiogroup" aria-label="Billing" className="inline-flex rounded-full border border-slate-200 bg-white p-1 text-sm font-semibold">
        {choices.map(([label, y]) => (
          <button
            key={label}
            type="button"
            role="radio"
            aria-checked={yearly === y}
            onClick={() => setYearly(y)}
            className={`px-4 py-2 rounded-full cursor-pointer ${yearly === y ? "bg-slate-900 text-white" : "text-slate-600 hover:text-slate-900"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
        <div className={`${card} border-slate-200`}>
          <h2 className="text-lg font-bold text-slate-900">{free.name}</h2>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">$0</p>
          <p className="text-sm text-slate-500">for ever</p>
          <ul className="mt-6 space-y-3 text-[15px] text-slate-700 flex-1">
            {free.points.map((p) => (
              <li key={p} className="flex gap-2.5"><Check className="w-5 h-5 text-slate-400 shrink-0" aria-hidden />{p}</li>
            ))}
          </ul>
          <Link href={user ? "/dashboard" : "/signup"} className="mt-8 text-center rounded-full border border-slate-300 px-5 py-3 font-semibold text-slate-900 hover:bg-slate-50">
            {user ? "Your account" : "Create a free account"}
          </Link>
        </div>

        <div className={`${card} border-[#0071e3] ring-1 ring-[#0071e3]`}>
          <h2 className="text-lg font-bold text-slate-900">{pro.name}</h2>
          <p className="mt-2 text-3xl font-extrabold text-slate-900">
            ${price}
            <span className="text-base font-semibold text-slate-500"> / {yearly ? "year" : "month"}</span>
          </p>
          <p className="text-sm text-slate-500">{yearly ? `$${(prices.yearly / 12).toFixed(2)} a month, paid once a year` : "cancel any time"}</p>
          <ul className="mt-6 space-y-3 text-[15px] text-slate-700 flex-1">
            {pro.points.map((p) => (
              <li key={p} className="flex gap-2.5"><Check className="w-5 h-5 text-[#0071e3] shrink-0" aria-hidden />{p}</li>
            ))}
          </ul>
          <button
            type="button"
            onClick={upgrade}
            disabled={busy}
            className="mt-8 rounded-full bg-[#0071e3] px-5 py-3 font-semibold text-white hover:bg-[#0062c4] disabled:opacity-60 cursor-pointer"
          >
            {busy ? "One moment…" : "Upgrade to Pro"}
          </button>
          {msg && <p role="alert" className="mt-3 text-sm text-red-600">{msg}</p>}
        </div>
      </div>
      <p className="mt-6 text-sm text-slate-500 max-w-2xl">
        Prices in {prices.currency}. Reaching a limit never deletes anything: your jobs and files stay in your account, ready to open and download.
      </p>
    </section>
  );
}

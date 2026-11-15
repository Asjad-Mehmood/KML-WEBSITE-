"use client";

// "Your download is starting": shown when a program's download starts (lib/downloadNotice.ts).
// Our installers aren't code-signed yet, so Windows SmartScreen may stop them the first time with
// "Windows protected your PC". The notice says so before it happens, shows the two clicks (More
// info, then Run anyway) on a picture of that window, mentions the browser's own "not commonly
// downloaded" check, and says why the file is safe. The download carries on underneath. "Don't
// show this again" is remembered on this browser.
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, FileCheck2, Info, ShieldCheck, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { DOWNLOAD_EVENT, type DownloadInfo } from "@/lib/downloadNotice";

const HIDE_KEY = "kml.download-notice.off";
const TOOLKIT = "/api/toolkit/download";

const hidden = () => {
  try {
    return localStorage.getItem(HIDE_KEY) === "1";
  } catch {
    return false;
  }
};

/** The SmartScreen window, drawn small: step 1 highlights More info, step 2 Run anyway */
function SmartScreenPicture({ step }: { step: 1 | 2 }) {
  return (
    <div aria-hidden className="relative rounded-xl bg-[#0063b1] p-4 text-white shadow-inner select-none">
      <p className="text-[17px] font-semibold leading-tight">Windows protected your PC</p>
      <p className="mt-2 text-[11.5px] leading-snug text-white/90">
        Microsoft Defender SmartScreen prevented an unrecognised app from starting. Running this app might put your PC at risk.
      </p>
      <p className={`mt-1.5 inline-block text-[11.5px] underline underline-offset-2 transition-all ${step === 1 ? "rounded bg-white/25 px-1 ring-2 ring-[#ffd21f]" : "text-white/80"}`}>
        More info
      </p>
      {/* the same height in both steps, so the window doesn't jump */}
      <p className={`mt-1.5 text-[11px] leading-snug text-white/85 ${step === 2 ? "" : "invisible"}`}>
        App: <span className="font-mono">Setup.exe</span>
        <br />
        Publisher: Unknown publisher
      </p>
      <div className="mt-3 flex justify-end gap-2">
        <span
          className={`rounded-sm border border-white/80 px-3 py-1 text-[11.5px] font-semibold ring-2 ring-[#ffd21f] ring-offset-2 ring-offset-[#0063b1] ${step === 2 ? "" : "invisible"}`}
        >
          Run anyway
        </span>
        <span className="rounded-sm border border-white/60 bg-white/10 px-3 py-1 text-[11.5px]">Don&apos;t run</span>
      </div>
      {/* the step in the list beside it: 2 More info, 3 Run anyway */}
      <span className="absolute -top-2.5 -left-2.5 flex h-6 w-6 items-center justify-center rounded-full bg-[#ffd21f] text-[12px] font-extrabold text-[#071a44]">{step + 1}</span>
    </div>
  );
}

export default function DownloadNotice() {
  const { user } = useAuth();
  const [info, setInfo] = useState<DownloadInfo | null>(null);
  const [off, setOff] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const lastFocus = useRef<HTMLElement | null>(null);

  const open = useCallback((d: DownloadInfo) => {
    if (hidden()) return;
    lastFocus.current = document.activeElement as HTMLElement | null;
    setOff(false);
    setStep(1);
    setInfo(d);
  }, []);

  // a program's button says the download started
  useEffect(() => {
    const on = (e: Event) => open((e as CustomEvent<DownloadInfo>).detail);
    window.addEventListener(DOWNLOAD_EVENT, on);
    return () => window.removeEventListener(DOWNLOAD_EVENT, on);
  }, [open]);

  // the Survey Toolkit's links go straight to its installer when signed in (signed out: sign-in first,
  // then /toolkit?download=start announces it)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || !user) return;
      const url = new URL(a.href, window.location.href);
      if (url.origin === window.location.origin && url.pathname === TOOLKIT) open({ program: "Survey Toolkit", file: "SurveyToolkit-Setup.exe", again: TOOLKIT });
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [user, open]);

  // the picture shows the two clicks in turn
  useEffect(() => {
    if (!info || info.zip) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = setInterval(() => setStep((s) => (s === 1 ? 2 : 1)), 2600);
    return () => clearInterval(t);
  }, [info]);

  const close = useCallback(() => {
    if (off) {
      try {
        localStorage.setItem(HIDE_KEY, "1");
      } catch {
        // private mode: it shows next time
      }
    }
    setInfo(null);
    lastFocus.current?.focus?.();
  }, [off]);

  useEffect(() => {
    if (!info) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [info, close]);

  if (!info) return null;
  const exe = !info.zip;

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-[2px] p-0 sm:p-6" onClick={(e) => e.target === e.currentTarget && close()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dl-title"
        className="dl-pop w-full sm:max-w-[560px] max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white text-slate-800 shadow-2xl"
      >
        <div className="flex items-start gap-3 border-b border-slate-100 px-5 sm:px-6 pt-5 pb-4">
          <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Download className="dl-bounce w-5 h-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <h2 id="dl-title" className="text-[18px] font-extrabold text-slate-900">
              Your download is starting
            </h2>
            <p className="text-[13.5px] text-slate-500 break-words">
              {info.program}
              {info.file ? (
                <>
                  {" · "}
                  <span className="font-mono text-[12.5px]">{info.file}</span>
                </>
              ) : null}
            </p>
          </div>
          <button ref={closeBtn} onClick={close} aria-label="Close" className="p-2 -mr-2 -mt-1 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 space-y-5">
          {exe ? (
            <>
              <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                <Info className="w-5 h-5 shrink-0 text-amber-600 mt-0.5" aria-hidden />
                <p className="text-[14px] leading-relaxed text-amber-900">
                  <strong>Windows may show a blue warning the first time.</strong> We&apos;re a new, small publisher and our installers aren&apos;t code-signed yet, so
                  Microsoft SmartScreen doesn&apos;t recognise them. It isn&apos;t a virus warning: it only means the program is new.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-4 items-center">
                <ol className="space-y-3 text-[14px]">
                  <li className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-[12px] font-bold text-white">1</span>
                    <span>
                      Open <strong>{info.file || "the installer"}</strong> from your Downloads.
                    </span>
                  </li>
                  <li className={`flex gap-3 transition-opacity ${step === 1 ? "" : "opacity-60"}`}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffd21f] text-[12px] font-bold text-[#071a44]">2</span>
                    <span>
                      If you see <em>Windows protected your PC</em>, click <strong>More info</strong>.
                    </span>
                  </li>
                  <li className={`flex gap-3 transition-opacity ${step === 2 ? "" : "opacity-60"}`}>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#ffd21f] text-[12px] font-bold text-[#071a44]">3</span>
                    <span>
                      Then click <strong>Run anyway</strong>. The setup starts as usual.
                    </span>
                  </li>
                </ol>
                <SmartScreenPicture step={step} />
              </div>
            </>
          ) : (
            <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Info className="w-5 h-5 shrink-0 text-slate-500 mt-0.5" aria-hidden />
              <p className="text-[14px] leading-relaxed text-slate-700">
                Open the zip from your Downloads and follow the install notes inside. Our files aren&apos;t code-signed yet, so your browser or Windows may ask
                you to confirm before it keeps or opens them.
              </p>
            </div>
          )}

          <details className="group rounded-2xl border border-slate-200 px-4 py-3">
            <summary className="cursor-pointer list-none text-[14px] font-semibold text-slate-800 flex items-center justify-between gap-3">
              Your browser says the file &ldquo;isn&apos;t commonly downloaded&rdquo;?
              <span aria-hidden className="text-slate-400 transition-transform group-open:rotate-90">›</span>
            </summary>
            <p className="mt-2 text-[13.5px] leading-relaxed text-slate-600">
              New files get that note too. In <strong>Edge</strong>: point at the download, press <strong>…</strong>, then <strong>Keep</strong>, then{" "}
              <strong>Show more</strong> and <strong>Keep anyway</strong>. In <strong>Chrome</strong>: press <strong>Keep</strong> in the downloads list.
            </p>
          </details>

          <div className="flex gap-3 text-[13.5px] text-slate-600">
            <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden />
            <p>
              <strong className="text-slate-800">Why it&apos;s safe:</strong> every installer comes from our own GitHub releases, built from our own code, and
              nothing else is bundled with it. Once the program is installed, Windows stops asking.
            </p>
          </div>
        </div>

        <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 border-t border-slate-100 bg-slate-50/70 px-5 sm:px-6 py-4">
          <label className="flex items-center gap-2 text-[13px] text-slate-500 cursor-pointer select-none">
            <input type="checkbox" checked={off} onChange={(e) => setOff(e.target.checked)} className="h-4 w-4 rounded border-slate-300 accent-slate-800" />
            Don&apos;t show this again
          </label>
          <div className="sm:ml-auto flex items-center gap-3">
            {info.again && (
              <a href={info.again} className="inline-flex items-center gap-1.5 py-2 text-[13.5px] font-semibold text-[#0071e3] hover:underline">
                <FileCheck2 className="w-4 h-4" aria-hidden /> Didn&apos;t start? Download again
              </a>
            )}
            <button onClick={close} className="inline-flex items-center gap-1.5 rounded-full bg-slate-900 px-5 py-2.5 text-[14px] font-bold text-white hover:bg-slate-800 cursor-pointer">
              <CheckCircle2 className="w-4 h-4" aria-hidden /> Got it
            </button>
          </div>
        </div>
        <p className="px-5 sm:px-6 pb-4 -mt-1 bg-slate-50/70 text-[12px] text-slate-400">
          Still stuck? <Link href="/contact?topic=problem" className="underline hover:text-slate-600">Tell us</Link> and we&apos;ll help.
        </p>
      </div>
    </div>
  );
}

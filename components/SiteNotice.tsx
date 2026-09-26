"use client";

import React, { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Megaphone, Wrench, X } from "lucide-react";
import { useSiteSettings } from "@/context/SiteSettings";

/* a dismissed announcement stays dismissed for this visit, until its text changes */
const KEY = "site_notice_hidden";
const listeners = new Set<() => void>();
const hiddenText = () => {
  try {
    return sessionStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const hide = (text: string) => {
  try {
    sessionStorage.setItem(KEY, text);
  } catch {
    // private mode: it shows again on the next page
  }
  listeners.forEach((fn) => fn());
};

/**
 * The announcement and the maintenance notice set in the admin page, on every page of the
 * site. It sits along the bottom, clear of the floating navigation bar.
 */
export default function SiteNotice() {
  const { announcement, maintenanceMode } = useSiteSettings();
  const path = usePathname() || "/";
  const hidden = useSyncExternalStore(subscribe, hiddenText, () => "");
  // the admin page shows the settings themselves; the web app shows its own maintenance page
  if (path.startsWith("/admin") || path === "/app") return null;

  const notices: { key: string; icon: React.ElementType; text: string; tone: string; closable: boolean }[] = [];
  if (maintenanceMode) {
    notices.push({
      key: "m",
      icon: Wrench,
      text: "We're doing maintenance. The web app and new sign-ups are paused for a short while; downloads and the Windows app work as usual.",
      tone: "bg-amber-50 text-amber-900 border-amber-200",
      closable: false,
    });
  }
  if (announcement && hidden !== announcement) {
    notices.push({ key: "a", icon: Megaphone, text: announcement, tone: "bg-[#0071e3] text-white border-[#0071e3]", closable: true });
  }
  if (!notices.length) return null;

  return (
    <div className="fixed bottom-3 inset-x-3 z-[60] flex flex-col items-center gap-2 pointer-events-none" role="region" aria-label="Site notices">
      {notices.map((n) => (
        <div
          key={n.key}
          role={n.key === "m" ? "alert" : "status"}
          className={`pointer-events-auto max-w-3xl w-full flex items-start gap-3 px-4 py-3 rounded-2xl border shadow-lg text-[13px] leading-snug ${n.tone}`}
        >
          <n.icon className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
          <p className="flex-1 min-w-0 break-words">{n.text}</p>
          {n.closable && (
            <button onClick={() => hide(n.text)} aria-label="Hide this notice" className="shrink-0 -m-1 p-1 rounded-lg hover:bg-white/15 cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

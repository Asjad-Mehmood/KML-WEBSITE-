"use client";

import { useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { Megaphone, Wrench, X } from "lucide-react";
import { usePublicSettings } from "@/lib/publicSettings";

const KEY = "site-notice-dismissed";
const listeners = new Set<() => void>();
const readDismissed = () => {
  try {
    return localStorage.getItem(KEY) || "";
  } catch {
    return "";
  }
};

// The admin's announcement (Settings → Announcement) and the maintenance
// notice, as a thin bar along the bottom of public pages. A visitor can close an
// announcement; it comes back when the text changes.
export default function SiteNotice() {
  const settings = usePublicSettings();
  const pathname = usePathname();
  const dismissed = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    readDismissed,
    () => ""
  );
  if (!settings || pathname?.startsWith("/admin") || pathname === "/app") return null;

  const maintenance = settings.maintenanceMode;
  const text = maintenance
    ? settings.maintenanceMessage || "The web app is down for maintenance for a short while. The Windows app works as usual."
    : settings.announcement;
  const tone = settings.announcementTone || "info";
  const link = !maintenance ? settings.announcementLink : "";
  if (!text || (!maintenance && dismissed === text)) return null;

  const close = () => {
    try {
      localStorage.setItem(KEY, text);
    } catch {
      // private mode: it just shows again next time
    }
    listeners.forEach((l) => l());
  };

  return (
    <div
      role="status"
      className={`fixed bottom-0 inset-x-0 z-[45] px-10 py-2.5 text-center text-[13px] font-medium shadow-[0_-4px_16px_rgba(0,0,0,0.08)] ${
        maintenance || tone === "warning"
          ? "bg-amber-50 text-amber-900 border-t border-amber-200"
          : tone === "success"
            ? "bg-emerald-600 text-white"
            : "bg-[#0071e3] text-white"
      }`}
    >
      {maintenance ? (
        <Wrench className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" aria-hidden />
      ) : (
        <Megaphone className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" aria-hidden />
      )}
      {text}
      {link && (
        <a href={link} className="ml-2 underline underline-offset-2 font-semibold whitespace-nowrap" {...(link.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
          Learn more
        </a>
      )}
      {!maintenance && (
        <button
          onClick={close}
          aria-label="Close announcement"
          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md cursor-pointer ${tone === "warning" ? "hover:bg-amber-100" : "hover:bg-white/15"}`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

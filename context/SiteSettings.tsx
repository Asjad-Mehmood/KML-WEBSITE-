"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { DEFAULT_PUBLIC_SETTINGS, type PublicSettings } from "@/lib/publicSettings";

type State = PublicSettings & { loaded: boolean };

const SiteSettingsContext = createContext<State>({ ...DEFAULT_PUBLIC_SETTINGS, loaded: false });

/** The admin settings the site follows, read once per page load. */
export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State>({ ...DEFAULT_PUBLIC_SETTINGS, loaded: false });
  useEffect(() => {
    let alive = true;
    fetch("/api/site-settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => alive && j?.settings && setS({ ...DEFAULT_PUBLIC_SETTINGS, ...j.settings, loaded: true }))
      .catch(() => alive && setS((x) => ({ ...x, loaded: true })));
    return () => {
      alive = false;
    };
  }, []);
  return <SiteSettingsContext.Provider value={s}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}

"use client";
// Admin settings the public pages read (from /api/settings/public), fetched
// once per page load and shared by every component that asks.
import { useEffect, useState } from "react";

export interface PublicSettings {
  requireAuthForDownload: boolean;
  maintenanceMode: boolean;
  announcement: string;
  appVersion?: string;
  installerFileName?: string;
  installerFileSize?: string;
}

let pending: Promise<PublicSettings | null> | null = null;

export function loadPublicSettings(): Promise<PublicSettings | null> {
  pending ??= fetch("/api/settings/public")
    .then((r) => (r.ok ? (r.json() as Promise<PublicSettings>) : null))
    .catch(() => null);
  return pending;
}

export function usePublicSettings(): PublicSettings | null {
  const [s, setS] = useState<PublicSettings | null>(null);
  useEffect(() => {
    let live = true;
    loadPublicSettings().then((v) => live && setS(v));
    return () => {
      live = false;
    };
  }, []);
  return s;
}

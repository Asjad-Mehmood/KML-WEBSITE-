"use client";
// Admin settings the public pages read (from /api/settings/public), fetched
// once per page load and shared by every component that asks.
import { useEffect, useState } from "react";
import type { DirectDownloads, DownloadProgram } from "@/lib/directDownloads";

export interface PublicSettings {
  requireAuthForDownload: boolean;
  maintenanceMode: boolean;
  announcement: string;
  appVersion?: string;
  installerFileName?: string;
  installerFileSize?: string;
  googleSignIn?: boolean;
  /** False while the admin has paused new accounts */
  signupsOpen?: boolean;
  announcementTone?: "info" | "success" | "warning";
  announcementLink?: string;
  maintenanceMessage?: string;
  /** Traverse adjust shown in the app */
  traverseEnabled?: boolean;
  /** Invite signed-out visitors to sign up after they look around */
  signupPrompt?: boolean;
  /** Ask for a review after a download */
  reviewPrompt?: boolean;
  /** The home page is the Survey Toolkit's: the menu bar's Download gets the Toolkit */
  toolkitHome?: boolean;
  /** Which programs' installers the website offers; a program missing here is offered */
  directDownloads?: Partial<DirectDownloads>;
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

/**
 * Whether the website offers [program]'s installer (Admin → Settings → Downloads): null while the
 * settings load, then true or false. The settings can't be read: offered, as before.
 */
export function useDirectDownload(program: DownloadProgram): boolean | null {
  const s = usePublicSettings();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadPublicSettings().then((v) => live && !v && setFailed(true));
    return () => {
      live = false;
    };
  }, []);
  if (failed) return true;
  if (!s) return null;
  return s.directDownloads?.[program] !== false;
}

/** The same, asked once more right before a download starts */
export async function directDownloadAllowed(program: DownloadProgram): Promise<boolean> {
  const s = await loadPublicSettings();
  return s?.directDownloads?.[program] !== false;
}

"use client";
// A Download click records the download, then opens the thank-you page, which
// starts the file. The installer address travels in sessionStorage so a later
// visit or refresh of the page doesn't start another download by itself.

const KEY = "pending-download";

export function goToDownload(push: (href: string) => void, url: string, version: string) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ url, version }));
  } catch {
    // storage blocked: the page still has a download button
  }
  push("/download/thanks");
}

export function clearPendingDownload() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // nothing to clear
  }
}

export function peekPendingDownload(): { url: string; version: string } | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    const v = raw ? JSON.parse(raw) : null;
    return v && typeof v.url === "string" && v.url.startsWith("https://github.com/") ? v : null;
  } catch {
    return null;
  }
}

"use client";
// "Your download is starting" (components/DownloadNotice.tsx): a program's Download button calls
// announceDownload() right after the file starts, and the notice explains what Windows may show
// next. The Survey Toolkit's links (/api/toolkit/download) are picked up by the notice itself.

export interface DownloadInfo {
  /** The program, as people know it: "Traverse & Level" */
  program: string;
  /** The file being saved: "TraverseLevel-Setup.exe" */
  file?: string;
  /** Where to start it again if nothing happened */
  again?: string;
  /** A zip or a plugin: Windows SmartScreen doesn't come into it, only the browser's own check */
  zip?: boolean;
}

export const DOWNLOAD_EVENT = "kml:download";

export function announceDownload(d: DownloadInfo) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<DownloadInfo>(DOWNLOAD_EVENT, { detail: d }));
}

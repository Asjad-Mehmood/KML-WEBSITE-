"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";
import { useAuth } from "../context/AuthContext";

/**
 * A plain download link that also records the download in the Downloads log when the visitor is
 * signed in (the same log as the program installers). Signed out, it is just the link.
 */
export default function TrackedLink({
  assetType,
  fileName,
  version,
  children,
  ...a
}: AnchorHTMLAttributes<HTMLAnchorElement> & { assetType: string; fileName: string; version: string; children: ReactNode }) {
  const { user, trackDownload } = useAuth();
  return (
    <a
      {...a}
      onClick={(e) => {
        a.onClick?.(e);
        if (user) void trackDownload(assetType, fileName, version);
      }}
    >
      {children}
    </a>
  );
}

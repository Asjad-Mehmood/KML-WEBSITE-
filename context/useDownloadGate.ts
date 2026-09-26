"use client";

import { useAuth } from "./AuthContext";
import { useSiteSettings } from "./SiteSettings";

/**
 * Runs a download straight away, or first asks the visitor to sign in, as the admin
 * setting "Require sign-in to download" says.
 */
export function useDownloadGate() {
  const { requireAuth } = useAuth();
  const { requireAuthForDownload } = useSiteSettings();
  return (action: () => void, reason = "Sign in or create a free account to download the Windows app.") => {
    if (requireAuthForDownload) requireAuth(action, reason);
    else action();
  };
}

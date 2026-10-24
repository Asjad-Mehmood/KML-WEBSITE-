"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export const ADSENSE_CLIENT = "ca-pub-5279736504936799";

// Pages without ads: sign-in, account, admin and the apps. Ads there earn little, can sit next
// to sign-in forms (against AdSense policy) and slow down the tools people work in.
const NO_ADS = [
  "/login", "/register", "/forgot-password", "/reset-password", "/dashboard", "/admin", "/app",
  "/link", "/app-signin", "/welcome", "/unsubscribe", "/download/thanks",
];

/**
 * Google AdSense, loaded after the page is ready (not before it, which slowed the first view of
 * every page), and only on public pages. The site-ownership tag stays in the page head.
 */
export default function AdSenseScript() {
  const path = usePathname() || "/";
  if (NO_ADS.some((p) => path === p || path.startsWith(`${p}/`))) return null;
  return (
    <Script
      id="adsbygoogle-init"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}

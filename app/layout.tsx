import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import SiteNotice from "../components/SiteNotice";
import AuthModal from "../components/AuthModal";
import { DEFAULT_TITLE, FACEBOOK_DOMAIN_VERIFICATION, FACEBOOK_PAGE_ID, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#0071e3",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s | Excel to KML",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "Excel to KML",
    "CSV to KML",
    "Excel to KMZ",
    "Excel to DXF",
    "survey coordinates to Google Earth",
    "easting northing to latitude longitude",
    "UTM to lat long",
    "EPSG coordinate converter",
    "DLTM to WGS84",
    "QNG to WGS84",
    "total station CSV to KML",
    "KMZ with photos",
    "survey benchmark converter",
  ],
  authors: [{ name: "Asjad Mehmood" }],
  creator: "Asjad Mehmood",
  publisher: SITE_NAME,
  applicationName: SITE_NAME,
  category: "technology",
  manifest: "/site.webmanifest",
  // /favicon.ico comes from app/favicon.ico (16–256 px). Google needs a square icon of 48 px or more.
  icons: {
    icon: [
      { url: "/assets/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/assets/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/assets/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  // Each indexable page sets its own canonical; pages without one (sign-in etc.) are noindex
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
    images: [OG_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE.url],
  },
  formatDetection: { telephone: false, address: false, email: false },
  // Proves to Meta that we own exceltokml.com (Business Suite → Brand safety → Domains)
  ...(FACEBOOK_DOMAIN_VERIFICATION ? { other: { "facebook-domain-verification": FACEBOOK_DOMAIN_VERIFICATION } } : {}),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased scroll-smooth`}
    >
      <head>
        <link rel="preconnect" href="https://api.github.com" />
        {/* Ties the site to the official Facebook Page (needs property=, which Metadata can't set) */}
        <meta property="fb:pages" content={FACEBOOK_PAGE_ID} />
      </head>
      <body className="min-h-screen bg-white text-[#1d1d1f] selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
        <AuthProvider>
          {children}
          <AuthModal />
          <SiteNotice />
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}

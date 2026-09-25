import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import Preloader from "../components/Preloader";
import { DEFAULT_TITLE, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

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
    template: "%s | Excel to KML Pro",
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
  icons: {
    icon: [
      { url: "/assets/favicon.ico" },
      { url: "/assets/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/assets/icon-512.png", sizes: "512x512", type: "image/png" }],
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
      </head>
      <body className="min-h-screen bg-white text-[#1d1d1f] selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
        <Preloader />
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";
import Preloader from "../components/Preloader";
import StructuredData from "../components/StructuredData";

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

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://exceltokml.com";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "Excel to KML Pro — Free Survey Coordinate & Benchmark Converter",
    template: "%s | Excel to KML Pro",
  },
  description:
    "Free Excel to KML Pro converts survey spreadsheets and CSV coordinates into Google Earth 3D KML/KMZ. Supports 5,800+ EPSG coordinate systems, Helmert site calibration, elevation extrusions, and geotagged photos. 100% offline & secure.",
  keywords: [
    "Excel to KML",
    "Convert Excel to KML",
    "CSV to KML",
    "Excel to KMZ",
    "Survey Benchmark Converter",
    "KML Converter",
    "EPSG Grid Converter",
    "KMZ Photo Survey",
    "Google Earth Surveyor",
    "DLTM to WGS84",
    "QNG to KML",
    "Helmert Transformation 2D",
    "UTM to Lat Long",
    "Northing Easting to Latitude Longitude",
    "Civil 3D to Google Earth",
    "Survey Coordinates to KML",
    "Cadastral Boundary KML",
    "Elevation Extrusion Google Earth",
    "Free KML Converter Windows",
    "Offline Coordinate Converter",
    "Total Station CSV to KML",
  ],
  authors: [{ name: "Asjad Mehmood" }, { name: "chaudaryyabdullah03-collab" }],
  creator: "Excel to KML Pro",
  publisher: "Excel to KML Pro",
  applicationName: "Excel to KML Pro",
  category: "Geomatics / GIS Application",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/assets/favicon.ico" },
      { url: "/assets/icon.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/assets/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  alternates: {
    canonical: baseUrl,
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: baseUrl,
    siteName: "Excel to KML Pro",
    title: "Excel to KML Pro — Free Survey Coordinate & Benchmark Converter",
    description:
      "Convert raw survey spreadsheets into Google Earth 3D models with 5,800+ EPSG coordinate systems, local site calibration, and 3D elevation extrusions. 100% offline.",
    locale: "en_US",
    images: [
      {
        url: "/assets/hero_geospatial.jpg",
        width: 1200,
        height: 630,
        alt: "Excel to KML Pro Geospatial Benchmark & Coordinate Converter Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel to KML Pro — Free Survey Coordinate & Benchmark Converter",
    description:
      "Turn Excel & CSV survey coordinates into Google Earth 3D KML/KMZ with 5,800+ EPSG coordinate systems. 100% offline & free.",
    images: ["/assets/hero_geospatial.jpg"],
    creator: "@ExcelToKMLPro",
  },
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
        <StructuredData />
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

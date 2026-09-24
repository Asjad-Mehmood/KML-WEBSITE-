import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import AuthModal from "../components/AuthModal";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://exceltokml.pro"),
  title: "Excel to KML Pro — Download Free Survey Benchmark Converter",
  description:
    "Download Excel to KML Pro — The precision survey benchmark converter. Convert Excel and CSV coordinates to Google Earth KML & KMZ with 6,864 EPSG world grids, site calibration, and geotagged photos. 100% offline.",
  keywords: [
    "Excel to KML",
    "CSV to KML",
    "Survey Benchmark Converter",
    "KML Converter",
    "EPSG Grid Converter",
    "KMZ Photo Survey",
    "Google Earth Surveyor",
    "DLTM to WGS84",
    "Helmert Transformation",
  ],
  authors: [{ name: "Asjad Mehmood" }, { name: "chaudaryyabdullah03-collab" }],
  icons: {
    icon: "/assets/favicon.ico",
    apple: "/assets/icon.png",
  },
  openGraph: {
    type: "website",
    title: "Excel to KML Pro — Survey Benchmark Converter",
    description:
      "Turn Excel & CSV survey coordinates into Google Earth 3D KML & KMZ with 6,864 world grids. 100% offline and free.",
    images: ["/assets/hero_geospatial.jpg"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Excel to KML Pro — Download Free Survey Benchmark Converter",
    description:
      "Convert Excel and CSV to Google Earth KML with 6,864 EPSG grids, boundary polygons, and site photos.",
    images: ["/assets/hero_geospatial.jpg"],
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
      <body className="min-h-screen bg-white text-[#1d1d1f] selection:bg-[#0071e3]/20 selection:text-[#0071e3]">
        <AuthProvider>
          {children}
          <AuthModal />
        </AuthProvider>
      </body>
    </html>
  );
}

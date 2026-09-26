import type { Metadata } from "next";
import ThanksClient from "./ThanksClient";

export const metadata: Metadata = {
  title: "Thanks for Downloading",
  description: "Your Excel to KML download is starting. How to install it and where to go next.",
  alternates: { canonical: "/download/thanks" },
  robots: { index: false, follow: true },
};

export default function DownloadThanksPage() {
  return <ThanksClient />;
}

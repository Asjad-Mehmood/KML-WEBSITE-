import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { FaqStructuredData, HomeStructuredData } from "../components/StructuredData";
import { DEFAULT_TITLE, SITE_DESCRIPTION, openGraphFor } from "@/lib/site";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: openGraphFor("/", DEFAULT_TITLE, SITE_DESCRIPTION),
};

export default function Home() {
  return (
    <>
      <HomeStructuredData />
      <FaqStructuredData />
      <HomeClient />
    </>
  );
}

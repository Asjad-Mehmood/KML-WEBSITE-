import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { FaqStructuredData, HomeStructuredData } from "../components/StructuredData";
import { DEFAULT_TITLE, SITE_DESCRIPTION, openGraphFor } from "@/lib/site";
import { HOME_HEROES, getExtraSettings } from "@/lib/siteSettings";
import { publicStats } from "@/lib/publicStats";

// Built once and kept; saving the hero choice in Admin → Settings builds it again at once,
// and it is refreshed every few minutes (which also refreshes the user and download counts)
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: openGraphFor("/", DEFAULT_TITLE, SITE_DESCRIPTION),
};

export default async function Home() {
  const [{ homeHero }, stats] = await Promise.all([getExtraSettings(), publicStats()]);
  const hero = HOME_HEROES.includes(homeHero) ? homeHero : "new";
  return (
    <>
      <HomeStructuredData />
      {/* the same questions the home page shows: about every program, or the classic page's shorter FAQ */}
      {hero === "classic" ? <FaqStructuredData short /> : <FaqStructuredData home />}
      <HomeClient heroStyle={hero} stats={stats} />
    </>
  );
}

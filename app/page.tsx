import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { FaqStructuredData, HomeStructuredData } from "../components/StructuredData";
import { DEFAULT_TITLE, SITE_DESCRIPTION, openGraphFor } from "@/lib/site";
import { HOME_HEROES, getExtraSettings } from "@/lib/siteSettings";
import { publicStats } from "@/lib/publicStats";
import { frontPageData } from "@/lib/toolkit/frontPage";
import ToolkitHome from "@/components/toolkit/home/ToolkitHome";
import ToolkitStructuredData from "@/components/toolkit/home/ToolkitStructuredData";
import { TOOLKIT_DESCRIPTION, TOOLKIT_TITLE } from "@/lib/toolkit/homeFaq";
import { homeNews, homeReviews } from "@/lib/toolkit/homeNews";

// Built once and kept; saving the hero choice in Admin → Settings builds it again at once,
// and it is refreshed every few minutes (which also refreshes the user and download counts)
export const revalidate = 300;

/** Which page the home page is: the hero chosen in Admin → Settings; the Toolkit's only while it is open to everyone */
async function heroOf() {
  const { homeHero, toolkitPublic } = await getExtraSettings();
  return HOME_HEROES.includes(homeHero) && (homeHero !== "toolkit" || toolkitPublic) ? homeHero : "new";
}

// The title and description say what the page shows: the Survey Toolkit's when the home page is the Toolkit's
export async function generateMetadata(): Promise<Metadata> {
  if ((await heroOf().catch(() => "new")) === "toolkit") {
    return {
      title: { absolute: `${TOOLKIT_TITLE} | SurveyX Digital` },
      description: TOOLKIT_DESCRIPTION,
      alternates: { canonical: "/" },
      openGraph: openGraphFor("/", `${TOOLKIT_TITLE} | SurveyX Digital`, TOOLKIT_DESCRIPTION),
    };
  }
  return { alternates: { canonical: "/" }, openGraph: openGraphFor("/", DEFAULT_TITLE, SITE_DESCRIPTION) };
}

export default async function Home() {
  // the Survey Toolkit hub (as on /toolkit) only while the Toolkit is open to everyone
  const [hero, stats] = await Promise.all([heroOf(), publicStats()]);
  if (hero === "toolkit") {
    const [{ tools, toolkitVersion }, news, reviews] = await Promise.all([frontPageData(), homeNews(), homeReviews()]);
    return (
      <>
        <HomeStructuredData />
        <ToolkitStructuredData path="/" version={toolkitVersion} />
        <ToolkitHome tools={tools} toolkitVersion={toolkitVersion} news={news} reviews={reviews} />
      </>
    );
  }
  return (
    <>
      <HomeStructuredData />
      {/* the same questions the home page shows: about every program, or the classic page's shorter FAQ */}
      {hero === "classic" ? <FaqStructuredData short /> : <FaqStructuredData home />}
      <HomeClient heroStyle={hero} stats={stats} />
    </>
  );
}

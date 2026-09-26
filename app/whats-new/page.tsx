import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import NextSteps from "../../components/NextSteps";
import { BreadcrumbStructuredData } from "../../components/StructuredData";
import ReleaseList from "./ReleaseList";
import { openGraphFor } from "@/lib/site";

const TITLE = "What's New";
const DESCRIPTION = "What changed in each version of Excel to KML: new features, fixes and how to update.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/whats-new" },
  openGraph: openGraphFor("/whats-new", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default function WhatsNewPage() {
  return (
    <PageShell>
      <BreadcrumbStructuredData name="What's new" path="/whats-new" />
      <div className="max-w-[900px] mx-auto px-5 sm:px-8">
        <PageIntro
          eyebrow="What's new"
          title="Release notes"
          lead="What changed in each version. The Windows app offers every new version by itself when it opens."
        />
        <ReleaseList />
        <NextSteps title="Get the latest version" />
      </div>
    </PageShell>
  );
}

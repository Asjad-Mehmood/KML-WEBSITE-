import type { Metadata } from "next";
import PageShell from "../../components/PageShell";
import PageIntro from "../../components/PageIntro";
import UnsubscribeForm from "./UnsubscribeForm";
import { verifyUnsubscribeToken } from "@/lib/releaseEmail";
import { isOptedOut } from "@/lib/releases";

export const metadata: Metadata = {
  title: "Release emails",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// From the "Stop release emails" link in a release announcement
export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t = "" } = await searchParams;
  const email = verifyUnsubscribeToken(t);
  const out = email ? await isOptedOut(email).catch(() => false) : false;
  return (
    <PageShell>
      <div className="max-w-[720px] mx-auto px-5 sm:px-8">
        {email ? (
          <>
            <PageIntro
              eyebrow="Release emails"
              title={out ? "You're unsubscribed" : "Stop release emails?"}
              lead={
                out ? (
                  <>We won&apos;t send release announcements to <strong className="text-slate-900">{email}</strong>. Account emails such as password resets still arrive.</>
                ) : (
                  <>We email <strong className="text-slate-900">{email}</strong> when there&apos;s a new version of Excel to KML, RoadPro, Traverse &amp; Level or Project Folder Manager. Account emails such as password resets still arrive either way.</>
                )
              }
            />
            <UnsubscribeForm token={t} initiallyOut={out} />
          </>
        ) : (
          <PageIntro
            eyebrow="Release emails"
            title="This link isn't valid"
            lead="It may have been cut off by your email app. Open the link from the email again, or write to us and we'll take you off the list."
          />
        )}
      </div>
    </PageShell>
  );
}

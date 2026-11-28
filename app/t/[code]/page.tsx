import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import PageShell from "../../../components/PageShell";
import JoinTeam from "../../../components/JoinTeam";
import { teamByCode } from "@/lib/teams";

// /t/<code>: a team's invite link. Shows the team, then Join (signed in) or Sign in / Create account.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Join a team", robots: { index: false, follow: false } };

export default async function JoinTeamPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const team = await teamByCode(code).catch(() => null);
  return (
    <PageShell>
      <div className="max-w-md mx-auto px-5 py-16 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0071e3]/10 text-[#0071e3]">
          <Users className="h-7 w-7" aria-hidden />
        </span>
        {team ? (
          <>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">Join {team.name}</h1>
            <p className="mt-2 text-[15px] text-slate-600">
              {team.ownerName} invited you to their team on SurveyX Digital ({team.members} {team.members === 1 ? "person" : "people"} so far). In a team you
              share Excel to KML, Traverse &amp; Level and Slope Calculator jobs, and copy each other&apos;s into your own account.
            </p>
            <JoinTeam code={code} />
          </>
        ) : (
          <>
            <h1 className="mt-5 text-2xl font-bold text-slate-900">This invite link doesn&apos;t work</h1>
            <p className="mt-2 text-[15px] text-slate-600">It may have been replaced by a new one. Ask whoever sent it for the current link.</p>
            <Link href="/dashboard" className="mt-6 inline-block rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#0062c4]">
              Go to your account
            </Link>
          </>
        )}
      </div>
    </PageShell>
  );
}

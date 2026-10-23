import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthShell from "../../components/AuthShell";
import { sessionForToken } from "@/lib/serverSession";
import { normCode } from "@/lib/deviceLink";
import LinkForm from "./LinkForm";

export const metadata: Metadata = {
  title: "Sign in an app with a code",
  robots: { index: false, follow: false },
};

// Opened from an app window (Traverse & Level's Windows program) that shows a sign-in code.
// Signed out: sign in first (Google, email, or an admin's email code), then come back here.
export default async function LinkPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const code = normCode((await searchParams).code);
  const session = await sessionForToken((await cookies()).get("surveyor_auth_token")?.value);
  if (!session) redirect(`/login?next=${encodeURIComponent(code ? `/link?code=${code}` : "/link")}`);
  return (
    <AuthShell title="Sign in an app" subtitle="Enter the code shown in Traverse & Level on your computer. It signs that window in with your account.">
      <LinkForm email={session.user.email} initial={code} />
    </AuthShell>
  );
}

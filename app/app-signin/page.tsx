import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AuthShell, { buttonClass } from "../../components/AuthShell";
import { sessionForToken } from "@/lib/serverSession";
import { appSigninPath, parseAppLink } from "@/lib/appLink";

export const metadata: Metadata = {
  title: "Sign in to the Windows app",
  robots: { index: false, follow: false },
};

// Opened by the Windows app's "Continue with Google" / sign-in in the browser.
// Signed out: sign in first (Google or email), then come back here. Signed in:
// confirm, and the account is handed to the app on this computer.
export default async function AppSigninPage({ searchParams }: { searchParams: Promise<{ port?: string; state?: string }> }) {
  const q = await searchParams;
  const link = parseAppLink(q.port, q.state);
  if (!link) {
    return (
      <AuthShell title="This link has expired" subtitle="Go back to Excel to KML on your computer and click Continue with Google again.">
        <span />
      </AuthShell>
    );
  }
  const session = await sessionForToken((await cookies()).get("surveyor_auth_token")?.value);
  if (!session) redirect(`/login?next=${encodeURIComponent(appSigninPath(link.port, link.state))}`);

  return (
    <AuthShell title="Sign in to the Windows app" subtitle="Excel to KML on this computer asked to sign in with your account.">
      <form method="post" action="/api/auth/app-link" className="space-y-4">
        <input type="hidden" name="port" value={link.port} />
        <input type="hidden" name="state" value={link.state} />
        <p className="text-center text-sm text-slate-700">
          Signed in as <strong>{session.user.email}</strong>
        </p>
        <button type="submit" className={buttonClass}>
          Continue to the app
        </button>
        <p className="text-center text-xs text-slate-500">
          Didn&apos;t start this from Excel to KML on your computer? Just close this page.
        </p>
      </form>
    </AuthShell>
  );
}

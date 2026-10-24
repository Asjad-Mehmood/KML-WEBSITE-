import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import AuthShell, { buttonClass } from "../../components/AuthShell";

export const metadata: Metadata = {
  title: "Confirm your email",
  robots: { index: false, follow: false },
};

// Where the button in the confirmation email lands (/api/auth/verify-email confirms, then sends people here)
export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  if (status === "ok") {
    return (
      <AuthShell title="Your email is confirmed" subtitle="Thank you. Your account is ready.">
        <div className="space-y-4 text-center">
          <CheckCircle2 className="mx-auto w-12 h-12 text-emerald-600" aria-hidden />
          <p className="text-sm text-slate-600 leading-relaxed">
            Go back to the app or website where you signed up and sign in with your email and password.
          </p>
          <Link href="/login" className={`${buttonClass} inline-flex justify-center`}>
            Sign in on the website
          </Link>
        </div>
      </AuthShell>
    );
  }
  const failed = status === "error";
  return (
    <AuthShell title={failed ? "Something went wrong" : "This link has expired"} subtitle={failed ? "We couldn't confirm your email just now." : "Confirmation links work for 24 hours, and only the newest one works."}>
      <div className="space-y-4 text-center">
        {failed ? <AlertTriangle className="mx-auto w-12 h-12 text-amber-500" aria-hidden /> : <Clock className="mx-auto w-12 h-12 text-slate-400" aria-hidden />}
        <p className="text-sm text-slate-600 leading-relaxed">
          {failed ? "Please open the link again in a few minutes." : "Sign in with your email and password: we'll send you a new code and link."}
        </p>
        <Link href="/login" className={`${buttonClass} inline-flex justify-center`}>
          Sign in
        </Link>
      </div>
    </AuthShell>
  );
}

import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionForToken } from "@/lib/serverSession";
import { safeNextPath } from "@/lib/authRedirect";
import WelcomeClient from "./WelcomeClient";

export const metadata: Metadata = {
  title: "Complete your account",
  robots: { index: false, follow: false },
};

// After "Continue with Google" creates an account: ask for organisation and
// occupation, then carry on to ?next
export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNextPath((await searchParams).next);
  const session = await sessionForToken((await cookies()).get("surveyor_auth_token")?.value);
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  const u = session.user;
  return (
    <WelcomeClient
      next={next}
      firstName={(u.name || "").split(" ")[0]}
      email={u.email}
      organization={u.organization && u.organization !== "Independent Surveyor" ? u.organization : ""}
      occupation={u.role && u.role !== "Surveyor" ? u.role : ""}
    />
  );
}

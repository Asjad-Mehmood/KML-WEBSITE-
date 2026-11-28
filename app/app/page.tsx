import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import WebAppClient from "./WebAppClient";
import { db } from "@/lib/db";
import { sessionForToken } from "@/lib/auth/serverSession";
import { WEB_APP_LOGIN_URL } from "@/lib/auth/authRedirect";
import { getExtraSettings } from "@/lib/content/siteSettings";
import { IN_TOOLKIT_COOKIE } from "@/lib/toolkit/inToolkit";

// Checked on every request: the web app is for signed-in users only
export const dynamic = "force-dynamic";

export default async function WebAppPage() {
  const jar = await cookies();
  const token = jar.get("surveyor_auth_token")?.value;
  // Inside Survey Toolkit: the app alone, without the website's bar (no way out to the website)
  const inToolkit = jar.get(IN_TOOLKIT_COOKIE)?.value === "1";
  const session = await sessionForToken(token);
  if (!session) redirect(WEB_APP_LOGIN_URL);
  // Admin setting "Maintenance mode": the web app pauses for everyone but admins
  const settings = await db.getSettings().catch(() => null);
  if (settings?.maintenanceMode && !db.isAdmin(session.user)) return <Maintenance message={(await getExtraSettings()).maintenanceMessage} inToolkit={inToolkit} />;
  return <WebAppClient inToolkit={inToolkit} />;
}

function Maintenance({ message, inToolkit }: { message: string; inToolkit: boolean }) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-5">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold text-slate-900">The web app is down for maintenance</h1>
        <p className="mt-3 text-[15px] text-slate-600 leading-relaxed">
          {message || "We're making some improvements and will be back shortly. The Windows app keeps working as usual."}
        </p>
        {!inToolkit && <div className="mt-6 flex justify-center gap-3">
          <Link href="/" className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50">
            Back to website
          </Link>
          <Link href="/download" className="px-5 py-2.5 rounded-xl bg-[#0071e3] text-white text-sm font-semibold hover:bg-[#0077ed]">
            Get the Windows app
          </Link>
        </div>}
      </div>
    </main>
  );
}

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import WebAppClient from "./WebAppClient";
import { sessionForToken } from "@/lib/serverSession";
import { WEB_APP_LOGIN_URL } from "@/lib/authRedirect";

// Checked on every request: the web app is for signed-in users only
export const dynamic = "force-dynamic";

export default async function WebAppPage() {
  const token = (await cookies()).get("surveyor_auth_token")?.value;
  const session = await sessionForToken(token);
  if (!session) redirect(WEB_APP_LOGIN_URL);
  return <WebAppClient />;
}

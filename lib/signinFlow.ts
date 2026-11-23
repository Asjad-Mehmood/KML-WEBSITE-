// The two-step sign-in (/signin/identifier, then /signin/password): its address.
//
//   /signin/identifier?continue=https%3A%2F%2Fwww.exceltokml.com%2Fapp&flow=web&state=…
//
// continue: where they go once signed in, a full address on the main site or the dashboard
//   address (lib/dashboardHost); anything else is the home page
// flow:     "web" (the website)
// state:    expiry . random . HMAC of both and of continue (AUTH_SECRET). A link that is old
//           (30 minutes), changed or made up gets a new state: the sign-in starts again
//
// Server only.
import crypto from "crypto";
import { SITE_URL } from "@/lib/site";
import { dashboardHost, isDashboardPath } from "@/lib/dashboardHost";
import { safeNextPath } from "@/lib/authRedirect";

const STATE_MINUTES = 30;
const secret = () => process.env.AUTH_SECRET || process.env.DATABASE_URL || "excel-to-kml";
const mac = (data: string) => crypto.createHmac("sha256", secret()).update(`signin:${data}`).digest("base64url").slice(0, 32);

/** The full address for a path of the site: the dashboard address for /dashboard… when it has one */
export function continueUrl(next: string): string {
  const path = safeNextPath(next);
  const base = isDashboardPath(path) ? `https://${dashboardHost()}` : SITE_URL;
  return `${base}${path}`;
}

/** The path a continue address goes to, or "/" when it isn't one of the site's addresses */
export function nextFromContinue(raw: string | null | undefined): string {
  if (!raw) return "/";
  try {
    const u = new URL(raw);
    const site = new URL(SITE_URL);
    const dash = dashboardHost();
    const ours = u.host === site.host || u.host === site.host.replace(/^www\./, "") || (!!dash && u.host === dash);
    if (!ours || !/^https?:$/.test(u.protocol)) return "/";
    return safeNextPath(`${u.pathname}${u.search}`);
  } catch {
    // a bare path is fine too
    return safeNextPath(raw);
  }
}

export function makeState(cont: string): string {
  const exp = (Math.floor(Date.now() / 1000) + STATE_MINUTES * 60).toString(36);
  const nonce = crypto.randomBytes(9).toString("base64url");
  return `${exp}.${nonce}.${mac(`${exp}.${nonce}.${cont}`)}`;
}

export function stateIsGood(state: string | null | undefined, cont: string): boolean {
  const m = /^([0-9a-z]{1,10})\.([A-Za-z0-9_-]{12})\.([A-Za-z0-9_-]{32})$/.exec(state || "");
  if (!m) return false;
  if (parseInt(m[1], 36) * 1000 < Date.now()) return false;
  const want = Buffer.from(mac(`${m[1]}.${m[2]}.${cont}`));
  const got = Buffer.from(m[3]);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

/** The query of a sign-in step: continue, flow and a fresh state (plus an error to show, if any) */
export function signinQuery(next: string, error?: string | null): string {
  const cont = continueUrl(next);
  const q = new URLSearchParams({ continue: cont, flow: "web", state: makeState(cont) });
  if (error && /^[a-z-]{1,40}$/.test(error)) q.set("error", error);
  return q.toString();
}

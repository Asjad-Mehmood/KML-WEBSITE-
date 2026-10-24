// Catches email addresses that can't be real before an account is made with them: a mistyped
// domain (gmial.com), a throwaway inbox (mailinator.com), a reserved name (example.com) or a
// domain that has no mail server. The emailed code (lib/emailVerify.ts) proves the rest.
import { promises as dns } from "dns";

export type EmailCheck = { ok: true; email: string } | { ok: false; error: string };

// The usual slips on the big free mailboxes
const TYPOS: Record<string, string> = {
  "gmial.com": "gmail.com", "gamil.com": "gmail.com", "gmai.com": "gmail.com", "gmal.com": "gmail.com",
  "gnail.com": "gmail.com", "gmaill.com": "gmail.com", "gmail.co": "gmail.com", "gmail.con": "gmail.com",
  "gmail.cm": "gmail.com", "gmail.om": "gmail.com", "gmail.cmo": "gmail.com", "gmail.comm": "gmail.com",
  "gmailcom": "gmail.com", "gmali.com": "gmail.com", "gimal.com": "gmail.com", "gmaik.com": "gmail.com",
  "gmail.c": "gmail.com", "gmail.in": "gmail.com", "gmil.com": "gmail.com", "g.mail.com": "gmail.com",
  "yaho.com": "yahoo.com", "yahooo.com": "yahoo.com", "yahoo.co": "yahoo.com", "yahoo.con": "yahoo.com", "yhoo.com": "yahoo.com",
  "hotmial.com": "hotmail.com", "hotmal.com": "hotmail.com", "hotmail.co": "hotmail.com", "hotmail.con": "hotmail.com", "hotmai.com": "hotmail.com",
  "outlok.com": "outlook.com", "outllok.com": "outlook.com", "outlook.co": "outlook.com", "outlook.con": "outlook.com",
  "iclod.com": "icloud.com", "icloud.co": "icloud.com", "icoud.com": "icloud.com",
};

// Throwaway inboxes: anyone can read them, so they prove nothing about who signed up
const DISPOSABLE = new Set([
  "mailinator.com", "mailinator.net", "guerrillamail.com", "guerrillamail.net", "guerrillamail.org", "guerrillamail.biz",
  "guerrillamail.info", "guerrillamailblock.com", "sharklasers.com", "grr.la", "pokemail.net", "spam4.me",
  "10minutemail.com", "10minutemail.net", "20minutemail.com", "tempmail.com", "temp-mail.org", "temp-mail.io",
  "tempmail.net", "tempmailo.com", "tempail.com", "tmpmail.org", "tmpmail.net", "tmpeml.com", "tempr.email",
  "yopmail.com", "yopmail.net", "yopmail.fr", "trashmail.com", "trashmail.de", "trashmail.net", "getnada.com",
  "nada.email", "dispostable.com", "maildrop.cc", "throwawaymail.com", "fakeinbox.com", "mintemail.com", "mohmal.com",
  "emailondeck.com", "burnermail.io", "mailnesia.com", "mytemp.email", "discard.email", "mailcatch.com",
  "inboxkitten.com", "1secmail.com", "1secmail.org", "1secmail.net", "mail.tm", "emailfake.com", "fakemail.net",
  "moakt.com", "tempinbox.com", "dropmail.me", "spambox.us", "mailpoof.com", "getairmail.com", "emltmp.com",
  "linshiyouxiang.net", "33mailbox.com", "anonbox.net", "mailforspam.com", "spamgourmet.com", "trbvm.com",
  "byom.de", "wegwerfmail.de", "einrot.com", "cuvox.de", "armyspy.com", "dayrep.com", "fleckens.hu", "gustr.com",
  "jourrapide.com", "rhyta.com", "superrito.com", "teleworm.us", "tempmailaddress.com", "emailtemporanea.net",
  "mailsac.com", "mvrht.net", "harakirimail.com", "mailnull.com", "incognitomail.org", "jetable.org", "mail-temp.com",
  "mail7.io", "minuteinbox.com", "owlymail.com", "luxusmail.org", "zetmail.com", "vomoto.com", "kzccv.com",
  "tempmail.plus", "mailto.plus", "fexpost.com", "fexbox.org",
]);

// Names set aside for examples and testing: no one receives mail there
const RESERVED = /(^|\.)(example\.(com|net|org)|test|invalid|localhost|local|example)$/;

const SHAPE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/;

// A domain's answer is kept for a while: sign-ups often come in from the same few domains
const mxCache = new Map<string, { at: number; ok: boolean | null }>();
const MX_CACHE_MS = 6 * 3600_000;

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, reject) => setTimeout(() => reject(Object.assign(new Error("timeout"), { code: "ETIMEOUT" })), ms))]);
}

/** true: the domain takes mail; false: it can't (no such domain, no mail server); null: couldn't tell */
async function domainTakesMail(domain: string): Promise<boolean | null> {
  const hit = mxCache.get(domain);
  if (hit && Date.now() - hit.at < MX_CACHE_MS) return hit.ok;
  let ok: boolean | null;
  try {
    const mx = await withTimeout(dns.resolveMx(domain), 4000);
    // "0 ." is a null MX: the domain says it never takes mail
    ok = mx.some((r) => r.exchange && r.exchange !== ".");
  } catch (err) {
    const code = (err as { code?: string }).code;
    if (code === "ENOTFOUND" || code === "ENODATA" || code === "NXDOMAIN") {
      // with no mail server named, mail goes to the domain's own address, if it has one
      try {
        const a = await withTimeout(dns.resolve4(domain), 3000);
        ok = a.length > 0;
      } catch (e2) {
        const c2 = (e2 as { code?: string }).code;
        ok = c2 === "ENOTFOUND" || c2 === "ENODATA" || c2 === "NXDOMAIN" ? false : null;
      }
    } else ok = null; // the lookup itself failed (time-out, no DNS here): the code still proves it
  }
  if (ok !== null) mxCache.set(domain, { at: Date.now(), ok });
  if (mxCache.size > 2000) mxCache.clear();
  return ok;
}

/** The address cleaned up, or the reason it can't be used to make an account */
export async function checkEmail(raw: unknown): Promise<EmailCheck> {
  const email = String(raw ?? "").trim().toLowerCase();
  const [local = "", domain = ""] = email.split("@");
  if (!email || email.length > 254 || local.length > 64 || !SHAPE.test(email) || local.startsWith(".") || local.endsWith(".") || local.includes("..")) {
    return { ok: false, error: "Please enter a valid email address, like name@gmail.com." };
  }
  if (TYPOS[domain]) return { ok: false, error: `Check the email address. Did you mean ${local}@${TYPOS[domain]}?` };
  if (RESERVED.test(domain)) return { ok: false, error: "Please use your real email address. We send a code to it to confirm your account." };
  if (DISPOSABLE.has(domain) || [...DISPOSABLE].some((d) => domain.endsWith("." + d))) {
    return { ok: false, error: "Throwaway email addresses can't be used. Please use your own email, such as your work or Gmail address." };
  }
  if ((await domainTakesMail(domain)) === false) {
    return { ok: false, error: `Emails can't be delivered to "@${domain}". Check the address for a typing mistake.` };
  }
  return { ok: true, email };
}

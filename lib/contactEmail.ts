// Email for the contact form: an alert to the support inbox (reply goes
// straight to the sender). The sender is not emailed.
import { SITE_URL } from "@/lib/site";
import { TOPICS, type Topic } from "@/lib/contactMessages";

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

const shell = (body: string) =>
  `<!doctype html><html><body style="margin:0;background:#f5f7fa;font-family:Segoe UI,Arial,sans-serif;color:#0f172a"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:14px;border:1px solid #e2e8f0"><tr><td style="padding:26px 28px">${body}</td></tr></table></td></tr></table></body></html>`;

export function supportAlert(m: { ref: string; name: string; email: string; topic: Topic; message: string; details: Record<string, string> | null }) {
  const details = Object.entries(m.details ?? {}).filter(([, v]) => v);
  const subject = `[${m.ref}] ${TOPICS[m.topic]} — ${m.name}`;
  const text = [
    `${TOPICS[m.topic]} from ${m.name} <${m.email}>`,
    `Reference: ${m.ref}`,
    ...details.map(([k, v]) => `${k}: ${v}`),
    "",
    m.message,
    "",
    `Reply to this email to answer ${m.name}. All messages: ${SITE_URL}/admin (Messages).`,
  ].join("\n");
  const html = shell(
    `<p style="margin:0 0 4px;font-size:12px;font-weight:700;color:#0071e3;text-transform:uppercase;letter-spacing:.04em">${esc(TOPICS[m.topic])} · ${esc(m.ref)}</p>
<h1 style="margin:0 0 14px;font-size:19px">${esc(m.name)} <span style="font-weight:400;color:#64748b">&lt;${esc(m.email)}&gt;</span></h1>
${details.length ? `<table style="font-size:13.5px;color:#334155;margin:0 0 14px">${details.map(([k, v]) => `<tr><td style="padding:2px 12px 2px 0;color:#64748b">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>` : ""}
<div style="white-space:pre-wrap;font-size:14.5px;line-height:1.55;border-left:3px solid #0071e3;padding:4px 0 4px 12px">${esc(m.message)}</div>
<p style="margin:18px 0 0;font-size:13px;color:#64748b">Reply to this email to answer ${esc(m.name.split(" ")[0])}. All messages: <a href="${SITE_URL}/admin" style="color:#0071e3">Admin → Messages</a>.</p>`
  );
  return { subject, text, html };
}

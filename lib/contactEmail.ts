// Emails for the contact form: an alert to the support inbox (reply goes
// straight to the sender) and an acknowledgement to the sender.
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

export function senderAck(m: { ref: string; name: string; topic: Topic; message: string }) {
  const first = m.name.split(" ")[0] || "there";
  const subject = `We've got your message (${m.ref})`;
  const text = [
    `Hi ${first},`,
    "",
    `Thanks for getting in touch — your message reached us and we'll reply by email, usually within one to two working days.`,
    `Your reference: ${m.ref}`,
    "",
    "Your message:",
    m.message,
    "",
    `While you wait: the app tutorial (${SITE_URL}/tutorial) and guides (${SITE_URL}/guides) answer many questions.`,
    "",
    "— The Excel to KML Pro team",
  ].join("\n");
  const html = shell(
    `<h1 style="margin:0 0 12px;font-size:20px">Thanks, ${esc(first)} — we've got your message</h1>
<p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#334155">We'll reply by email, usually within one to two working days. Your reference is <b>${esc(m.ref)}</b>.</p>
<div style="white-space:pre-wrap;font-size:14px;line-height:1.5;color:#475569;background:#f8fafc;border-radius:10px;padding:12px 14px">${esc(m.message)}</div>
<p style="margin:16px 0 0;font-size:14px;line-height:1.55;color:#334155">While you wait, the <a href="${SITE_URL}/tutorial" style="color:#0071e3">app tutorial</a> and <a href="${SITE_URL}/guides" style="color:#0071e3">guides</a> answer many questions.</p>
<p style="margin:18px 0 0;font-size:12.5px;color:#94a3b8">— The Excel to KML Pro team</p>`
  );
  return { subject, text, html };
}

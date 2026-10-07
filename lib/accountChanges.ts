// What changed in an account, for the activity log ("Account updated"):
// one line per field, old → new. Passwords are never shown, only that one
// was changed.

type AccountFields = { name?: string | null; email?: string | null; organization?: string | null; role?: string | null };

const FIELDS: [keyof AccountFields, string][] = [
  ["name", "Name"],
  ["email", "Email"],
  ["organization", "Organisation"],
  ["role", "Occupation"],
];

const show = (v: string | null | undefined) => {
  const s = (v ?? "").trim();
  return s ? `"${s.length > 60 ? s.slice(0, 59) + "…" : s}"` : "(empty)";
};

/** Changed fields as readable lines, and a short title. Empty when nothing changed. */
export function describeAccountChanges(before: AccountFields, after: AccountFields, passwordChanged: boolean) {
  const labels: string[] = [];
  const lines: string[] = [];
  for (const [key, label] of FIELDS) {
    const a = (before[key] ?? "").trim();
    const b = (after[key] ?? "").trim();
    if (a !== b) {
      labels.push(label.toLowerCase());
      lines.push(`${label}: ${show(a)} → ${show(b)}`);
    }
  }
  if (passwordChanged) {
    labels.push("password");
    lines.push("Password: changed");
  }
  const list = labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}` : labels[0] ?? "";
  return { changed: lines.length > 0, title: list ? `Changed ${list}` : "", details: lines.join("\n") };
}

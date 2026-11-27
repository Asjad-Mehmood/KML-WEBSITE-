// Admin → Email → New versions: one release from Admin → Releases (its title, notes and link)
// turned into the email's subject, title, message and button, ready to change before sending.
// Plain data in, plain text out: the browser builds it.
export type ReleaseForMail = {
  id: string;
  app: string;
  appName: string;
  version: string;
  releasedAt: string;
  title: string;
  notes: string;
  link: string;
  linkLabel: string;
};

const longDate = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
};

/** The notes, one item per line ("Title: text" or "- item"), as one line each */
export function noteLines(notes: string): string[] {
  return notes
    .split("\n")
    .map((l) => l.replace(/^\s*(#+\s*|[-*•]\s*)/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean)
    .slice(0, 25)
    .map((l) => `• ${l}`);
}

export function releaseDraft(r: ReleaseForMail) {
  const name = `${r.appName} ${r.version}`;
  const subject = r.title.trim() || `${name} is out`;
  const when = longDate(r.releasedAt);
  const lines = noteLines(r.notes);
  const body = [
    `${name} is out${when ? ` (released ${when})` : ""}. Here's what's new:`,
    // one paragraph each: the email joins lines that have no blank line between them
    lines.length ? lines.join("\n\n") : "Fixes and improvements.",
    `Already installed? ${r.appName} updates by itself the next time you open it while you're online, or update it from the Survey Toolkit. New to it? Download it with the button below.`,
    "If anything doesn't work on your PC, reply to this email and tell us what you see.",
  ].join("\n\n");
  return {
    subject: subject.slice(0, 150),
    title: `${name} is ready`.slice(0, 150),
    body,
    buttonLabel: (r.linkLabel.trim() || `Get ${r.appName} ${r.version}`).slice(0, 40),
    buttonUrl: r.link.trim() || "/whats-new",
  };
}

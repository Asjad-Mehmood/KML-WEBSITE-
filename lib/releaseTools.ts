import { prisma } from "@/lib/prisma";
import { db } from "@/lib/db";
import { SITE_URL } from "@/lib/site";
import { releaseEmail } from "@/lib/releaseEmail";
import {
  NEVER_EMAIL,
  RELEASE_APPS,
  alreadySentSql,
  appById,
  compareVersions,
  ensureReleaseTables,
  forEmailOf,
  normVersion,
  notesFromMarkdown,
  recipientsSql,
  type Audience,
} from "@/lib/releases";

// Admin → Releases, the tools around the list (app/api/admin/releases/tools):
//   versionBoard      each app: the version the site offers, the newest release here, the newest
//                     on GitHub, and (Excel to KML) the version in Admin → Settings, with what's off
//   githubRelease     one version's notes on GitHub, to fill a release in the editor
//   checkLink         does a release's download link answer
//   draftPreview      the email of a release being written, before it's saved
//   recipientsPreview who a release email would go to, before it's sent
//   emailHistory      every release email and review request, newest first
//   retryFailed       send a broadcast again to only the people it failed for
//   optOuts           who stopped release emails

type GhRelease = { tag_name: string; name: string | null; body: string | null; published_at: string; html_url: string; draft: boolean; prerelease: boolean; assets?: { name: string; size: number }[] };

/** An app's published releases on GitHub, newest first (kept 15 minutes; null when GitHub doesn't answer) */
async function githubReleases(repo: string): Promise<GhRelease[] | null> {
  try {
    const r = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=30`, {
      headers: { Accept: "application/vnd.github+json", "User-Agent": "exceltokml.com" },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) return null;
    const list = (await r.json()) as GhRelease[];
    return Array.isArray(list) ? list.filter((g) => !g.draft) : null;
  } catch {
    return null;
  }
}

export type BoardIssue = { tone: "warn" | "info"; text: string };

/** Each app's versions side by side, and what needs doing */
export async function versionBoard() {
  await ensureReleaseTables();
  const [settings, rows, sent] = await Promise.all([
    db.getSettings().catch(() => null),
    prisma.productRelease.findMany({ select: { id: true, app: true, version: true, releasedAt: true, title: true, notes: true } }),
    prisma.releaseBroadcast.groupBy({ by: ["releaseId"], where: { kind: "release" }, _sum: { sent: true }, _max: { createdAt: true } }),
  ]);
  const sentOf = new Map(sent.map((s) => [s.releaseId, { sent: s._sum.sent ?? 0, at: s._max.createdAt }]));
  return Promise.all(
    RELEASE_APPS.map(async (app) => {
      const own = rows.filter((r) => r.app === app.id).sort((a, b) => compareVersions(b.version, a.version));
      const newest = own[0] ?? null;
      const gh = app.github ? await githubReleases(app.github) : null;
      // a pre-release counts only when the site already offers that version
      const ghNewest = gh?.find((g) => g.assets?.length && /^\d/.test(normVersion(g.tag_name)) && (!g.prerelease || compareVersions(normVersion(g.tag_name), app.current) <= 0)) ?? null;
      const github = ghNewest ? { version: normVersion(ghNewest.tag_name), at: ghNewest.published_at, url: ghNewest.html_url, prerelease: ghNewest.prerelease } : null;
      const settingsVersion = app.id === "excel-to-kml" && settings ? normVersion(settings.appVersion) : null;
      const emailed = newest ? sentOf.get(newest.id) ?? null : null;

      const issues: BoardIssue[] = [];
      if (github && (!newest || compareVersions(github.version, newest.version) > 0)) issues.push({ tone: "warn", text: `v${github.version} is on GitHub but not in Releases: import it` });
      if (newest && compareVersions(newest.version, app.current) > 0) issues.push({ tone: "warn", text: `The site still offers v${app.current}; the newest release is v${newest.version}` });
      if (github && compareVersions(github.version, app.current) > 0 && !(newest && compareVersions(newest.version, app.current) > 0))
        issues.push({ tone: "warn", text: `The site still offers v${app.current}; GitHub has v${github.version}` });
      if (settingsVersion && compareVersions(settingsVersion, app.current) < 0) issues.push({ tone: "warn", text: `Admin → Settings still say v${settingsVersion}` });
      if (newest && !newest.notes.trim()) issues.push({ tone: "info", text: `v${newest.version} has no "what's new" yet` });
      if (newest && !emailed?.sent) issues.push({ tone: "info", text: `v${newest.version} hasn't been emailed yet` });

      return {
        app: { id: app.id, name: app.name, href: app.href, github: app.github ?? null },
        site: app.current,
        newest: newest ? { id: newest.id, version: newest.version, at: newest.releasedAt, title: newest.title, emailed: emailed?.sent ?? 0, emailedAt: emailed?.at ?? null } : null,
        github,
        githubAnswered: !app.github || gh !== null,
        settingsVersion,
        releases: own.length,
        issues,
      };
    })
  );
}

/** One version's release on GitHub: its name, notes (one item per line) and date */
export async function githubRelease(appId: string, version: string) {
  const app = appById(appId);
  if (!app?.github) throw new Error("This app has no releases on GitHub.");
  const list = await githubReleases(app.github);
  if (!list) throw new Error("GitHub didn't answer. Try again in a minute.");
  const g = list.find((x) => normVersion(x.tag_name) === normVersion(version));
  if (!g) throw new Error(`There's no v${normVersion(version)} on GitHub.`);
  const named = (g.name || "").trim();
  return {
    version: normVersion(g.tag_name),
    title: named && normVersion(named) !== normVersion(g.tag_name) && !/^v?\d[\d.]*$/.test(named) ? named.slice(0, 150) : "",
    notes: notesFromMarkdown(g.body || "").join("\n"),
    releasedAt: g.published_at.slice(0, 10),
    url: g.html_url,
    prerelease: g.prerelease,
  };
}

/** Whether a release's download link answers: a page of this site, or an https address on the internet */
export async function checkLink(link: string, origin: string) {
  const raw = link.trim();
  let url: URL;
  try {
    url = raw.startsWith("/") ? new URL(raw, origin) : new URL(raw);
  } catch {
    return { ok: false, status: 0, message: "That isn't a link." };
  }
  const own = raw.startsWith("/");
  if (!own) {
    // only real internet addresses: no plain IPs, no local or internal names
    if (url.protocol !== "https:") return { ok: false, status: 0, message: "Links must start with https://" };
    const h = url.hostname;
    if (!h.includes(".") || /^[\d.]+$/.test(h) || h.includes(":") || /(^|\.)(localhost|local|internal)$/i.test(h)) {
      return { ok: false, status: 0, message: "Only public https addresses can be checked." };
    }
  }
  try {
    let r = await fetch(url, { method: "HEAD", redirect: "follow", signal: AbortSignal.timeout(6000), cache: "no-store" });
    // some servers don't answer HEAD
    if (r.status === 405 || r.status === 403) r = await fetch(url, { method: "GET", redirect: "follow", signal: AbortSignal.timeout(6000), cache: "no-store" });
    const shown = own ? `${SITE_URL}${url.pathname}` : r.url || url.toString();
    return { ok: r.ok, status: r.status, message: r.ok ? `Opens (${r.status})${r.url && r.url !== url.toString() ? `, goes to ${new URL(r.url).hostname}` : ""}` : `Answers ${r.status}`, url: shown };
  } catch (e) {
    return { ok: false, status: 0, message: (e as Error).name === "TimeoutError" ? "No answer within 6 seconds" : "Couldn't be reached" };
  }
}

/** The email for a release as it's being written, addressed to the admin */
export async function draftPreview(d: { app: string; version: string; releasedAt: string; title: string; notes: string; link: string; linkLabel: string }, to: { name: string; email: string }) {
  await ensureReleaseTables();
  const app = appById(d.app);
  if (!app) throw new Error("Unknown app.");
  const at = new Date(d.releasedAt || Date.now());
  const row = {
    app: app.id,
    version: normVersion(d.version || app.current),
    releasedAt: Number.isNaN(at.getTime()) ? new Date() : at,
    title: (d.title || "").trim() || `${app.name} ${normVersion(d.version || app.current)} is out`,
    notes: d.notes || "",
    link: d.link || app.href,
    linkLabel: d.linkLabel || "",
  };
  const m = releaseEmail(await forEmailOf(row), to);
  return { subject: m.subject, html: m.html, text: m.text };
}

/** Who a release email would reach: how many, and the first of them */
export async function recipientsPreview(releaseId: string, who: Audience, onlyNew: boolean) {
  await ensureReleaseTables();
  const r = await prisma.productRelease.findUnique({ where: { id: releaseId }, select: { app: true } });
  if (!r) throw new Error("That release no longer exists.");
  const sql = `${await recipientsSql(r.app, who)}${onlyNew ? alreadySentSql : ` AND $2::text IS NOT NULL`}`;
  const [count, sample] = await Promise.all([
    prisma.$queryRawUnsafe<{ n: number }[]>(`SELECT count(*)::int AS n FROM (${sql}) e`, NEVER_EMAIL, releaseId),
    prisma.$queryRawUnsafe<{ email: string; name: string }[]>(`SELECT * FROM (${sql}) e ORDER BY e.email LIMIT 40`, NEVER_EMAIL, releaseId),
  ]);
  return { count: count[0]?.n ?? 0, sample };
}

/** Every release email and review request, newest first */
export async function emailHistory(limit = 200) {
  await ensureReleaseTables();
  const rows = await prisma.releaseBroadcast.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { release: { select: { app: true, version: true, title: true } } },
  });
  return rows.map((b) => ({
    id: b.id,
    kind: b.kind as "release" | "review",
    audience: b.audience as Audience,
    status: b.status as "sending" | "paused" | "done",
    subject: b.subject,
    total: b.total,
    sent: b.sent,
    failed: b.failed,
    lastError: b.lastError,
    createdBy: b.createdBy,
    createdAt: b.createdAt,
    finishedAt: b.finishedAt,
    releaseId: b.releaseId,
    app: b.release.app,
    appName: appById(b.release.app)?.name ?? b.release.app,
    version: b.release.version,
  }));
}

/** A new broadcast to only the people an earlier one failed for (and who haven't stopped our emails since) */
export async function retryFailed(broadcastId: string, createdBy: string) {
  await ensureReleaseTables();
  const old = await prisma.releaseBroadcast.findUnique({ where: { id: broadcastId } });
  if (!old) throw new Error("That email no longer exists.");
  if (!old.failed) throw new Error("Nothing failed in that email.");
  const open = await prisma.releaseBroadcast.findFirst({ where: { releaseId: old.releaseId, kind: old.kind, status: { in: ["sending", "paused"] } } });
  if (open) throw new Error("Another email for this release is still sending: finish or stop it first.");
  const b = await prisma.releaseBroadcast.create({
    data: { releaseId: old.releaseId, subject: old.subject, createdBy, audience: old.audience, kind: old.kind },
  });
  const inserted = await prisma.$executeRawUnsafe(
    `INSERT INTO "release_recipients" ("id", "broadcastId", "email", "name", "status")
     SELECT gen_random_uuid()::text, $2, r."email", r."name", 'pending' FROM "release_recipients" r
      WHERE r."broadcastId" = $1 AND r."status" = 'failed'
        AND NOT EXISTS (SELECT 1 FROM "email_optouts" o WHERE o."email" = r."email")
     ON CONFLICT ("broadcastId", "email") DO NOTHING`,
    broadcastId,
    b.id
  );
  if (!inserted) {
    await prisma.releaseBroadcast.delete({ where: { id: b.id } });
    throw new Error("Everyone it failed for has stopped our emails since.");
  }
  await prisma.releaseBroadcast.update({ where: { id: b.id }, data: { total: inserted } });
  return b.id;
}

/** Who stopped release emails, newest first */
export async function optOuts() {
  await ensureReleaseTables();
  const rows = await prisma.emailOptOut.findMany({ orderBy: { createdAt: "desc" }, take: 1000 });
  const users = rows.length ? await prisma.user.findMany({ where: { email: { in: rows.map((r) => r.email), mode: "insensitive" } }, select: { id: true, email: true, name: true } }) : [];
  const by = new Map(users.map((u) => [u.email.toLowerCase(), u]));
  return rows.map((r) => ({ email: r.email, at: r.createdAt, userId: by.get(r.email)?.id ?? null, name: by.get(r.email)?.name ?? null }));
}

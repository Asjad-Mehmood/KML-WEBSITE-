// Nightly clean-up (Vercel Cron → /api/cron/cleanup, or Admin → Settings →
// "Clean up now"). Keeps the database small:
//   - stored files older than the retention period, with their converted points
//   - sign-in sessions that have expired
//   - failed-sign-in records older than 30 days (they only matter for the
//     15-minute sign-in limit)
// Retention: FILE_RETENTION_DAYS (default 365; 0 keeps files forever).
import { prisma } from "@/lib/prisma";

export function retentionDays(): number {
  const raw = process.env.FILE_RETENTION_DAYS;
  if (raw === undefined || raw.trim() === "") return 365;
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n >= 0 ? n : 365;
}

export interface CleanupResult {
  retentionDays: number;
  files: number;
  points: number;
  sessions: number;
  failedSignIns: number;
  ranAt: string;
}

export async function runCleanup(trigger: "schedule" | "admin"): Promise<CleanupResult> {
  const days = retentionDays();
  const now = new Date();
  let files = 0;
  let points = 0;

  if (days > 0) {
    const cutoff = new Date(now.getTime() - days * 86_400_000);
    // Points carry their own date, so every point older than the cutoff goes,
    // whether or not its file still exists
    points = (await prisma.conversion.deleteMany({ where: { timestamp: { lt: cutoff } } })).count;
    files = (await prisma.userFile.deleteMany({ where: { timestamp: { lt: cutoff } } })).count;
  }
  const sessions = (await prisma.session.deleteMany({ where: { expiresAt: { lt: now } } })).count;
  const failedSignIns = (
    await prisma.activity.deleteMany({
      where: { action: "login_failed", timestamp: { lt: new Date(now.getTime() - 30 * 86_400_000) } },
    })
  ).count;

  const result: CleanupResult = { retentionDays: days, files, points, sessions, failedSignIns, ranAt: now.toISOString() };
  await prisma.activity
    .create({
      data: {
        action: "cleanup",
        title:
          days > 0
            ? `Clean-up: ${files} file${files === 1 ? "" : "s"} and ${points} point${points === 1 ? "" : "s"} older than ${days} days removed`
            : "Clean-up: files are kept forever (FILE_RETENTION_DAYS=0)",
        details: JSON.stringify({ ...result, trigger }),
        status: "success",
      },
    })
    .catch(() => {});
  return result;
}

export async function lastCleanup(): Promise<{ at: string; title: string } | null> {
  const a = await prisma.activity.findFirst({ where: { action: "cleanup" }, orderBy: { timestamp: "desc" } });
  return a ? { at: a.timestamp.toISOString(), title: a.title } : null;
}

// Slows down password guessing: failed sign-ins are logged as activities, and
// after too many in a short window for one email or one network address,
// sign-in pauses. Kept in the database so it holds across server instances.
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_FAILURES = 8;

export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export async function tooManyFailures(email: string, ip: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MS);
  const n = await prisma.activity.count({
    where: {
      action: "login_failed",
      timestamp: { gte: since },
      OR: [{ userEmail: email.toLowerCase() }, ...(ip !== "unknown" ? [{ ipAddress: ip }] : [])],
    },
  });
  return n >= MAX_FAILURES;
}

export async function recordFailure(email: string, ip: string, userAgent: string | null): Promise<void> {
  await prisma.activity
    .create({
      data: {
        action: "login_failed",
        title: "Failed sign-in",
        userEmail: email.toLowerCase().slice(0, 200),
        ipAddress: ip,
        userAgent: userAgent?.slice(0, 300) || null,
        status: "failed",
      },
    })
    .catch(() => {});
}

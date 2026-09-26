import crypto from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * Messages sent through the contact form (/contact), kept so none is lost even
 * when email isn't set up, and worked through in Admin → Messages.
 *
 * The table matches the ContactMessage model in prisma/schema.prisma and is
 * created here on first use (the same statements `prisma db push` would run).
 */
let ready: Promise<void> | null = null;

export function ensureContactTable(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "contact_messages" (
        "id" TEXT NOT NULL,
        "ref" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "topic" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "details" TEXT,
        "userId" TEXT,
        "status" TEXT NOT NULL DEFAULT 'new',
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
      )`);
      await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "contact_messages_ref_key" ON "contact_messages"("ref")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "contact_messages_status_idx" ON "contact_messages"("status")`);
      await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "contact_messages_createdAt_idx" ON "contact_messages"("createdAt")`);
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

export const TOPICS = {
  question: "Question",
  problem: "Problem / bug",
  grid: "Grid or format request",
  idea: "Feature idea",
  business: "Business / licensing",
} as const;
export type Topic = keyof typeof TOPICS;

export const STATUSES = ["new", "open", "done"] as const;
export type Status = (typeof STATUSES)[number];

/** Short reference the sender can quote: KML-7F3A2C */
export const newRef = () => "KML-" + crypto.randomBytes(3).toString("hex").toUpperCase();

export async function recentFromSender(email: string, ip: string, minutes = 10): Promise<number> {
  await ensureContactTable();
  return prisma.contactMessage.count({
    where: {
      createdAt: { gte: new Date(Date.now() - minutes * 60_000) },
      OR: [{ email: email.toLowerCase() }, ...(ip !== "unknown" ? [{ ipAddress: ip }] : [])],
    },
  });
}

export async function saveMessage(data: {
  name: string;
  email: string;
  topic: Topic;
  message: string;
  details: Record<string, string> | null;
  userId: string | null;
  ipAddress: string;
  userAgent: string | null;
}) {
  await ensureContactTable();
  return prisma.contactMessage.create({
    data: {
      ref: newRef(),
      name: data.name,
      email: data.email.toLowerCase(),
      topic: data.topic,
      message: data.message,
      details: data.details ? JSON.stringify(data.details) : null,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
    },
  });
}

export async function listMessages(status?: Status | "all") {
  await ensureContactTable();
  const [messages, counts] = await Promise.all([
    prisma.contactMessage.findMany({
      where: status && status !== "all" ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.contactMessage.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const byStatus = Object.fromEntries(counts.map((c) => [c.status, c._count._all])) as Partial<Record<Status, number>>;
  return { messages, counts: byStatus };
}

export async function setStatus(id: string, status: Status) {
  await ensureContactTable();
  return prisma.contactMessage.update({ where: { id }, data: { status } });
}

export async function deleteMessage(id: string) {
  await ensureContactTable();
  await prisma.contactMessage.delete({ where: { id } });
}

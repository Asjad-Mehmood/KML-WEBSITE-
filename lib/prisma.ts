// Prisma client wrapper for Neon PostgreSQL database
// Safe for build environments and offline deployments

let prismaClientInstance: unknown = null;

try {
  // Dynamically load @prisma/client if available in runtime environment
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const prismaPkg = require("@prisma/client");
  if (prismaPkg && prismaPkg.PrismaClient) {
    const globalForPrisma = globalThis as unknown as { prisma: unknown };
    prismaClientInstance =
      globalForPrisma.prisma ??
      new prismaPkg.PrismaClient({
        log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
      });
    if (process.env.NODE_ENV !== "production") {
      globalForPrisma.prisma = prismaClientInstance;
    }
  }
} catch {
  prismaClientInstance = null;
}

export const prisma = prismaClientInstance;

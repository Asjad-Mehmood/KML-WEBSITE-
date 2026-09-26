import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

/** Unguessable password for accounts that must not be signed into with a known value */
function randomSecret(): string {
  return crypto.randomBytes(24).toString("base64url");
}

function generateSalt(): string {
  return crypto.randomBytes(16).toString("hex");
}

async function main() {
  console.log("🌱 Seeding Neon database...\n");

  // No well-known passwords. Admin: ADMIN_INITIAL_PASSWORD, or random (then use
  // `npm run set-password`). Demo accounts get random passwords and can't sign in.
  const initialAdminPassword = process.env.ADMIN_INITIAL_PASSWORD;
  const adminSalt = generateSalt();
  const adminHash = hashPassword(initialAdminPassword || randomSecret(), adminSalt);
  const defaultSalt = generateSalt();
  const defaultHash = hashPassword(randomSecret(), defaultSalt);

  const users = [
    {
      id: "usr_admin_master",
      name: "System Administrator",
      email: "admin@exceltokml.com",
      passwordHash: adminHash,
      salt: adminSalt,
      organization: "Excel to KML Core Team",
      role: "ADMIN",
      downloadCount: 0,
      hasFullAccess: true,
    },
    {
      id: "usr_lead_surveyor_01",
      name: "Asjad Mehmood",
      email: "surveyor@geotech.com",
      passwordHash: defaultHash,
      salt: defaultSalt,
      organization: "Apex Survey & Mapping Bureau",
      role: "Chief Cadastral Surveyor",
      downloadCount: 3,
    },
    {
      id: "usr_demo_user_02",
      name: "Field Engineer",
      email: "demo@surveyor.io",
      passwordHash: defaultHash,
      salt: defaultSalt,
      organization: "National Infrastructure GIS",
      role: "Civil Engineer",
      downloadCount: 1,
    },
    {
      id: "usr_demo_surveyor_03",
      name: "Demo Surveyor",
      email: "surveyor.demo@geotech.com",
      passwordHash: hashPassword(randomSecret(), defaultSalt),
      salt: defaultSalt,
      organization: "Apex Survey & Mapping Bureau",
      role: "Cadastral Surveyor",
      downloadCount: 5,
      hasFullAccess: true,
    },
  ];

  for (const user of users) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},       // Don't overwrite if already exists
      create: user,
    });
    console.log(`✅ ${created.role === "ADMIN" ? "👑 ADMIN" : "👤 User"} — ${created.name} <${created.email}>`);
  }

  // Seed default app settings
  await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      appVersion: "v3.5.7",
      installerFileName: "ExcelToKMLPro-Lite-Setup.exe",
      installerFileSize: "3.2 MB",
      requireAuthForDownload: true,
      maintenanceMode: false,
      announcementBanner: "Excel to KML is live with 6,864 EPSG grids & DLTM UAE support.",
      announcementActive: false,
      webAppRestricted: true,
      webMaxPoints: 50,
      webWatermarkKml: true,
      webDisableReports: true,
    },
  });
  console.log("\n✅ App settings seeded.");

  console.log("\n🎉 Done! Database is ready.\n");
  console.log(
    initialAdminPassword
      ? "Admin: admin@exceltokml.com (password from ADMIN_INITIAL_PASSWORD)"
      : "Admin: admin@exceltokml.com has a random password. Set one with:\n  npm run set-password -- admin@exceltokml.com"
  );
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

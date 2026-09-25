// Set a user's password directly in the database and sign them out everywhere.
//
//   npm run set-password -- admin@exceltokml.com      prompts for the new password (hidden)
//   npm run set-password -- --lock-demo               random passwords for the demo accounts
//
// Needs DATABASE_URL (read from .env). Hashing matches lib/db.ts (scrypt, 64-byte key).
import "dotenv/config";
import crypto from "crypto";
import readline from "readline";
import { PrismaClient } from "@prisma/client";

const DEMO_EMAILS = ["surveyor@geotech.com", "demo@surveyor.io", "surveyor.demo@geotech.com"];
const MIN_LENGTH = 10;

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function promptHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => {
      // echo the prompt itself, hide what is typed
      if (s.includes(question)) process.stdout.write(s);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function setPassword(prisma, email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user with email ${email}`);
  const salt = crypto.randomBytes(16).toString("hex");
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(password, salt), salt } });
  const { count } = await prisma.session.deleteMany({ where: { userId: user.id } });
  return count;
}

async function main() {
  const args = process.argv.slice(2);
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. Add it to .env (see .env.example) and run again.");
  }
  if (args.length === 0 || args.includes("--help")) {
    console.log("Usage:\n  npm run set-password -- <email>\n  npm run set-password -- --lock-demo");
    return;
  }

  const prisma = new PrismaClient();
  try {
    if (args.includes("--lock-demo")) {
      for (const email of DEMO_EMAILS) {
        try {
          const signedOut = await setPassword(prisma, email, crypto.randomBytes(24).toString("base64url"));
          console.log(`Locked ${email} (random password, ${signedOut} session(s) signed out)`);
        } catch {
          console.log(`Skipped ${email} (not in database)`);
        }
      }
      return;
    }

    const email = args[0].trim().toLowerCase();
    const password = await promptHidden(`New password for ${email}: `);
    if (password.length < MIN_LENGTH) throw new Error(`Password must be at least ${MIN_LENGTH} characters.`);
    const again = await promptHidden("Repeat it: ");
    if (again !== password) throw new Error("Passwords did not match.");

    const signedOut = await setPassword(prisma, email, password);
    console.log(`Password updated for ${email}. Signed out ${signedOut} existing session(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});

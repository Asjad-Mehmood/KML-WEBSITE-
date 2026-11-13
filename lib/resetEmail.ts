import { sendMail } from "@/lib/mailer";
import { createResetToken } from "@/lib/passwordReset";
import { letterEmail } from "@/lib/letterEmail";

/** The "choose a new password" email: from Forgot password, and from Admin → an account → Controls */
export async function sendPasswordResetEmail(user: { id: string; email: string; name: string; passwordHash: string }, base: string) {
  const link = `${base.replace(/\/+$/, "")}/reset-password?token=${encodeURIComponent(createResetToken(user))}`;
  await sendMail({
    to: user.email,
    ...letterEmail({
      subject: "Reset your Excel to KML password",
      title: "Reset your password",
      first: (user.name || "").trim().split(/\s+/)[0] || "",
      blocks: [
        { p: "Use this link to choose a new password. It works for one hour, once:" },
        { button: link, label: "Choose a new password" },
        { p: "If you didn't ask for this, ignore this email: your password stays as it is." },
      ],
      footer: "You're getting this because someone asked to reset the password of your account.",
    }),
  });
}

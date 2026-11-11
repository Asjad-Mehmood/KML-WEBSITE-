// "Thanks for downloading" email, sent once: the first time a signed-in user downloads the
// Windows app. A short letter (lib/letterEmail.ts) with one link, so it lands with their mail and
// not under Promotions.
import { INSTALLER_NAME, SITE_URL } from "@/lib/site";
import { letterEmail } from "@/lib/letterEmail";

export function downloadThanksEmail(name: string, version: string, fileName: string = INSTALLER_NAME) {
  // the name the browser reported; anything unexpected falls back to the installer's own name
  const file = /^[\w.-]{1,80}\.exe$/.test(fileName) ? fileName : INSTALLER_NAME;
  const first = (name || "").trim().split(/\s+/)[0] || "";
  return letterEmail({
    subject: "Your Excel to KML download",
    title: "Getting started with Excel to KML",
    first,
    blocks: [
      { p: `Thanks for downloading Excel to KML${version ? ` ${version}` : ""}. A few notes to get started:`, bold: ["Excel to KML"] },
      {
        steps: [
          `Run ${file} and follow the installer.`,
          'If Windows says it protected your PC, choose "More info", then "Run anyway".',
          'Open the program and press "Try the sample" to see a finished job in a minute.',
        ],
      },
      { p: "The tutorial shows the four steps from your sheet to Google Earth, with pictures." },
      { button: `${SITE_URL}/tutorial`, label: "Open the tutorial" },
      { p: "Questions or ideas? Reply to this email." },
    ],
    footer: "You're getting this one-time email because you downloaded the program with your account.",
  });
}

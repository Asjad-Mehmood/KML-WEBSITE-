// The email from Admin → Releases → Ask for reviews: a short letter (lib/letterEmail.ts) to people
// who downloaded or used a program, with one link to the review form. It shares the release
// emails' "stop" link (one opt-out list for both).
import { unsubscribeEndpoint, unsubscribePage } from "@/lib/releaseEmail";
import { letterEmail } from "@/lib/letterEmail";
import { SITE_URL } from "@/lib/site";

export interface ReviewAsk {
  appName: string;
  /** the product id the review is saved under (lib/reviews.ts) */
  product: string;
}

export const reviewLink = (product: string, stars?: number) => `${SITE_URL}/review/${product}${stars ? `?stars=${stars}` : ""}`;

export function reviewRequestEmail(r: ReviewAsk, to: { name: string; email: string }) {
  const first = (to.name || "").trim().split(/\s+/)[0] || "";
  const host = SITE_URL.replace(/^https?:\/\//, "");
  return {
    ...letterEmail({
      subject: `How is ${r.appName} working for you?`,
      first,
      blocks: [
        { p: `You downloaded or used ${r.appName} with your ${host} account. Would you tell us how it's going?`, bold: [r.appName] },
        { p: "A rating from one to five stars takes ten seconds, and a sentence or two helps even more. It helps other surveyors and engineers decide, and it tells us what to make better." },
        { link: reviewLink(r.product) },
        { p: "Something not working? Reply to this email instead: we'd rather fix it than read about it in a review." },
      ],
      signOff: "Thank you,",
      footer: `You're getting this because you downloaded or used ${r.appName} with your account on ${host}. We only email about our programs.`,
      footerLink: { label: "Stop these emails", url: unsubscribePage(to.email) },
    }),
    list: { unsubscribe: { url: unsubscribeEndpoint(to.email), comment: "Stop emails about our programs" } },
    headers: { "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  };
}

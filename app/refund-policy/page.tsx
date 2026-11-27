import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "../../components/LegalShell";
import { LEGAL_UPDATED, SUPPORT_EMAIL, openGraphFor, companyTitle } from "@/lib/site";

const TITLE = "Refund Policy";
const DESCRIPTION = "Refunds for SurveyX Digital Pro: a full refund within 14 days of paying, cancel any time, and how to ask.";

export const metadata: Metadata = {
  title: companyTitle(TITLE),
  description: DESCRIPTION,
  alternates: { canonical: "/refund-policy" },
  openGraph: openGraphFor("/refund-policy", `${TITLE} | SurveyX Digital`, DESCRIPTION),
};

export default function RefundPolicyPage() {
  return (
    <LegalShell title={TITLE} updated={LEGAL_UPDATED}>
      <p>
        This policy covers payments for <strong>SurveyX Digital Pro</strong>, the paid plan for the web apps (Excel to KML, Traverse &amp; Level
        and Slope Calculator). The Free plan and the Windows programs cost nothing, so there is nothing to refund for them.
      </p>

      <h2>Who you pay</h2>
      <p>
        Our order process is conducted by our online reseller Paddle.com. Paddle.com is the Merchant of Record for all our orders.
        Paddle takes the payment, handles sales tax and VAT, and provides all customer service inquiries and handles returns. Your
        receipt comes from Paddle, and the charge on your statement names Paddle.
      </p>

      <h2>14-day refund</h2>
      <p>
        If Pro isn&apos;t right for you, ask for a refund within <strong>14 days</strong> of your first payment and you get all of it back. You
        don&apos;t need to give a reason.
      </p>
      <p>
        The same applies to a renewal: ask within 14 days of a monthly or yearly renewal and that renewal is refunded in full.
      </p>

      <h2>After 14 days</h2>
      <ul>
        <li>Payments older than 14 days aren&apos;t refunded, except where the law says they must be, or where we couldn&apos;t provide the service.</li>
        <li>If Pro was unavailable to you for a long time because of a fault on our side, write to us: we will refund the time you couldn&apos;t use, or extend your plan.</li>
        <li>If you were charged twice or by mistake, the extra charge is always refunded.</li>
      </ul>

      <h2>Cancelling</h2>
      <p>
        You can cancel any time from your account page (<strong>Manage billing</strong>) or from the link in your Paddle receipt. Pro then
        stays on until the end of the period you paid for and doesn&apos;t renew. Cancelling stops future payments; it doesn&apos;t refund the
        current period unless you are within the 14 days above.
      </p>

      <h2>Your work is never lost</h2>
      <p>
        After a refund or a cancellation your account goes back to the Free plan. Nothing is deleted: your jobs, files and points stay in
        your account, and you can still open and download all of them.
      </p>

      <h2>How to ask for a refund</h2>
      <ul>
        <li>
          Use the link in your Paddle receipt, or find your order at{" "}
          <a href="https://paddle.net" target="_blank" rel="noopener noreferrer">
            paddle.net
          </a>{" "}
          with the email you paid with; or
        </li>
        <li>
          write to us at <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a> or through the <Link href="/contact">contact page</Link>, with the
          email of your account.
        </li>
      </ul>
      <p>
        Refunds go back to the card or account you paid with. Paddle usually sends them within a few days; your bank may take up to 10
        working days to show it.
      </p>

      <h2>Your legal rights</h2>
      <p>
        This policy adds to your rights under the law where you live and doesn&apos;t take any of them away. See also our{" "}
        <Link href="/terms">Terms of Use</Link> and <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </LegalShell>
  );
}

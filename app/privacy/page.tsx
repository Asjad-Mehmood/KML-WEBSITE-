import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "../../components/LegalShell";
import { PRIVACY_UPDATED, SUPPORT_EMAIL, openGraphFor } from "@/lib/site";

const TITLE = "Privacy Policy";
const DESCRIPTION = "How Excel to KML handles your information, the choices you have, and how to delete your account.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privacy" },
  openGraph: openGraphFor("/privacy", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default function PrivacyPage() {
  return (
    <LegalShell title={TITLE} updated={PRIVACY_UPDATED}>
      <p>
        This policy explains how Excel to KML (&ldquo;we&rdquo;, &ldquo;us&rdquo;) handles information when you use this
        website and its programs: the Excel to KML web app and Windows app, RoadPro, Traverse &amp; Level and Project Folder
        Manager.
      </p>

      <h2>The short version</h2>
      <ul>
        <li>Converting coordinates happens on your own computer or in your browser. RoadPro and Project Folder Manager run
          entirely on your computer and send us nothing.</li>
        <li>
          When you&apos;re signed in, the files you open and save, and the points in them, are kept in your account so you
          can find them again. Signed out, your coordinates and files stay on your computer.
        </li>
        <li>We keep only what we need to run your account and improve the service.</li>
        <li>We don&apos;t sell your information. Public pages of the site show ads from Google AdSense, which uses cookies (see <a href="#advertising">Advertising</a>).</li>
        <li>You can delete your saved files, or your whole account, from your dashboard at any time.</li>
      </ul>

      <h2>Information we keep</h2>
      <ul>
        <li>
          <strong>Account details</strong> you give us when you sign up: your name, email address, organization and role. Your
          password is stored in a protected form that we can&apos;t read.
        </li>
        <li>
          <strong>Your work while signed in:</strong> a record of your conversions and exports (such as file name, number of points,
          coordinate system and format); the files you open or save in the web app or the Windows app, up to 4 MB each and
          200 MB in all (a bigger file is listed by name and size only); and the points in each saved file (station, code,
          grid coordinates, latitude and longitude, and the coordinate system), so you can find and download them again from
          your dashboard. Jobs you keep in the app (their points, settings and photos, up to 4 MB each) are kept too, so they
          open on any computer where you sign in; files and jobs together count towards the 200 MB.
        </li>
        <li>
          <strong>Traverse &amp; Level jobs:</strong> the traverses and level runs you save in Traverse &amp; Level (their points,
          observations, settings and results, up to 2 MB each), so they open wherever you sign in, and the email addresses of
          anyone you share a job with. People you share a job with can open it and keep their own copy. If the copies are switched
          on, files you import into or export from Traverse &amp; Level are kept in your account&apos;s files as well.
        </li>
        <li>
          <strong>Downloads:</strong> which of our programs you downloaded, which version, and when.
        </li>
        <li>
          <strong>Reviews:</strong> the star rating and comment you give a program, and its version. Once we publish a review,
          the program&apos;s pages show it with your first name, the first letter of your last name and your organization.
        </li>
        <li>
          <strong>Messages you send us:</strong> your name, email address and what you write, so we can reply.
        </li>
        <li>
          <strong>Technical information</strong> that browsers send to every website, such as your IP address, the approximate
          area it comes from, and your browser and device type. When you&apos;re signed in to one of our apps, we also note which app
          it is, the kind of device (Windows, Android or the web) and the app&apos;s version, so you can see whether you have the
          newest one.
        </li>
      </ul>

      <h2>How we use it</h2>
      <ul>
        <li>To run your account and show your history and files in your dashboard.</li>
        <li>To send emails you ask for, such as a password reset link, a one-time welcome after your first download, or a reply to your message.</li>
        <li>
          To tell you when there&apos;s a new version of our software (Excel to KML, RoadPro, Traverse &amp; Level, Project Folder Manager).
          Every one of these emails has a link to stop them; account emails such as password resets still arrive.
        </li>
        <li>To answer messages you send us through the contact form or by email.</li>
        <li>To keep the service secure and prevent misuse.</li>
        <li>To understand how the tools are used, so we can improve them.</li>
        <li>To apply the web app&apos;s usage limits to the right account.</li>
      </ul>

      <h2>Services we rely on</h2>
      <p>
        Like most websites, we use trusted providers to run the service: website hosting, a database, email delivery for password
        resets, and a lookup service that turns an IP address into an approximate city and country. They only receive what they
        need to do that job.
      </p>
      <p>
        The maps on this site load imagery from Esri and OpenStreetMap, and place names you type into the map search are looked up
        with OpenStreetMap. The Windows installer is hosted on GitHub. These services have their own privacy policies.
      </p>
      <p>
        If you choose <strong>Continue with Google</strong>, Google tells us your name and your verified email address so we can
        create or open your account. We don&apos;t receive your Google password and don&apos;t access anything else in your Google
        account.
      </p>

      <h2 id="advertising">Advertising</h2>
      <p>
        We use Google AdSense to show ads on this site, which keeps our software free. Third-party vendors, including Google, use
        cookies to serve ads based on your earlier visits to this website and other websites. Google&apos;s use of advertising
        cookies lets it and its partners serve ads to you based on your visits to this site and other sites on the internet.
      </p>
      <ul>
        <li>
          You can turn off personalised advertising in Google&apos;s{" "}
          <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">Ads Settings</a>, or opt out of
          third-party vendors&apos; use of cookies for personalised advertising at{" "}
          <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a>.
        </li>
        <li>
          How Google uses information from sites that use its services:{" "}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noopener noreferrer">
            policies.google.com/technologies/partner-sites
          </a>
          .
        </li>
        <li>
          Visitors in the European Economic Area, the UK and Switzerland are asked for their consent before personalised ads are
          shown, through Google&apos;s consent message.
        </li>
        <li>The information you keep in your account (files, points, jobs) is never used for advertising.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        We use one cookie to keep you signed in. Google AdSense sets its own cookies to show and measure ads, as described under{" "}
        <a href="#advertising">Advertising</a>. The web app may also remember your settings in your browser so they&apos;re there
        next time.
      </p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Account details are kept while your account exists.</li>
        <li>Saved files and their points are kept for 12 months, then deleted automatically. You can delete them sooner at any time.</li>
        <li>Your activity history is kept until you delete your account.</li>
        <li>Traverse &amp; Level jobs and reviews are kept until you delete them or your account.</li>
        <li>
          When you delete your account, your details, files, points, Traverse &amp; Level jobs, reviews and history are removed.
          Download counts are kept without anything that identifies you.
        </li>
        <li>Messages you send us are kept while we deal with them and for our records, and are deleted on request.</li>
        <li>Technical information is kept only as long as needed for security and to run the service.</li>
      </ul>

      <h2>Your choices</h2>
      <ul>
        <li>
          See and update your details in your <Link href="/dashboard">dashboard</Link>.
        </li>
        <li>Delete any saved file from the dashboard&apos;s Files tab; its points are deleted with it.</li>
        <li>Delete a Traverse &amp; Level job, or stop sharing it, in the Traverse &amp; Level app.</li>
        <li>To change or remove a review, email us.</li>
        <li>
          Delete your whole account from <strong>Dashboard → Account → Delete account</strong>.
        </li>
        <li>
          For a copy of your information, or any other request, email <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
        </li>
      </ul>

      <h2>Security</h2>
      <p>
        The site uses encrypted connections, passwords are stored in protected form, and access to stored information is limited.
        No online service can be completely secure, so please use a password you don&apos;t use anywhere else.
      </p>

      <h2>Children</h2>
      <p>The service is meant for professionals and isn&apos;t aimed at children under 16. We don&apos;t knowingly keep their information.</p>

      <h2>Changes to this policy</h2>
      <p>
        If we change this policy we&apos;ll update the date at the top, and point out important changes on the site.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about privacy: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>. See also our{" "}
        <Link href="/terms">Terms of Use</Link>.
      </p>
    </LegalShell>
  );
}

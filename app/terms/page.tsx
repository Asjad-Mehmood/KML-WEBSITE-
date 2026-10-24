import type { Metadata } from "next";
import Link from "next/link";
import LegalShell from "../../components/LegalShell";
import { GITHUB_REPO_URL, LEGAL_UPDATED, SUPPORT_EMAIL, openGraphFor } from "@/lib/site";

const TITLE = "Terms of Use";
const DESCRIPTION = "The terms for using this website and its programs: Excel to KML, RoadPro, Traverse & Level and Project Folder Manager.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/terms" },
  openGraph: openGraphFor("/terms", `${TITLE} | Excel to KML`, DESCRIPTION),
};

export default function TermsPage() {
  return (
    <LegalShell title={TITLE} updated={LEGAL_UPDATED}>
      <p>
        These terms apply when you use this website and the programs offered on it: Excel to KML (the web app, the Windows
        app and the Android app), RoadPro, Traverse &amp; Level and Project Folder Manager (together, &ldquo;the
        service&rdquo;). By using the service you agree to them. If you don&apos;t agree, please don&apos;t use it.
      </p>

      <h2>The software</h2>
      <p>
        Excel to KML, including the website, the web app, the Windows app and the Android app, is owned by Asjad
        Mehmood, who keeps all rights in it. You may use it, free of charge unless stated otherwise, but you may not copy,
        change, resell or redistribute it, or try to take it apart to reach its code, except where the law allows this
        anyway. RoadPro, Traverse &amp; Level and Project Folder Manager are offered on the same basis: free to use, but not to
        copy, change, resell or redistribute. Downloads and release notes are published on this website and on{" "}
        <a href={GITHUB_REPO_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
        .
      </p>

      <h2>Your account</h2>
      <ul>
        <li>Give accurate details when you sign up, and keep your password to yourself.</li>
        <li>You&apos;re responsible for what happens under your account. An account is for one person.</li>
        <li>You can stop using the service and delete your account at any time from your dashboard.</li>
      </ul>

      <h2>Acceptable use</h2>
      <p>Please don&apos;t:</p>
      <ul>
        <li>use the service for anything unlawful;</li>
        <li>try to break, overload or get around the service&apos;s limits or security;</li>
        <li>copy the service&apos;s content or data automatically in bulk;</li>
        <li>upload anything harmful, or files you don&apos;t have the right to use.</li>
      </ul>
      <p>We may suspend or close accounts that do.</p>

      <h2>Your files and data</h2>
      <p>
        Your survey data stays yours. You allow us to store and process it only to provide the service to you, as described in our{" "}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>

      <h2>Checking your results</h2>
      <p>
        The service is a tool to help you work. Converted positions depend on the coordinate system and datum you choose and on
        published transformation parameters, which can differ from local practice by up to several metres. Before relying on
        results for legal boundaries, construction, setting out or navigation, check them against known control points. Survey
        and professional responsibility for the results stays with you.
      </p>

      <h2>Web app limits and availability</h2>
      <p>
        The free web app may limit how much you can convert at once, and features may change over time. We aim to keep the service
        running, but we can&apos;t promise it will always be available or free of errors.
      </p>

      <h2>Other services</h2>
      <p>
        Maps come from Esri and OpenStreetMap, and output files are made for Google Earth and other GIS software. Those are separate
        products with their own terms.
      </p>

      <h2>No warranty</h2>
      <p>
        The service is provided &ldquo;as is&rdquo;, without warranties of any kind, to the extent the law allows.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the extent the law allows, we aren&apos;t liable for indirect or consequential losses, for lost data, or for losses that
        come from relying on results without checking them.
      </p>

      <h2>Changes</h2>
      <p>
        We may update these terms. The date at the top shows the latest version, and continuing to use the service means you
        accept it.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these terms: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>
    </LegalShell>
  );
}

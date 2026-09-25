import React from "react";
import { FAQS } from "@/lib/faqs";
import { GITHUB_REPO_URL, INSTALLER_URL, SITE_DESCRIPTION, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

// Schema.org JSON-LD. Everything here must match what the page visibly shows:
// no made-up ratings or reviews, and FAQ answers come from the same data as the FAQ section.

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(data) }} />;
}

/** Home page: who publishes the site, the site itself, and the software it offers. */
export function HomeStructuredData() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "Organization",
            "@id": ORGANIZATION_ID,
            name: SITE_NAME,
            url: SITE_URL,
            logo: { "@type": "ImageObject", url: `${SITE_URL}/assets/icon-512.png`, width: 512, height: 512 },
            founder: { "@type": "Person", name: "Asjad Mehmood" },
            sameAs: [GITHUB_REPO_URL],
          },
          {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: SITE_NAME,
            url: SITE_URL,
            description: SITE_DESCRIPTION,
            inLanguage: "en",
            publisher: { "@id": ORGANIZATION_ID },
          },
          {
            "@type": "SoftwareApplication",
            "@id": `${SITE_URL}/#software`,
            name: SITE_NAME,
            description: SITE_DESCRIPTION,
            url: SITE_URL,
            applicationCategory: "BusinessApplication",
            applicationSubCategory: "GIS / Surveying",
            operatingSystem: "Windows 10, Windows 11",
            downloadUrl: INSTALLER_URL,
            installUrl: `${SITE_URL}/#download`,
            screenshot: `${SITE_URL}/assets/hero_geospatial.jpg`,
            image: `${SITE_URL}/assets/icon-512.png`,
            softwareVersion: "3.6.2",
            fileSize: "3.15 MB",
            isAccessibleForFree: true,
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            publisher: { "@id": ORGANIZATION_ID },
            author: { "@type": "Person", name: "Asjad Mehmood" },
            featureList: [
              "Convert Excel (XLSX) and CSV survey coordinates to Google Earth KML and KMZ",
              "Export DXF for AutoCAD and Civil 3D",
              "5,800+ EPSG coordinate systems, including UTM, DLTM, QNG and British National Grid",
              "Local site calibration from known control points (Helmert 2D)",
              "3D elevation extrusions and boundary polygons with area and perimeter",
              "Site photos packed into KMZ placemark balloons",
              "PDF survey reports",
            ],
          },
        ],
      }}
    />
  );
}

/** FAQPage for pages that show the FAQ section (home and /faq). */
export function FaqStructuredData() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }}
    />
  );
}

/** Breadcrumb trail for a page one level below home. */
export function BreadcrumbStructuredData({ name, path }: { name: string; path: string }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
          { "@type": "ListItem", position: 2, name, item: `${SITE_URL}${path}` },
        ],
      }}
    />
  );
}

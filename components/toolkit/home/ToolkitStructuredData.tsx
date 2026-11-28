import { SITE_URL, jsonLd } from "@/lib/content/site";
import { TOOLKIT_DESCRIPTION, TOOLKIT_FAQS } from "@/lib/toolkit/homeFaq";

// Survey Toolkit's page: the program itself and the questions the page shows (schema.org).
// Only what the page visibly says; no ratings.
export default function ToolkitStructuredData({ path, version }: { path: string; version: string | null }) {
  const url = `${SITE_URL}${path === "/" ? "/" : path}`;
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: jsonLd({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "SoftwareApplication",
              "@id": `${SITE_URL}/toolkit#software`,
              name: "Survey Toolkit",
              description: TOOLKIT_DESCRIPTION,
              url,
              applicationCategory: "BusinessApplication",
              applicationSubCategory: "GIS / Surveying",
              operatingSystem: "Windows 10, Windows 11",
              installUrl: url,
              ...(version ? { softwareVersion: version } : {}),
              isAccessibleForFree: true,
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              publisher: { "@id": `${SITE_URL}/#organization` },
            },
            {
              "@type": "FAQPage",
              "@id": `${url}#faq`,
              mainEntity: TOOLKIT_FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
            },
          ],
        }),
      }}
    />
  );
}

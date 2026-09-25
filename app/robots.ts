import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://exceltokml.com";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/faq", "/app", "/assets/"],
        disallow: ["/admin", "/api/", "/login", "/register"],
      },
      {
        userAgent: "Googlebot",
        allow: ["/", "/faq", "/app", "/assets/"],
        disallow: ["/admin", "/api/"],
      },
      {
        userAgent: "Bingbot",
        allow: ["/", "/faq", "/app", "/assets/"],
        disallow: ["/admin", "/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

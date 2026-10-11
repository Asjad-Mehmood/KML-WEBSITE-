import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old-style index URLs (/index.html, /guides/index.php …) point at the clean
  // folder URL, so they never show up as a duplicate or broken copy of a page
  async redirects() {
    return [
      { source: "/index.:ext(html?|php)", destination: "/", statusCode: 301 },
      { source: "/:path+/index.:ext(html?|php)", destination: "/:path+", statusCode: 301 },
      // Traverse & Level 1.0 manuals, replaced by the 2.0 manual
      { source: "/traverse/Traverse_Level_User_Manual.pdf", destination: "/traverse/Traverse-Level-User-Manual.pdf", statusCode: 301 },
      { source: "/traverse/Traverse_Level_User_Manual.pptx", destination: "/traverse/Traverse-Level-User-Manual.pptx", statusCode: 301 },
    ];
  },
  // The Traverse & Level web app is a static app in public/traverse/app; its folder URL serves
  // its page (assets resolve through the page's <base href="/traverse/app/">)
  async rewrites() {
    return {
      beforeFiles: [
        { source: "/traverse/app", destination: "/traverse/app/index.html" },
        { source: "/traverse/app/", destination: "/traverse/app/index.html" },
      ],
      afterFiles: [],
      fallback: [],
    };
  },
};

export default nextConfig;

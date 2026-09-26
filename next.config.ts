import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Old-style index URLs (/index.html, /guides/index.php …) point at the clean
  // folder URL, so they never show up as a duplicate or broken copy of a page
  async redirects() {
    return [
      { source: "/index.:ext(html?|php)", destination: "/", statusCode: 301 },
      { source: "/:path+/index.:ext(html?|php)", destination: "/:path+", statusCode: 301 },
    ];
  },
};

export default nextConfig;

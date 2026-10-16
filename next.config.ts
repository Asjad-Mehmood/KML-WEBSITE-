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
      // the first intro video, replaced by the 30 s intro
      { source: "/traverse/traverse-intro.mp4", destination: "/traverse/traverse-promo.mp4", statusCode: 301 },
      // The 2.0 Windows program kept its accounts on the PC; the installer now comes from the
      // program's releases and signs in with the website
      // The folder manager's first name and address, before it was made for any project
      { source: "/co2-dashboard", destination: "/project-folder-manager", statusCode: 301 },
      { source: "/co2-dashboard/CO2_Dashboard.zip", destination: "/project-folder-manager/Project_Folder_Manager.zip", statusCode: 301 },
      { source: "/co2-dashboard/:path*", destination: "/project-folder-manager", statusCode: 301 },
      {
        source: "/traverse/Traverse-Level-Adjustment-2.0.exe",
        destination: "https://github.com/Asjad-Mehmood/Traiverse/releases/latest/download/TraverseLevel-Setup.exe",
        statusCode: 302,
      },
    ];
  },
  // The Traverse & Level app lives at /traverse/app, one level above its service worker
  // (/traverse/app/sw.js), so the worker needs permission for that wider scope to open offline
  async headers() {
    return [
      {
        source: "/traverse/app/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/traverse/app" },
          { key: "Cache-Control", value: "no-cache" },
        ],
      },
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

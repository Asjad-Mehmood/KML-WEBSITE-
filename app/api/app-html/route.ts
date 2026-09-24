import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/chaudaryyabdullah03-collab/kml-convertor/main/app/index.html";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceRemote = url.searchParams.get("source") === "github";

  // Potential local repository paths
  const localCandidates = [
    process.env.MAIN_APP_HTML_PATH,
    path.resolve(process.cwd(), "../ExcelToKML-Pro-src/app/index.html"),
    path.resolve(process.cwd(), "../kml-convertor/app/index.html"),
    "C:\\Users\\hp\\Downloads\\ExcelToKML-Pro-src\\app\\index.html",
  ].filter(Boolean) as string[];

  // 1. Try local repository first (unless source=github requested)
  if (!forceRemote) {
    for (const candidate of localCandidates) {
      try {
        if (fs.existsSync(candidate)) {
          const content = await fs.promises.readFile(candidate, "utf-8");
          const stats = await fs.promises.stat(candidate);
          return new NextResponse(content, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              "X-App-Source": "local-repo",
              "X-App-Path": candidate,
              "X-App-Modified": stats.mtime.toISOString(),
            },
          });
        }
      } catch (err) {
        console.warn(`Failed reading candidate ${candidate}:`, err);
      }
    }
  }

  // 2. Fetch directly from the main GitHub repository
  try {
    const res = await fetch(GITHUB_RAW_URL, {
      cache: "no-store",
      headers: {
        "User-Agent": "KML-Website-App-Sync",
      },
    });

    if (res.ok) {
      const content = await res.text();
      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=60, s-maxage=60",
          "X-App-Source": "github-main-repo",
          "X-App-URL": GITHUB_RAW_URL,
        },
      });
    }
  } catch (err) {
    console.warn("Failed fetching from GitHub raw:", err);
  }

  // 3. Fallback to bundled public/app.html
  try {
    const fallbackPath = path.resolve(process.cwd(), "public/app.html");
    if (fs.existsSync(fallbackPath)) {
      const content = await fs.promises.readFile(fallbackPath, "utf-8");
      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "X-App-Source": "bundled-public-fallback",
        },
      });
    }
  } catch (err) {
    console.error("Fallback public/app.html failed:", err);
  }

  return new NextResponse("Error: Web app HTML file not found in main repo or public directory.", {
    status: 500,
    headers: { "Content-Type": "text/plain" },
  });
}

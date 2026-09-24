import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/chaudaryyabdullah03-collab/kml-convertor/main/app/index.html";

export async function GET() {
  // 1. Fetch directly from GitHub on every open / refresh
  try {
    const timestampedUrl = `${GITHUB_RAW_URL}?t=${Date.now()}`;
    const res = await fetch(timestampedUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
      headers: {
        "User-Agent": "KML-Website-App",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    if (res.ok) {
      const content = await res.text();

      // Silently save copy to public/app.html for offline / fallback resilience
      try {
        const fallbackPath = path.resolve(process.cwd(), "public/app.html");
        fs.promises.writeFile(fallbackPath, content, "utf-8").catch(() => {});
      } catch {
        // ignore background write
      }

      return new NextResponse(content, {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          "Pragma": "no-cache",
          "Expires": "0",
        },
      });
    }
  } catch (err) {
    console.warn("GitHub fetch failed or timed out, loading local copy:", err);
  }

  // 2. Fallback to local copy if offline or GitHub is unreachable
  const fallbackCandidates = [
    path.resolve(process.cwd(), "public/app.html"),
    path.resolve(process.cwd(), "../ExcelToKML-Pro-src/app/index.html"),
    path.resolve(process.cwd(), "../kml-convertor/app/index.html"),
    "C:\\Users\\hp\\Downloads\\ExcelToKML-Pro-src\\app\\index.html",
  ];

  for (const candidate of fallbackCandidates) {
    try {
      if (fs.existsSync(candidate)) {
        const content = await fs.promises.readFile(candidate, "utf-8");
        return new NextResponse(content, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-cache, no-store, must-revalidate",
          },
        });
      }
    } catch {
      // try next
    }
  }

  return new NextResponse("Error: Web app file could not be loaded.", {
    status: 500,
    headers: { "Content-Type": "text/plain" },
  });
}

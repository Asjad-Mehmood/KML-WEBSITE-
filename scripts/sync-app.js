import fs from "fs";
import path from "path";

const LOCAL_CANDIDATES = [
  process.env.MAIN_APP_HTML_PATH,
  path.resolve(process.cwd(), "../ExcelToKML-Pro-src/app/index.html"),
  path.resolve(process.cwd(), "../kml-convertor/app/index.html"),
  "C:\\Users\\hp\\Downloads\\ExcelToKML-Pro-src\\app\\index.html",
].filter(Boolean);

const TARGET_PATH = path.resolve(process.cwd(), "public/app.html");
const GITHUB_RAW_URL =
  "https://raw.githubusercontent.com/chaudaryyabdullah03-collab/kml-convertor/main/app/index.html";

async function syncApp() {
  console.log("🔄 Syncing web app HTML from main app repo...");

  for (const candidate of LOCAL_CANDIDATES) {
    if (fs.existsSync(candidate)) {
      console.log(`📁 Found local repository file: ${candidate}`);
      fs.copyFileSync(candidate, TARGET_PATH);
      const stats = fs.statSync(TARGET_PATH);
      console.log(`✅ Successfully synced to public/app.html (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
      return;
    }
  }

  console.log("🌐 Local repo file not found, fetching from GitHub main repo...");
  try {
    const res = await fetch(GITHUB_RAW_URL);
    if (res.ok) {
      const text = await res.text();
      fs.writeFileSync(TARGET_PATH, text, "utf-8");
      const stats = fs.statSync(TARGET_PATH);
      console.log(`✅ Successfully fetched & saved to public/app.html (${(stats.size / (1024 * 1024)).toFixed(2)} MB)`);
      return;
    }
  } catch (err) {
    console.error("❌ Failed fetching from GitHub:", err);
  }

  console.warn("⚠️ Could not sync from main repo or GitHub; keeping existing public/app.html");
}

syncApp();

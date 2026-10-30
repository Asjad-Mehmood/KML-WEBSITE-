// Prints the Slope Calculator user manual (/slope-calculation/manual) to
// public/slope-calculation/Slope-Calculator-User-Manual.pdf, from a running copy of the site:
//   npm run dev   (or start), then:   node scripts/slope-manual-pdf.mjs [http://localhost:3000]
// Needs Playwright with Chromium (npx playwright install chromium, or an existing one).
import { chromium } from "playwright";
import { fileURLToPath } from "node:url";

const base = process.argv[2] || "http://localhost:3000";
const out = fileURLToPath(new URL("../public/slope-calculation/Slope-Calculator-User-Manual.pdf", import.meta.url));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1100, height: 1400 } });
await page.goto(`${base}/slope-calculation/manual`, { waitUntil: "networkidle", timeout: 120_000 });
// the site's menu, footer and notices aren't part of the manual
await page.addStyleTag({
  content: `
    header:has(nav[aria-label="Main"]), nav[aria-label="Main"], footer, [data-nextjs-toast], nextjs-portal { display: none !important; }
    main { padding-top: 0 !important; }
    .manual { max-width: none !important; }
    @page { size: A4; margin: 16mm 14mm 18mm; }
  `,
});
// every screenshot loaded before printing
await page.evaluate(async () => {
  for (const img of Array.from(document.images)) {
    img.loading = "eager";
    if (!img.complete) await new Promise((r) => { img.onload = img.onerror = r; });
  }
});
await page.emulateMedia({ media: "print" });
await page.pdf({
  path: out,
  format: "A4",
  printBackground: true,
  displayHeaderFooter: true,
  headerTemplate: "<span></span>",
  footerTemplate:
    '<div style="width:100%;font-size:8px;color:#5a6a85;padding:0 14mm;display:flex;justify-content:space-between;font-family:sans-serif"><span>Slope Calculator · User manual</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
  margin: { top: "16mm", bottom: "18mm", left: "14mm", right: "14mm" },
});
await browser.close();
console.log(`wrote ${out}`);

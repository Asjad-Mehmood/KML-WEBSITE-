// Small formatting helpers of the admin pages: sizes, bar widths and places.

export function fmtBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/** Share of a total as a bar width: nothing shows as an empty bar. */
export function barWidth(n: number, total: number) {
  return `${total > 0 && n > 0 ? Math.max(4, Math.min(100, (n / total) * 100)) : 0}%`;
}

/** A download's or account's place, with its flag */
export function formatLocationDisplay(locStr?: string | null): { text: string; flag: string } {
  if (!locStr || !locStr.trim()) return { text: "Not known", flag: "🌐" };
  if (locStr === "Localhost (Dev)" || locStr === "127.0.0.1" || locStr === "Localhost") {
    return { text: "Localhost (Dev)", flag: "💻" };
  }

  const trimmed = locStr.trim();

  // If it's a 2-letter country code like "PK", "AE", "US", etc.
  if (trimmed.length === 2) {
    const code = trimmed.toUpperCase();
    let flag = "🌐";
    try {
      flag = code.replace(/./g, (c) => String.fromCodePoint(c.charCodeAt(0) + 127397));
    } catch {
      // ignore
    }
    try {
      const regionNames = new Intl.DisplayNames(["en"], { type: "region" });
      const name = regionNames.of(code) || code;
      return { text: name, flag };
    } catch {
      return { text: code, flag };
    }
  }

  // Flag icons based on location text
  let flag = "🌐";
  if (trimmed.includes("Pakistan") || trimmed.endsWith("PK")) flag = "🇵🇰";
  else if (trimmed.includes("Emirates") || trimmed.includes("Dubai") || trimmed.endsWith("AE")) flag = "🇦🇪";
  else if (trimmed.includes("United States") || trimmed.endsWith("US") || trimmed.includes("USA")) flag = "🇺🇸";
  else if (trimmed.includes("United Kingdom") || trimmed.endsWith("GB") || trimmed.includes("London")) flag = "🇬🇧";
  else if (trimmed.includes("Saudi Arabia") || trimmed.endsWith("SA")) flag = "🇸🇦";
  else if (trimmed.includes("Qatar") || trimmed.endsWith("QA")) flag = "🇶🇦";
  else if (trimmed.includes("Canada") || trimmed.endsWith("CA")) flag = "🇨🇦";
  else if (trimmed.includes("Germany") || trimmed.endsWith("DE")) flag = "🇩🇪";
  else if (trimmed.includes("India") || trimmed.endsWith("IN")) flag = "🇮🇳";

  return { text: trimmed, flag };
}

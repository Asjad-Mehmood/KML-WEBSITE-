/**
 * A Content-Disposition header that is safe for any file name: a plain-ASCII name for old
 * clients (quotes, backslashes, control and non-ASCII characters become "_"), and the exact
 * name in UTF-8 for every current browser (RFC 6266 / RFC 5987).
 */
export function attachment(name: string): string {
  const clean = (name || "download").replace(/[\r\n]/g, " ").trim() || "download";
  const ascii = clean.replace(/[^\x20-\x7e]|["\\]/g, "_");
  const utf8 = encodeURIComponent(clean).replace(/['()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${utf8}`;
}

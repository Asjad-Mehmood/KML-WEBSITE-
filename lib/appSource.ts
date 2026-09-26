/**
 * Where the web app's page comes from: app/index.html on the main branch of the program's
 * repository.
 *
 * The repository is private, so the page is read through the GitHub API with a read-only
 * token in APP_SOURCE_TOKEN (a fine-grained token with "Contents: read" on that one
 * repository). Without a token it is read from raw.githubusercontent.com, which works only
 * while the repository is public. Either way, public/app.html is the fallback.
 */
export const APP_REPO = "Asjad-Mehmood/kml-convertor";
const RAW_URL = `https://raw.githubusercontent.com/${APP_REPO}/main/app/index.html`;
const API_URL = `https://api.github.com/repos/${APP_REPO}/contents/app/index.html?ref=main`;

export function appSourceToken(): string {
  return (process.env.APP_SOURCE_TOKEN || "").trim();
}

export function fetchAppSource(timeoutMs = 8000): Promise<Response> {
  const token = appSourceToken();
  const signal = AbortSignal.timeout(timeoutMs);
  if (token) {
    // read at most once a minute: the API allows 5,000 reads an hour per token
    return fetch(API_URL, {
      signal,
      next: { revalidate: 60 },
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github.raw",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "KML-Website-App",
      },
    });
  }
  return fetch(`${RAW_URL}?t=${Date.now()}`, {
    signal,
    cache: "no-store",
    headers: { "User-Agent": "KML-Website-App", Accept: "text/html,*/*;q=0.8" },
  });
}

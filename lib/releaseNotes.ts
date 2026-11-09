// Release notes of the Windows programs, shown on this website (/whats-new/<app>) so a reader
// never has to go to GitHub for them. The server reads each program's releases from GitHub and
// keeps them for ten minutes. Only the version, date and notes are passed on: no GitHub
// addresses, and links in the notes that point at GitHub are dropped.
import { TOOLKIT_TOOLS } from "@/lib/toolkit/tools";

export interface NotesApp {
  slug: string;
  name: string;
  repo: string;
  /** the program's page on this website */
  page: string;
}

const repoOf = (id: string) => {
  const t = TOOLKIT_TOOLS.find((x) => x.id === id);
  if (!t || t.source.kind !== "installer") throw new Error(`No installer tool ${id}`);
  return t.source.repo;
};

export const NOTES_APPS: NotesApp[] = [
  { slug: "excel-to-kml", name: "Excel to KML", repo: repoOf("excel-to-kml"), page: "/download" },
  { slug: "traverse", name: "Traverse & Level", repo: repoOf("traverse"), page: "/traverse" },
  { slug: "slope", name: "Slope Calculator", repo: repoOf("slope"), page: "/slope-calculation" },
  { slug: "folder-manager", name: "Project Folder Manager", repo: repoOf("folder-manager"), page: "/project-folder-manager" },
  { slug: "survey-toolkit", name: "Survey Toolkit", repo: "Asjad-Mehmood/Survey-Toolkit", page: "/toolkit" },
];

/** The notes page for a Toolkit tool id (the ids match the slugs), or null */
export const notesPathOf = (id: string): string | null => (NOTES_APPS.some((a) => a.slug === id) ? `/whats-new/${id}` : null);

export interface ReleaseNote {
  version: string;
  title: string;
  published: string | null;
  prerelease: boolean;
  body: string;
}

type GhRelease = { tag_name?: string; name?: string | null; body?: string | null; published_at?: string | null; draft?: boolean; prerelease?: boolean };

const GH_HEADERS: Record<string, string> = { Accept: "application/vnd.github+json", "User-Agent": "exceltokml.com" };
const ghToken = () => (process.env.APP_SOURCE_TOKEN || process.env.GITHUB_TOKEN || "").trim();

const GH_URL = /https?:\/\/(?:[\w-]+\.)*github(?:usercontent)?\.com\/\S*/i;

/** The notes without anything that leads to GitHub: links to it keep only their words, and
 *  lines that only point there ("Full Changelog", "… in https://github.com/…/pull/12") go */
export function withoutGithub(md: string): string {
  return md
    .replace(/\r/g, "")
    .split("\n")
    .filter((line) => !/full changelog/i.test(line))
    .map((line) =>
      line
        .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images
        .replace(/\[([^\]]+)\]\((https?:\/\/(?:[\w-]+\.)*github(?:usercontent)?\.com\/[^)\s]*)\)/gi, "$1")
        .replace(new RegExp(`\\s+(?:in|by|at|from|see)\\s+${GH_URL.source}`, "gi"), "")
        .replace(new RegExp(GH_URL.source, "gi"), "")
        .replace(/\s+by\s+@[\w-]+/g, "")
        .replace(/<[^>]*github[^>]*>/gi, "")
        .trimEnd()
    )
    .filter((line, i, all) => !(line.trim() === "" && i > 0 && all[i - 1].trim() === ""))
    .join("\n")
    .trim();
}

/** The program's releases, newest first; null when GitHub can't be read while the site is built */
export async function releaseNotesOf(app: NotesApp): Promise<ReleaseNote[] | null> {
  const url = `https://api.github.com/repos/${app.repo}/releases?per_page=15`;
  const read = async (headers: Record<string, string>) => {
    const res = await fetch(url, { headers, next: { revalidate: 600 }, signal: AbortSignal.timeout(10_000) });
    return res.ok ? ((await res.json()) as GhRelease[]) : null;
  };
  try {
    const token = ghToken();
    const list = (token ? await read({ ...GH_HEADERS, Authorization: `Bearer ${token}` }) : null) ?? (await read(GH_HEADERS));
    if (!Array.isArray(list)) return failed();
    return list
      // only real version tags (v1.0.4, 2.1.1): a mistyped one such as "v.1.1.0" is left out
      .filter((r) => !r.draft && /^v?\d+\.\d+(\.\d+)?$/i.test(r.tag_name || ""))
      .map((r) => {
        const version = String(r.tag_name).replace(/^v/i, "");
        return {
          version,
          title: withoutGithub(r.name || "") || `${app.name} ${version}`,
          published: r.published_at || null,
          prerelease: !!r.prerelease,
          body: withoutGithub(r.body || ""),
        };
      });
  } catch (err) {
    if (err instanceof NotesUnavailable) throw err;
    return failed();
  }
}

class NotesUnavailable extends Error {}

/** While the site is built, a page without notes says so. Once it's live, failing instead keeps
 *  the last good copy of the page until GitHub answers again. */
function failed(): null {
  if (process.env.NEXT_PHASE === "phase-production-build") return null;
  throw new NotesUnavailable("GitHub's release list can't be read just now");
}

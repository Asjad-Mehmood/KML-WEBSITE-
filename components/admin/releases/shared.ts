// What Admin → Releases reads and sends (app/api/admin/releases), and the small helpers its parts share.

export interface App {
  id: string;
  name: string;
  href: string;
  current: string;
  github?: string;
}
export interface Broadcast {
  id: string;
  subject: string;
  status: "sending" | "paused" | "done";
  total: number;
  sent: number;
  failed: number;
  lastError: string | null;
  createdBy: string;
  /** app: people who use the app; all: everyone with an account; behind: on an older version */
  audience: Who;
  /** release: a version announcement; review: asking the app's users for a review */
  kind: "release" | "review";
  createdAt: string;
  finishedAt: string | null;
}
export interface Release {
  id: string;
  app: string;
  version: string;
  releasedAt: string;
  title: string;
  notes: string;
  link: string;
  linkLabel: string;
  broadcasts: Broadcast[];
  /** Still to get it: the app's users, and everyone with an account */
  notYet: number;
  notYetAll: number;
  /** A new program's first release: emailed as its introduction */
  introduces?: boolean;
}
export interface Data {
  /** users: people who downloaded or used the app with their account */
  groups: {
    app: App;
    users: number;
    releases: Release[];
    /** A new program: its introduction email, the release that carries it once made, and its line for the website's announcement bar */
    intro: { title: string; releaseId: string | null; announce: string | null } | null;
    /** reviewed: reviews of the app; toAsk: its users who haven't reviewed it; notAskedYet: those never asked */
    review: { reviewed: number; toAsk: number; notAskedYet: number; broadcasts: Broadcast[] };
  }[];
  audience: { everyone: number; optedOut: number };
  mail: { configured: boolean; from: string; freeMailbox?: boolean };
}
export type Fetch = (url: string, options?: RequestInit) => Promise<Response>;
/** who a release email goes to: the app's users, everyone, or the app's users on an older version */
export type Who = "app" | "all" | "behind";

export const day = (iso: string) => new Date(iso).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
export const when = (iso: string) => new Date(iso).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
export const json = (body: unknown): RequestInit => ({ method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
export const errorOf = async (r: Response) => ((await r.json().catch(() => ({}))) as { error?: string }).error || `Request failed (${r.status})`;

export const btn = "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";
export const input = "w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500";

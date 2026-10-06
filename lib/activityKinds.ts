// What each kind of activity is called, on the account page and in the admin panel alike.
// The app records these; anything not listed shows its raw name.

export const ACTION_LABEL: Record<string, string> = {
  conversion: "Conversion",
  export: "Export",
  file_upload: "File opened",
  batch_process: "Batch conversion",
  photos_attached: "Photos attached",
  project_save: "Job saved",
  settings_update: "Account updated",
  traverse: "Traverse adjusted",
  levelling: "Level run closed",
};

/** Survey calculations from Traverse adjust in the app */
export const SURVEY_ACTIONS = ["traverse", "levelling"];

export function actionLabel(action: string): string {
  return ACTION_LABEL[action] || action.replace(/_/g, " ");
}

/** The coloured tag for an activity in the admin panel's dark tables */
export function adminActionTag(action: string): string {
  switch (action) {
    case "export":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "file_upload":
      return "bg-indigo-500/10 text-indigo-300 border-indigo-500/20";
    case "traverse":
      return "bg-amber-500/10 text-amber-300 border-amber-500/25";
    case "levelling":
      return "bg-violet-500/10 text-violet-300 border-violet-500/25";
    default:
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
  }
}

/** A short line for a kept job that carries Traverse adjust work: "2 traverses · 1 level run" */
export function surveySummary(state: unknown): string {
  const tv = (state as { trav?: unknown } | null)?.trav as
    | { travs?: { start?: string; rows?: { angle?: string; dist?: string }[] }[]; levs?: { rows?: { bs?: string; fs?: string; dh?: string }[] }[] }
    | undefined;
  if (!tv || typeof tv !== "object") return "";
  const filled = (v: unknown) => typeof v === "string" && v.trim() !== "";
  const travs = (Array.isArray(tv.travs) ? tv.travs : []).filter(
    (t) => t && filled(t.start) && Array.isArray(t.rows) && t.rows.some((r) => r && (filled(r.angle) || filled(r.dist)))
  ).length;
  const levs = (Array.isArray(tv.levs) ? tv.levs : []).filter(
    (l) => l && Array.isArray(l.rows) && l.rows.some((r) => r && (filled(r.bs) || filled(r.fs) || filled(r.dh)))
  ).length;
  const parts: string[] = [];
  if (travs) parts.push(`${travs} traverse${travs === 1 ? "" : "s"}`);
  if (levs) parts.push(`${levs} level run${levs === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

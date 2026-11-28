// Direct downloads: for each Windows program, whether the website offers its installer for
// download (Admin → Settings → Downloads). Off: the program's pages keep all their information
// but show "Get it in the Survey Toolkit" instead of a download, and the website refuses to
// record a download of it. The Survey Toolkit itself still installs and updates every program.
// Shared by the server (settings, API) and the pages, so nothing here reads the database.

export const DOWNLOAD_PROGRAMS = [
  { id: "excel-to-kml", key: "dlExcelToKml", name: "Excel to KML", asset: "windows_installer" },
  { id: "roadpro", key: "dlRoadpro", name: "RoadPro", asset: "roadpro" },
  { id: "traverse", key: "dlTraverse", name: "Traverse & Level", asset: "traverse" },
  { id: "folder-manager", key: "dlFolderManager", name: "Project Folder Manager", asset: "folder_manager" },
  { id: "slope", key: "dlSlope", name: "Slope Calculator", asset: "slope" },
  { id: "auto-draft", key: "dlAutoDraft", name: "Auto Drafting", asset: "auto_draft" },
] as const;

export type DownloadProgram = (typeof DOWNLOAD_PROGRAMS)[number]["id"];
export type DownloadKey = (typeof DOWNLOAD_PROGRAMS)[number]["key"];

/** Which programs may be downloaded from the website, by program id */
export type DirectDownloads = Record<DownloadProgram, boolean>;

/** The switches as the settings hold them, by program id */
export function directDownloadsOf(s: Record<DownloadKey, boolean>): DirectDownloads {
  return Object.fromEntries(DOWNLOAD_PROGRAMS.map((p) => [p.id, s[p.key] !== false])) as DirectDownloads;
}

/** The program a recorded download (its assetType) is the installer of; null for manuals, samples and the rest */
export function programOfAsset(asset: string): DownloadProgram | null {
  return DOWNLOAD_PROGRAMS.find((p) => p.asset === asset)?.id ?? null;
}

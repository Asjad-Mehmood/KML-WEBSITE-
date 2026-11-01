// Survey Toolkit (beta test, github.com/Asjad-Mehmood/Survey-Toolkit): the five tools it installs
// and updates, and how it finds, installs and removes each one on a PC. Read from each product's
// installer and files in the Toolkit's T0 research (its docs/TOOLS.md) and checked on Windows by
// its Probe workflow. Only the Toolkit's own routes (/api/toolkit/*) use this file.
import { ROADPRO_FILES, ROADPRO_RELEASED, ROADPRO_VERSION } from "@/lib/roadpro";
import { PFM_FILES, PFM_RELEASED, PFM_VERSION } from "@/lib/folderManager";

export type ToolkitToolId = "excel-to-kml" | "roadpro" | "traverse" | "folder-manager" | "slope";

/** A Windows program with an NSIS installer, published as GitHub releases with latest.json */
export interface InstallerTool {
  kind: "installer";
  repo: string;
  installer: string;
  /** HKCU\Software\Microsoft\Windows\CurrentVersion\Uninstall\<key>, value DisplayVersion */
  registryKey: string;
  /** The program file, newest name first (older versions used another name) */
  exe: string[];
  silentArgs: string[];
  /** A silent install opens the program afterwards (T0: Excel to KML and Traverse & Level) */
  opensAfterSilentInstall: boolean;
  /** A silent install closes an open copy by force, so never run it while the program is open */
  closesOpenCopy: true;
}

/** A zip on this website. Its version is kept in the product's own lib file. */
export interface ZipTool {
  kind: "autocad-bundle" | "zip";
  href: string;
  file: string;
  version: string;
  released: string;
  files: string[];
  /** Files in the install folder that an update must keep (the user's settings) */
  keep: string[];
  /** The program to open (zip) or the plugin AutoCAD loads (autocad-bundle) */
  main: string;
  needs?: string;
}

export interface ToolkitTool {
  id: ToolkitToolId;
  name: string;
  platform: string;
  /** Product page on this website */
  page: string;
  webApp?: string;
  source: InstallerTool | ZipTool;
}

export const TOOLKIT_TOOLS: ToolkitTool[] = [
  {
    id: "excel-to-kml",
    name: "Excel to KML",
    platform: "Windows",
    page: "/download",
    source: {
      kind: "installer",
      repo: "Asjad-Mehmood/kml-convertor",
      installer: "ExcelToKML-Setup.exe",
      registryKey: "ExcelToKMLPro",
      exe: ["ExcelToKML.exe", "ExcelToKMLPro.exe"],
      silentArgs: ["/S"],
      opensAfterSilentInstall: true,
      closesOpenCopy: true,
    },
  },
  {
    id: "roadpro",
    name: "RoadPro",
    platform: "AutoCAD plugin",
    page: "/roadpro",
    source: {
      kind: "autocad-bundle",
      href: ROADPRO_FILES.plugin.href,
      file: ROADPRO_FILES.plugin.name,
      version: ROADPRO_VERSION,
      released: ROADPRO_RELEASED,
      files: ["RoadPro.lsp", "RP_PAVER.pat", "README.txt"],
      keep: [],
      main: "RoadPro.lsp",
      needs: "Full AutoCAD, Civil 3D or Map 3D 2014 or newer (not AutoCAD LT)",
    },
  },
  {
    id: "traverse",
    name: "Traverse & Level",
    platform: "Web app and Windows",
    page: "/traverse",
    webApp: "/traverse/app",
    source: {
      kind: "installer",
      repo: "Asjad-Mehmood/Traiverse",
      installer: "TraverseLevel-Setup.exe",
      registryKey: "TraversePro",
      exe: ["TraverseLevel.exe", "TraversePro.exe"],
      silentArgs: ["/S"],
      opensAfterSilentInstall: true,
      closesOpenCopy: true,
    },
  },
  {
    id: "folder-manager",
    name: "Project Folder Manager",
    platform: "Windows",
    page: "/project-folder-manager",
    source: {
      kind: "zip",
      href: PFM_FILES.package.href,
      file: PFM_FILES.package.name,
      version: PFM_VERSION,
      released: PFM_RELEASED,
      files: ["Project_Folder_Manager.exe", "Project_Folder_Manager.hta", "READ_ME.txt", "dashboard_icon.ico"],
      keep: ["Project_Folder_Manager_config.txt"],
      main: "Project_Folder_Manager.exe",
    },
  },
  {
    id: "slope",
    name: "Slope Calculator",
    platform: "Web app and Windows",
    page: "/slope-calculation",
    webApp: "/slope-calculation/app",
    source: {
      kind: "installer",
      repo: "Asjad-Mehmood/Slope-calculator-",
      installer: "SlopeCalculator-Setup.exe",
      registryKey: "SlopeCalculator",
      exe: ["SlopeCalculator.exe"],
      silentArgs: ["/S"],
      opensAfterSilentInstall: false,
      closesOpenCopy: true,
    },
  },
];

export const TOOLKIT_TOOL_IDS = TOOLKIT_TOOLS.map((t) => t.id) as string[];

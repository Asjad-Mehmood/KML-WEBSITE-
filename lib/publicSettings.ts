/** Admin settings every visitor may know: shared by the server and the browser (no database here). */
export interface PublicSettings {
  appVersion: string;
  installerFileName: string;
  installerFileSize: string;
  requireAuthForDownload: boolean;
  maintenanceMode: boolean;
  /** Empty unless the announcement is switched on. */
  announcement: string;
}

export const DEFAULT_PUBLIC_SETTINGS: PublicSettings = {
  appVersion: "",
  installerFileName: "ExcelToKMLPro-Lite-Setup.exe",
  installerFileSize: "",
  requireAuthForDownload: true,
  maintenanceMode: false,
  announcement: "",
};


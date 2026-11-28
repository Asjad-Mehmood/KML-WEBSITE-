// The database API: import { db } from "@/lib/db". Each part lives in its own file in lib/db/;
// db joins them, so every caller keeps working as before (db.findUserByEmail, db.saveUserFile, …).
import { usersRepo } from "./users";
import { sessionsRepo } from "./sessions";
import { downloadsRepo } from "./downloads";
import { conversionsRepo } from "./conversions";
import { statsRepo } from "./stats";
import { activitiesRepo } from "./activities";
import { filesRepo } from "./files";
import { settingsRepo } from "./settings";

export const db = {
  ...usersRepo,
  ...sessionsRepo,
  ...downloadsRepo,
  ...conversionsRepo,
  ...statsRepo,
  ...activitiesRepo,
  ...filesRepo,
  ...settingsRepo,
};

export { FILE_APP_PLATFORMS, asPlatform, isAdminRole } from "./core";
export type { AppSettings, ConversionRecord, DownloadRecord, FilePlatform, SessionRecord, UserActivityRecord, UserFileRecord, UserRecord } from "./core";

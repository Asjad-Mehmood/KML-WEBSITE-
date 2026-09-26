/**
 * Limits on what signed-in users can store.
 *
 * Vercel rejects request bodies over 4.5 MB, so one file is capped a little below that.
 * The web app sends files as multipart form data, which adds almost nothing; the older
 * JSON form carries base64 (a third bigger) and is checked against the same file limit.
 */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

/** Everything one account may keep in its file vault. */
export const MAX_USER_STORAGE_BYTES = 200 * 1024 * 1024;

/** Files one account may keep, copies and name-only entries together. */
export const MAX_USER_FILES = 5000;

/** Converted points one account may keep. */
export const MAX_USER_POINTS = 500000;

/** Points accepted in one conversions request (one saved file). */
export const MAX_POINTS_PER_SAVE = 5000;

/** Longest file name kept. */
export const MAX_FILE_NAME = 200;

/** Largest body a files request may declare before it is read. */
export const MAX_FILES_REQUEST_BYTES = Math.ceil((MAX_FILE_BYTES * 4) / 3) + 256 * 1024;

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

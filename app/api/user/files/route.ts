import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/adminAuth";
import {
  MAX_FILE_BYTES,
  MAX_FILE_NAME,
  MAX_FILES_REQUEST_BYTES,
  MAX_USER_FILES,
  MAX_USER_STORAGE_BYTES,
  formatBytes,
} from "@/lib/uploadLimits";
import { pointsFromExport } from "@/lib/exportPoints";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS, DELETE",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With, X-App-Platform",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

async function getAuthUser(req: NextRequest) {
  const token =
    req.cookies.get("surveyor_auth_token")?.value ||
    req.cookies.get("surveyor_session")?.value ||
    req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const sessionData = await db.validateSession(token);
  return sessionData?.user || null;
}

// GET: Retrieve list of files for the authenticated user (or all if admin)
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
    const admin = await getAdminSession(req);
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const userParam = searchParams.get("userId");
    const direction = searchParams.get("direction") || undefined;

    let files: any[] = [];
    if (admin && userParam) {
      files = await db.getUserFiles(userParam, limit);
    } else if (admin && searchParams.get("all") === "true") {
      files = await db.getAllFiles(limit, direction);
    } else if (user) {
      files = await db.getUserFiles(user.id, limit);
    } else {
      // Signed out: no file lists for any userId
      return NextResponse.json({ files: [] }, { headers: CORS_HEADERS });
    }

    // Sanitize records to exclude heavy base64 strings from list views
    const sanitizedFiles = files.map((f) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { contentBase64, storedFilePath, ...rest } = f;
      return {
        ...rest,
        hasStoredContent: Boolean(contentBase64 || storedFilePath),
        downloadUrl: `/api/user/files/${f.id}`,
      };
    });

    return NextResponse.json({ success: true, files: sanitizedFiles }, { headers: CORS_HEADERS });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS });
  }
}

function tooBig(message: string) {
  return NextResponse.json({ error: message }, { status: 413, headers: CORS_HEADERS });
}

// POST: Save an imported or exported file into the signed-in user's file vault
export async function POST(req: NextRequest) {
  try {
    // Only signed-in users can store files; nothing is kept for anonymous requests.
    const user = await getAuthUser(req);
    if (!user) {
      return NextResponse.json({ error: "Sign in to save files." }, { status: 401, headers: CORS_HEADERS });
    }

    // Refuse an oversized body before reading it.
    const declared = parseInt(req.headers.get("content-length") || "0", 10);
    if (declared > MAX_FILES_REQUEST_BYTES) {
      return tooBig(`Files larger than ${formatBytes(MAX_FILE_BYTES)} are not stored.`);
    }

    const contentType = req.headers.get("content-type") || "";
    const platformHeader = req.headers.get("x-app-platform") || undefined;

    const ipAddress =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    let fileName = "";
    let direction: "import" | "export" = "import";
    let mimeType = "application/octet-stream";
    let pointsCount: number | undefined = undefined;
    let crs: string | undefined = undefined;
    let action = "";
    let platform: "windows_app" | "web_app" =
      platformHeader === "windows" || userAgent?.includes("ExcelToKML") || userAgent?.includes("Windows")
        ? "windows_app"
        : "web_app";
    let fileBuffer: Buffer | undefined = undefined;
    let contentBase64: string | undefined = undefined;
    // A file over the limit is still listed, with its name and size but no content.
    let metaOnly = false;
    let metaSize = 0;
    let logActivity = true;
    // The app sends a saved file's points to /api/user/conversions itself;
    // for older builds the server reads them from the exported file.
    let pointsSeparately = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400, headers: CORS_HEADERS });
      }

      fileName = file.name || "unnamed_file";
      mimeType = file.type || "application/octet-stream";
      direction = formData.get("direction") === "export" ? "export" : "import";
      if (formData.get("logActivity") === "false") logActivity = false;
      if (formData.get("pointsSeparately") === "true") pointsSeparately = true;
      action = (formData.get("action") as string) || "";
      crs = (formData.get("crs") as string) || undefined;
      const pts = formData.get("pointsCount");
      if (pts) pointsCount = parseInt(pts as string, 10);
      const plat = formData.get("platform");
      if (plat === "windows_app" || plat === "web_app") platform = plat;

      const arrayBuf = await file.arrayBuffer();
      fileBuffer = Buffer.from(arrayBuf);
    } else {
      // JSON payload
      const body = await req.json().catch(() => ({}));
      fileName = body.fileName || "unnamed_file";
      direction = body.direction === "export" ? "export" : "import";
      mimeType = body.mimeType || "application/octet-stream";
      pointsCount = typeof body.pointsCount === "number" ? body.pointsCount : undefined;
      crs = body.crs || undefined;
      action = body.action || "";
      if (body.platform === "windows_app" || body.platform === "web_app") {
        platform = body.platform;
      }
      if (body.logActivity === false) logActivity = false;
      if (body.pointsSeparately === true) pointsSeparately = true;

      if (body.metaOnly === true) {
        metaOnly = true;
        metaSize = typeof body.fileSize === "number" ? body.fileSize : 0;
      } else if (body.contentBase64) {
        contentBase64 = body.contentBase64;
        fileBuffer = Buffer.from(body.contentBase64, "base64");
      } else if (body.content) {
        // Plain text content
        fileBuffer = Buffer.from(body.content, "utf-8");
        contentBase64 = fileBuffer.toString("base64");
      }
    }

    if (!fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400, headers: CORS_HEADERS });
    }
    fileName = fileName.slice(0, MAX_FILE_NAME);

    // The real size, whatever the request claimed.
    const size = fileBuffer ? fileBuffer.length : 0;
    if (!metaOnly && size === 0) {
      return NextResponse.json({ error: "The file is empty." }, { status: 400, headers: CORS_HEADERS });
    }
    if (size > MAX_FILE_BYTES) {
      return tooBig(`Files larger than ${formatBytes(MAX_FILE_BYTES)} are not stored.`);
    }
    if ((await db.countUserFiles(user.id)) >= MAX_USER_FILES) {
      return tooBig(`Your account already keeps ${MAX_USER_FILES} files. Delete some from your dashboard to save more.`);
    }
    const used = metaOnly ? 0 : await db.getUserStorageBytes(user.id);
    if (!metaOnly && used + size > MAX_USER_STORAGE_BYTES) {
      return tooBig(
        `Your file storage is full (${formatBytes(used)} of ${formatBytes(MAX_USER_STORAGE_BYTES)}). ` +
          "Delete some files from your dashboard to save more."
      );
    }

    // Only the session decides whose account a file belongs to; a userId or
    // email sent in the request is ignored so nobody can plant files in
    // another user's dashboard.
    const savedRecord = await db.saveUserFile({
      userId: user.id,
      userEmail: user.email,
      userName: user.name,
      direction,
      fileName,
      fileBuffer,
      contentBase64,
      mimeType,
      pointsCount,
      crs,
      action,
      platform,
      ipAddress,
      userAgent,
      metaOnly,
      metaSize,
      logActivity,
    });

    // Keep each converted point from an exported KML / KMZ / CSV, unless the app sends them itself
    if (direction === "export" && fileBuffer && !metaOnly && !pointsSeparately) {
      const points = pointsFromExport(fileName, fileBuffer);
      await db
        .recordConversions({ userId: user.id, fileId: savedRecord.id, coordSystem: crs || "", offset: 0, points })
        .catch((e) => console.warn("Saving conversions failed:", e));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contentBase64: _discard, ...cleanRecord } = savedRecord;

    return NextResponse.json(
      {
        success: true,
        file: cleanRecord,
        downloadUrl: `/api/user/files/${cleanRecord.id}`,
        stored: !metaOnly,
        message: metaOnly
          ? `${fileName} is listed in your account; at ${formatBytes(metaSize)} it is too big to keep a copy.`
          : `${direction === "import" ? "Imported" : "Exported"} file ${fileName} archived in database.`,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS });
  }
}

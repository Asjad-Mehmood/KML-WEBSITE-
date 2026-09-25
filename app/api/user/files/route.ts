import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAdminSession } from "@/lib/adminAuth";

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
    } else if (userParam) {
      files = await db.getUserFiles(userParam, limit);
    } else {
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

// POST: Save an imported or exported file into the database & file vault
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthUser(req);
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
    let clientUserId: string | null = null;
    let clientUserEmail: string | null = null;
    let clientUserName: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file provided in form data" }, { status: 400, headers: CORS_HEADERS });
      }

      fileName = file.name || "unnamed_file";
      mimeType = file.type || "application/octet-stream";
      direction = (formData.get("direction") as "import" | "export") || "import";
      action = (formData.get("action") as string) || "";
      crs = (formData.get("crs") as string) || undefined;
      const pts = formData.get("pointsCount");
      if (pts) pointsCount = parseInt(pts as string, 10);
      const plat = formData.get("platform");
      if (plat === "windows_app" || plat === "web_app") platform = plat;

      clientUserId = (formData.get("userId") as string) || null;
      clientUserEmail = (formData.get("userEmail") as string) || null;
      clientUserName = (formData.get("userName") as string) || null;

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
      clientUserId = body.userId || null;
      clientUserEmail = body.userEmail || null;
      clientUserName = body.userName || null;

      if (body.contentBase64) {
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

    const savedRecord = await db.saveUserFile({
      userId: user ? user.id : clientUserId,
      userEmail: user ? user.email : clientUserEmail,
      userName: user ? user.name : clientUserName,
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
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { contentBase64: _discard, ...cleanRecord } = savedRecord;

    return NextResponse.json(
      {
        success: true,
        file: cleanRecord,
        downloadUrl: `/api/user/files/${cleanRecord.id}`,
        message: `${direction === "import" ? "Imported" : "Exported"} file ${fileName} archived in database.`,
      },
      { headers: CORS_HEADERS }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500, headers: CORS_HEADERS });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("surveyor_auth_token")?.value ||
      req.cookies.get("surveyor_session")?.value ||
      req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

    if (token) {
      await db.destroySession(token);
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete("surveyor_auth_token");
    response.cookies.delete("surveyor_session");
    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

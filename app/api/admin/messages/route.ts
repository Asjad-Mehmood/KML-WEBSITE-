import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { listMessages, STATUSES, type Status } from "@/lib/contactMessages";

// Admin → Messages: contact-form messages, newest first, with counts per status
export async function GET(req: NextRequest) {
  if (!(await getAdminSession(req))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const s = req.nextUrl.searchParams.get("status") || "all";
  const status = (STATUSES as readonly string[]).includes(s) ? (s as Status) : "all";
  const { messages, counts } = await listMessages(status);
  return NextResponse.json({ messages, counts });
}

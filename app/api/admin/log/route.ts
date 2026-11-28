import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth/adminAuth";
import { ADMIN_ACTIONS, listAdminLog } from "@/lib/admin/adminLog";

// Admin → Admin log: the newest 2,000 changes admins made (lib/admin/adminLog.ts), with the words for each action
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  try {
    return NextResponse.json({ success: true, rows: await listAdminLog({ limit: 2000 }), actions: ADMIN_ACTIONS }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[admin log]", e);
    return NextResponse.json({ error: "Couldn't read the admin log." }, { status: 500 });
  }
}

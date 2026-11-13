import { NextRequest, NextResponse } from "next/server";
import { logAdmin } from "@/lib/adminLog";
import { getAdminSession } from "@/lib/adminAuth";
import { addTester, isEmail, listTesters, removeTester } from "@/lib/toolkit/store";

// Survey Toolkit (beta test): the beta's testers, admins only. Admin → Toolkit (beta) uses it.
// GET                        → the list
// POST { email, note? }      → add (or change the note)
// DELETE ?email=             → remove
export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  try {
    return NextResponse.json({ success: true, testers: await listTesters() }, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    console.error("[toolkit testers]", e);
    return NextResponse.json({ error: "Couldn't read the testers." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const b = (await req.json().catch(() => null)) as { email?: unknown; note?: unknown } | null;
  const email = typeof b?.email === "string" ? b.email : "";
  if (!isEmail(email)) return NextResponse.json({ error: "Type an email address." }, { status: 400 });
  try {
    await addTester(email, typeof b?.note === "string" ? b.note : "", admin.user.email);
    console.info("[toolkit testers] added", email.trim().toLowerCase(), "by", admin.user.email);
    await logAdmin(admin.user, "toolkit.tester", email.trim().toLowerCase(), "Added", req);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[toolkit testers]", e);
    return NextResponse.json({ error: "Couldn't add the tester." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const email = req.nextUrl.searchParams.get("email") || "";
  if (!isEmail(email)) return NextResponse.json({ error: "Type an email address." }, { status: 400 });
  try {
    if (!(await removeTester(email))) return NextResponse.json({ error: "Not on the list." }, { status: 404 });
    console.info("[toolkit testers] removed", email.trim().toLowerCase(), "by", admin.user.email);
    await logAdmin(admin.user, "toolkit.tester", email.trim().toLowerCase(), "Removed", req);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[toolkit testers]", e);
    return NextResponse.json({ error: "Couldn't remove the tester." }, { status: 500 });
  }
}

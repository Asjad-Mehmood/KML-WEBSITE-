import { NextRequest, NextResponse } from "next/server";
import { getAdminSession } from "@/lib/adminAuth";
import { toolkitDownloads } from "@/lib/toolkit/downloads";
import { toolkitFeed } from "@/lib/toolkit/feed";
import { eventCounts, listDevices, listEvents, listTesterRows, removeDevice } from "@/lib/toolkit/store";
import { TOOLKIT_TOOLS } from "@/lib/toolkit/tools";

// Survey Toolkit (beta test): everything /toolkit-beta/admin shows, admins only.
// GET                 → testers, PCs, the newest events, 30-day counts, the latest versions and
//                       the Toolkit's downloads
// DELETE ?device=<id> → forget a PC and its events (it comes back when its Toolkit next reports)
// The testers themselves are added and removed with /api/toolkit/testers.
const noStore = { "Cache-Control": "no-store" };

export async function GET(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  try {
    const [testers, devices, events, counts, feed, downloads] = await Promise.all([
      listTesterRows(),
      listDevices(),
      listEvents(300),
      eventCounts(30),
      // the feed and GitHub are only extras here: the page works without them
      toolkitFeed().catch(() => null),
      toolkitDownloads().catch(() => null),
    ]);
    return NextResponse.json(
      {
        success: true,
        admin: { name: admin.user.name || "", email: admin.user.email },
        tools: TOOLKIT_TOOLS.map((t) => ({
          id: t.id,
          name: t.name,
          latest: feed?.tools.find((f) => f.id === t.id)?.version ?? null,
        })),
        testers,
        devices,
        events,
        counts,
        downloads,
      },
      { headers: noStore }
    );
  } catch (e) {
    console.error("[toolkit admin]", e);
    return NextResponse.json({ error: "Couldn't read the Toolkit's data." }, { status: 500, headers: noStore });
  }
}

export async function DELETE(req: NextRequest) {
  const admin = await getAdminSession(req);
  if (!admin) return NextResponse.json({ error: "Admins only." }, { status: 401 });
  const id = req.nextUrl.searchParams.get("device") || "";
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return NextResponse.json({ error: "Which PC?" }, { status: 400 });
  try {
    if (!(await removeDevice(id))) return NextResponse.json({ error: "No such PC." }, { status: 404 });
    console.info("[toolkit admin] removed PC", id, "by", admin.user.email);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("[toolkit admin]", e);
    return NextResponse.json({ error: "Couldn't remove the PC." }, { status: 500 });
  }
}

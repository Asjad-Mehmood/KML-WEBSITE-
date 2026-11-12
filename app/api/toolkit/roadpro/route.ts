import { NextResponse } from "next/server";
import { ROADPRO_COMMANDS, ROADPRO_FILES, ROADPRO_KEYS, ROADPRO_VERSION } from "@/lib/roadpro";
import { SITE_URL } from "@/lib/site";

// Survey Toolkit: what its RoadPro panel shows besides the install state (lib/toolkit/feed.ts):
// the command list and the help files, from lib/roadpro.ts, so a new RoadPro version needs no
// new Toolkit. Public: it is all on /roadpro already.
export function GET() {
  const abs = (href: string) => (href.startsWith("/") ? `${SITE_URL}${href}` : href);
  return NextResponse.json(
    {
      schema: 1,
      version: ROADPRO_VERSION,
      commands: ROADPRO_COMMANDS,
      keys: ROADPRO_KEYS,
      links: {
        page: `${SITE_URL}/roadpro`,
        guide: abs(ROADPRO_FILES.guidePdf.href),
        shortcuts: abs(ROADPRO_FILES.shortcuts.href),
        whatsNew: `${SITE_URL}/roadpro#new`,
      },
    },
    { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } }
  );
}

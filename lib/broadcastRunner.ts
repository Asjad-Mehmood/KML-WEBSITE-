// Emails of a broadcast (Admin → Releases) are sent on the server, not by the admin's open page:
// each step sends a batch (lib/releases.ts sendStep), then starts the next step as a request of its
// own, until the broadcast is done or paused. So it carries on when the browser is closed. The
// page only watches the counts; opening it (or the nightly job) restarts a run that stopped.
import crypto from "crypto";
import { stalledBroadcasts } from "@/lib/releases";

const key = () => process.env.AUTH_SECRET || process.env.DATABASE_URL || "excel-to-kml";

/** The step address takes this token: only the site itself starts steps */
export const stepToken = (id: string) => crypto.createHmac("sha256", key()).update(`broadcast-step:${id}`).digest("hex");

export function validStepToken(id: string, token: string): boolean {
  const want = Buffer.from(stepToken(id));
  const got = Buffer.from(token);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}

/** Start the next step; it answers at once and sends after its answer (app/api/broadcasts/[id]/step) */
export async function kickBroadcast(origin: string, id: string): Promise<void> {
  try {
    const res = await fetch(`${origin}/api/broadcasts/${encodeURIComponent(id)}/step`, {
      method: "POST",
      headers: { authorization: `Bearer ${stepToken(id)}` },
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) console.error("[broadcast] next step refused", id, res.status);
  } catch (err) {
    // the page or the nightly job starts it again
    console.error("[broadcast] couldn't start the next step", id, err);
  }
}

/** Restart every broadcast whose run stopped (a step that died, a deploy in between) */
export async function kickStalled(origin: string): Promise<number> {
  const ids = await stalledBroadcasts().catch(() => [] as string[]);
  await Promise.all(ids.map((id) => kickBroadcast(origin, id)));
  return ids.length;
}

// Survey Toolkit (beta test): checks what a Toolkit sends to /api/toolkit/event before anything
// is stored. Everything is trimmed to a fixed length; anything unexpected is refused.
import { TOOLKIT_TOOL_IDS } from "@/lib/toolkit/tools";
import { TOOLKIT_ACTIONS, type DeviceReport, type EventReport, type ToolkitAction } from "@/lib/toolkit/store";

export const MAX_EVENTS_PER_REPORT = 50;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max) : "");
const version = (v: unknown) => {
  const s = str(v, 40);
  return /^[0-9A-Za-z.+-]*$/.test(s) ? s : "";
};

export type Parsed = { ok: true; device: DeviceReport; events: EventReport[] } | { ok: false; error: string };

export function parseReport(body: unknown): Parsed {
  if (!body || typeof body !== "object") return { ok: false, error: "Send JSON." };
  const b = body as Record<string, unknown>;
  const d = (b.device && typeof b.device === "object" ? b.device : null) as Record<string, unknown> | null;
  if (!d) return { ok: false, error: "device is missing." };
  const id = str(d.id, 64);
  if (!/^[A-Za-z0-9-]{8,64}$/.test(id)) return { ok: false, error: "device.id must be 8 to 64 letters, digits or dashes." };
  const tools: Record<string, string> = {};
  if (d.tools && typeof d.tools === "object") {
    for (const [k, v] of Object.entries(d.tools as Record<string, unknown>)) {
      if (TOOLKIT_TOOL_IDS.includes(k)) tools[k] = version(v);
    }
  }
  const device: DeviceReport = {
    id,
    name: str(d.name, 100),
    windows: str(d.windows, 100),
    toolkitVersion: version(d.toolkitVersion),
    tools,
  };

  const raw = Array.isArray(b.events) ? b.events : [];
  if (raw.length > MAX_EVENTS_PER_REPORT) return { ok: false, error: `Send at most ${MAX_EVENTS_PER_REPORT} events at a time.` };
  const events: EventReport[] = [];
  for (const item of raw) {
    const e = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
    const tool = str(e.tool, 40);
    const action = str(e.action, 20) as ToolkitAction;
    if (!TOOLKIT_TOOL_IDS.includes(tool) && tool !== "toolkit") return { ok: false, error: `Unknown tool "${tool}".` };
    if (!TOOLKIT_ACTIONS.includes(action)) return { ok: false, error: `Unknown action "${action}".` };
    events.push({ tool, action, fromVersion: version(e.from), toVersion: version(e.to), message: str(e.message, 500) });
  }
  return { ok: true, device, events };
}

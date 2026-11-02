"use client";

// Survey Toolkit (beta test), Admin (/toolkit-beta/admin): who is in the beta, their PCs with the
// tool versions on each, and what the Toolkits did (installed, updated by hand or by themselves,
// failed and why). In the main Admin's frame and colours, but its own page, so the main Admin is
// unchanged. Data from /api/toolkit/admin; testers added and removed with /api/toolkit/testers.
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  LayoutDashboard,
  LayoutTemplate,
  Loader2,
  Monitor,
  Star,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import AdminShell, { type AdminGroup } from "@/components/admin/AdminShell";

interface Tool {
  id: string;
  name: string;
  latest: string | null;
}
interface Tester {
  email: string;
  note: string;
  addedBy: string;
  createdAt: string;
  name: string | null;
  lastLogin: string | null;
  devices: number;
}
interface Device {
  id: string;
  email: string | null;
  userName: string | null;
  name: string;
  windows: string;
  toolkitVersion: string;
  tools: Record<string, string>;
  firstSeen: string;
  lastSeen: string;
}
interface Event {
  id: string;
  deviceId: string;
  deviceName: string | null;
  email: string | null;
  tool: string;
  action: string;
  fromVersion: string;
  toVersion: string;
  message: string;
  createdAt: string;
}
interface Data {
  admin: { name: string; email: string };
  tools: Tool[];
  testers: Tester[];
  devices: Device[];
  events: Event[];
  counts: Record<string, { all: number; automatic: number }>;
  downloads: { total: number; releases: { tag: string; published: string | null; prerelease: boolean; downloads: number }[] } | null;
}

type Section = "overview" | "testers" | "pcs" | "activity" | "front";

/** 1.0.10 is newer than 1.0.9 */
export function isOlder(a: string, b: string): boolean {
  const pa = a.split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  const pb = b.split(/[.+-]/).map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const d = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (d !== 0) return d < 0;
  }
  return false;
}

const when = (s: string | null) => (s ? new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "—");
const day = (s: string | null) => (s ? new Date(s).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—");
const DAY = 24 * 3600 * 1000;
const automatic = (e: Event) => e.message === "automatic" || e.message.startsWith("automatic:");
/** The reason without the "automatic: " the Toolkit puts in front */
const reason = (e: Event) => (e.message.startsWith("automatic:") ? e.message.slice(10).trim() : e.message === "automatic" ? "" : e.message);

/** Column headings in the PCs table */
const SHORT: Record<string, string> = { "excel-to-kml": "Excel to KML", traverse: "Traverse", "folder-manager": "Folder Mgr", slope: "Slope" };
const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

const card = "rounded-2xl bg-[var(--adm-card)] border border-[var(--adm-line)]";
const th = "px-3 py-2.5 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap";
const td = "px-3 py-2.5 align-top text-[13px] text-slate-300";

function ActionTag({ e }: { e: Event }) {
  const colour =
    e.action === "failed"
      ? "bg-rose-500/15 text-rose-300"
      : e.action === "updated"
        ? "bg-blue-500/15 text-blue-300"
        : e.action === "installed"
          ? "bg-emerald-500/15 text-emerald-300"
          : e.action === "uninstalled"
            ? "bg-amber-500/15 text-amber-300"
            : "bg-[var(--adm-hover)] text-slate-400";
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={`px-2 py-0.5 rounded-md text-[11.5px] font-bold ${colour}`}>{e.action}</span>
      {automatic(e) && <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-indigo-500/15 text-indigo-300">automatic</span>}
    </span>
  );
}

function Stat({ label, value, sub, warn }: { label: string; value: string | number; sub?: string; warn?: boolean }) {
  return (
    <div className={`${card} p-4 sm:p-5 min-w-0`}>
      <p className="text-[12px] font-semibold text-slate-500">{label}</p>
      <p className={`mt-1 text-[26px] font-extrabold tabular-nums ${warn ? "text-rose-300" : "text-white"}`}>{value}</p>
      {sub && <p className="mt-0.5 text-[12px] text-slate-500 truncate">{sub}</p>}
    </div>
  );
}

function Version({ v, latest }: { v: string | undefined; latest: string | null }) {
  if (!v) return <span className="text-slate-600">—</span>;
  const old = latest != null && isOlder(v, latest);
  return (
    <span className={`tabular-nums font-semibold ${old ? "text-amber-300" : "text-slate-200"}`} title={old ? `Latest is ${latest}` : undefined}>
      {v}
      {old && " ↑"}
    </span>
  );
}

function EventTable({ events, tools, showPc = true }: { events: Event[]; tools: Tool[]; showPc?: boolean }) {
  const nameOf = (id: string) => tools.find((t) => t.id === id)?.name ?? id;
  if (events.length === 0) return <p className="px-4 py-6 text-[13px] text-slate-500">Nothing yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px]">
        <thead className="border-b border-[var(--adm-line)]">
          <tr>
            <th className={th}>When</th>
            {showPc && <th className={th}>Tester · PC</th>}
            <th className={th}>Tool</th>
            <th className={th}>What</th>
            <th className={th}>Versions</th>
            <th className={th}>Reason</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--adm-line)]">
          {events.map((e) => (
            <tr key={e.id}>
              <td className={`${td} whitespace-nowrap text-slate-400`}>{when(e.createdAt)}</td>
              {showPc && (
                <td className={td}>
                  <span className="block truncate max-w-[220px]">{e.email ?? "—"}</span>
                  <span className="block text-[12px] text-slate-500 truncate max-w-[220px]">{e.deviceName || e.deviceId}</span>
                </td>
              )}
              <td className={`${td} whitespace-nowrap`}>{nameOf(e.tool)}</td>
              <td className={td}>
                <ActionTag e={e} />
              </td>
              <td className={`${td} whitespace-nowrap tabular-nums`}>
                {e.fromVersion || "—"} → {e.toVersion || "—"}
              </td>
              <td className={`${td} ${e.action === "failed" ? "text-rose-200" : "text-slate-400"} max-w-[380px]`}>{reason(e) || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ToolkitAdmin() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [section, setSection] = useState<Section>("overview");
  const [toast, setToast] = useState<string | null>(null);
  const router = useRouter();

  const load = useCallback(
    () =>
      fetch("/api/toolkit/admin", { credentials: "include", cache: "no-store" })
        .then(async (r) => {
          const j = await r.json().catch(() => null);
          if (!r.ok || !j?.success) throw new Error(j?.error || `The server answered ${r.status}.`);
          setData(j as Data);
          setError(null);
          setUpdatedAt(Date.now());
        })
        .catch((e) => setError(e instanceof Error ? e.message : "Couldn't load."))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const refresh = () => {
    setLoading(true);
    void load();
  };

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const now = updatedAt ?? 0;
  const failed30 = data?.counts.failed?.all ?? 0;
  const groups: AdminGroup[] = [
    {
      label: "Survey Toolkit (beta)",
      sections: [
        { id: "overview", label: "Overview", icon: LayoutDashboard, text: "The beta at a glance: testers, PCs, updates and downloads" },
        { id: "testers", label: "Testers", icon: Users, text: "Who may use the beta. Admins always may.", count: data?.testers.length },
        { id: "pcs", label: "PCs", icon: Monitor, text: "Each tester's PCs and the tool versions on each", count: data?.devices.length },
        {
          id: "activity",
          label: "Activity",
          icon: Activity,
          text: "Installs, updates (by hand and automatic) and failures, with the reason",
          count: failed30,
          attention: failed30 > 0,
        },
      ],
    },
    {
      label: "Launch",
      sections: [{ id: "front", label: "Front page", icon: LayoutTemplate, text: "The Toolkit's front page: the chosen design in full, and all five options" }],
    },
  ];

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => null);
    router.replace("/");
    router.refresh();
  };

  // The frame reads the light/dark choice from this browser, so it is drawn only in the browser,
  // once the first answer is in (as the main Admin does)
  if (!data) {
    return (
      <div className="min-h-screen bg-[var(--adm-bg)] flex items-center justify-center p-6 text-slate-300">
        {error ? (
          <div role="alert" className="max-w-md text-center space-y-4">
            <p className="text-[15px] text-rose-200">{error}</p>
            <button onClick={refresh} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[13.5px] font-bold cursor-pointer">
              Try again
            </button>
          </div>
        ) : (
          <span className="flex items-center gap-2 text-[14px]">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Loading the Survey Toolkit admin…
          </span>
        )}
      </div>
    );
  }

  return (
    <AdminShell
      groups={groups}
      active={section}
      onSelect={(id) => setSection(id as Section)}
      admin={data.admin}
      onLogout={logout}
      onRefresh={refresh}
      refreshing={loading}
      updatedAt={updatedAt}
    >
      <div className="mb-5">
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-slate-400 hover:text-slate-100">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Main Admin
        </Link>
      </div>
      {error && (
        <div role="alert" className="mb-5 px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[13.5px] text-rose-200">
          {error}
        </div>
      )}
      {section === "overview" && <Overview data={data} now={now} onShow={setSection} />}
      {section === "testers" && <Testers data={data} onChanged={load} onToast={setToast} />}
      {section === "pcs" && <Pcs data={data} now={now} onChanged={load} onToast={setToast} />}
      {section === "activity" && <ActivityList data={data} />}
      {section === "front" && <FrontPage />}
      {toast && (
        <div role="status" className="fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-[13.5px] text-slate-100 shadow-xl">
          {toast}
        </div>
      )}
    </AdminShell>
  );
}

function Overview({ data, now, onShow }: { data: Data; now: number; onShow: (s: Section) => void }) {
  const c = data.counts;
  const active = data.devices.filter((d) => now - new Date(d.lastSeen).getTime() < 7 * DAY).length;
  const updated = c.updated?.all ?? 0;
  const auto = c.updated?.automatic ?? 0;
  const failures = data.events.filter((e) => e.action === "failed").slice(0, 5);
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <Stat label="Testers" value={data.testers.length} sub={`${data.testers.filter((t) => t.name != null).length} with an account`} />
        <Stat label="PCs" value={data.devices.length} sub={`${active} seen in the last 7 days`} />
        <Stat label="Updates, 30 days" value={updated} sub={`${auto} automatic · ${plural(c.installed?.all ?? 0, "install")}`} />
        <Stat label="Failures, 30 days" value={c.failed?.all ?? 0} sub={`${c.failed?.automatic ?? 0} during automatic updates`} warn={(c.failed?.all ?? 0) > 0} />
        <Stat
          label="Toolkit downloads"
          value={data.downloads ? data.downloads.total : "—"}
          sub={data.downloads ? `${plural(data.downloads.releases.length, "release")} on GitHub` : "GitHub can't be read just now"}
        />
      </div>

      <section className={card}>
        <h2 className="px-5 pt-4 pb-3 text-[15px] font-bold text-white">The tools on the testers&apos; PCs</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px]">
            <thead className="border-y border-[var(--adm-line)]">
              <tr>
                <th className={th}>Tool</th>
                <th className={th}>Latest</th>
                <th className={th}>Up to date</th>
                <th className={th}>Older</th>
                <th className={th}>Not installed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--adm-line)]">
              {data.tools.map((t) => {
                const vs = data.devices.map((d) => d.tools[t.id] || "");
                const have = vs.filter(Boolean);
                const older = t.latest ? have.filter((v) => isOlder(v, t.latest!)).length : 0;
                return (
                  <tr key={t.id}>
                    <td className={`${td} font-semibold text-slate-200`}>{t.name}</td>
                    <td className={`${td} tabular-nums`}>{t.latest ?? "—"}</td>
                    <td className={`${td} tabular-nums`}>{have.length - older}</td>
                    <td className={`${td} tabular-nums ${older ? "text-amber-300 font-semibold" : ""}`}>{older}</td>
                    <td className={`${td} tabular-nums text-slate-500`}>{vs.length - have.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className={card}>
        <div className="px-5 pt-4 pb-3 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-300" aria-hidden />
          <h2 className="flex-1 text-[15px] font-bold text-white">Latest failures</h2>
          <button onClick={() => onShow("activity")} className="text-[13px] font-semibold text-blue-300 hover:text-blue-200 cursor-pointer">
            All activity
          </button>
        </div>
        <EventTable events={failures} tools={data.tools} />
      </section>

      {data.downloads && data.downloads.releases.length > 0 && (
        <section className={card}>
          <div className="px-5 pt-4 pb-3 flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-400" aria-hidden />
            <h2 className="text-[15px] font-bold text-white">Toolkit downloads by release</h2>
          </div>
          <ul className="divide-y divide-[var(--adm-line)] border-t border-[var(--adm-line)]">
            {data.downloads.releases.map((r) => (
              <li key={r.tag} className="px-5 py-2.5 flex items-center gap-3 text-[13px]">
                <span className="font-semibold text-slate-200 tabular-nums">{r.tag}</span>
                {r.prerelease && <span className="px-1.5 py-0.5 rounded-md text-[10.5px] font-bold bg-amber-500/15 text-amber-300">pre-release</span>}
                <span className="flex-1 text-slate-500">{day(r.published)}</span>
                <span className="tabular-nums text-slate-300">{r.downloads}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Testers({ data, onChanged, onToast }: { data: Data; onChanged: () => Promise<void>; onToast: (s: string) => void }) {
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setProblem(null);
    try {
      const r = await fetch("/api/toolkit/testers", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, note }),
      });
      const j = await r.json().catch(() => null);
      if (!r.ok) throw new Error(j?.error || `The server answered ${r.status}.`);
      onToast(`${email.trim().toLowerCase()} can use the beta now.`);
      setEmail("");
      setNote("");
      await onChanged();
    } catch (err) {
      setProblem(err instanceof Error ? err.message : "Couldn't add.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (t: Tester) => {
    if (!window.confirm(`Remove ${t.email} from the beta? Their Toolkit says the beta is closed the next time it checks.`)) return;
    const r = await fetch(`/api/toolkit/testers?email=${encodeURIComponent(t.email)}`, { method: "DELETE", credentials: "include" });
    const j = await r.json().catch(() => null);
    onToast(r.ok ? `${t.email} was removed.` : j?.error || "Couldn't remove.");
    await onChanged();
  };

  return (
    <div className="space-y-6">
      <form onSubmit={add} className={`${card} p-5 space-y-3`}>
        <h2 className="text-[15px] font-bold text-white flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-blue-400" aria-hidden /> Add a tester
        </h2>
        <p className="text-[13px] text-slate-500">
          They sign in to the Toolkit with their Excel to KML account. Someone without an account yet can create one in the Toolkit with this email.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <label className="flex-1">
            <span className="sr-only">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              className="w-full px-3 py-2 rounded-lg bg-[var(--adm-bg)] border border-[var(--adm-line)] text-[14px] text-slate-100 placeholder:text-slate-600"
            />
          </label>
          <label className="flex-1">
            <span className="sr-only">Note</span>
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              placeholder="Note (optional): which PC, AutoCAD…"
              className="w-full px-3 py-2 rounded-lg bg-[var(--adm-bg)] border border-[var(--adm-line)] text-[14px] text-slate-100 placeholder:text-slate-600"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-[13.5px] font-bold disabled:opacity-60 cursor-pointer"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Add
          </button>
        </div>
        {problem && <p role="alert" className="text-[13px] text-rose-300">{problem}</p>}
      </form>

      <section className={card}>
        {data.testers.length === 0 ? (
          <p className="px-5 py-6 text-[13px] text-slate-500">No testers yet. Admins can always use the beta.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="border-b border-[var(--adm-line)]">
                <tr>
                  <th className={th}>Tester</th>
                  <th className={th}>Note</th>
                  <th className={th}>PCs</th>
                  <th className={th}>Last sign-in</th>
                  <th className={th}>Added</th>
                  <th className={th}>
                    <span className="sr-only">Remove</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--adm-line)]">
                {data.testers.map((t) => (
                  <tr key={t.email}>
                    <td className={td}>
                      <span className="block font-semibold text-slate-200">{t.email}</span>
                      <span className="block text-[12px] text-slate-500">{t.name ?? "No account yet"}</span>
                    </td>
                    <td className={`${td} text-slate-400 max-w-[260px]`}>{t.note || "—"}</td>
                    <td className={`${td} tabular-nums`}>{t.devices}</td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>{when(t.lastLogin)}</td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>
                      {day(t.createdAt)}
                      {t.addedBy && <span className="block text-[12px] text-slate-500">by {t.addedBy}</span>}
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        onClick={() => void remove(t)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                        title={`Remove ${t.email}`}
                        aria-label={`Remove ${t.email}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Pcs({ data, now, onChanged, onToast }: { data: Data; now: number; onChanged: () => Promise<void>; onToast: (s: string) => void }) {
  const [open, setOpen] = useState<string | null>(null);
  const remove = async (d: Device) => {
    if (!window.confirm(`Forget ${d.name || d.id} and its activity? It comes back the next time its Toolkit checks in.`)) return;
    const r = await fetch(`/api/toolkit/admin?device=${encodeURIComponent(d.id)}`, { method: "DELETE", credentials: "include" });
    const j = await r.json().catch(() => null);
    onToast(r.ok ? `${d.name || d.id} was removed.` : j?.error || "Couldn't remove.");
    await onChanged();
  };
  if (data.devices.length === 0) {
    return <p className={`${card} px-5 py-6 text-[13px] text-slate-500`}>No PCs yet. A PC shows here once a tester signs in to the Toolkit on it.</p>;
  }
  return (
    <section className={card}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="border-b border-[var(--adm-line)]">
            <tr>
              <th className={th}>
                <span className="sr-only">Show activity</span>
              </th>
              <th className={th}>PC · tester</th>
              <th className={th}>Toolkit</th>
              {data.tools.map((t) => (
                <th key={t.id} className={th} title={t.latest ? `Latest ${t.latest}` : undefined}>
                  {SHORT[t.id] ?? t.name}
                </th>
              ))}
              <th className={th}>Last seen</th>
              <th className={th}>
                <span className="sr-only">Remove</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--adm-line)]">
            {data.devices.map((d) => {
              const shown = open === d.id;
              const quiet = now - new Date(d.lastSeen).getTime() > 7 * DAY;
              return (
                <Fragment key={d.id}>
                  <tr>
                    <td className={td}>
                      <button
                        onClick={() => setOpen(shown ? null : d.id)}
                        aria-expanded={shown}
                        aria-label={`${shown ? "Hide" : "Show"} the activity of ${d.name || d.id}`}
                        className="p-1 rounded-md text-slate-500 hover:text-slate-200 hover:bg-[var(--adm-hover)] cursor-pointer"
                      >
                        {shown ? <ChevronDown className="w-4 h-4" aria-hidden /> : <ChevronRight className="w-4 h-4" aria-hidden />}
                      </button>
                    </td>
                    <td className={td}>
                      <span className="block font-semibold text-slate-200">{d.name || d.id}</span>
                      <span className="block text-[12px] text-slate-500">{d.email ?? "—"}</span>
                      <span className="block text-[11.5px] text-slate-600 truncate max-w-[260px]" title={d.windows}>
                        {d.windows}
                      </span>
                    </td>
                    <td className={`${td} tabular-nums`}>{d.toolkitVersion || "—"}</td>
                    {data.tools.map((t) => (
                      <td key={t.id} className={td}>
                        <Version v={d.tools[t.id]} latest={t.latest} />
                      </td>
                    ))}
                    <td className={`${td} whitespace-nowrap ${quiet ? "text-slate-500" : "text-slate-300"}`}>{when(d.lastSeen)}</td>
                    <td className={`${td} text-right`}>
                      <button
                        onClick={() => void remove(d)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-300 hover:bg-rose-500/10 cursor-pointer"
                        title="Forget this PC"
                        aria-label={`Forget ${d.name || d.id}`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden />
                      </button>
                    </td>
                  </tr>
                  {shown && (
                    <tr>
                      <td colSpan={data.tools.length + 5} className="bg-[var(--adm-hover)]">
                        <EventTable events={data.events.filter((e) => e.deviceId === d.id)} tools={data.tools} showPc={false} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="px-5 py-3 border-t border-[var(--adm-line)] text-[12px] text-slate-500">
        <span className="text-amber-300 font-semibold">1.0.2 ↑</span> is older than the latest version.
      </p>
    </section>
  );
}

const FILTERS = [
  ["all", "All"],
  ["failed", "Failed"],
  ["automatic", "Automatic"],
  ["updated", "Updated"],
  ["installed", "Installed"],
  ["uninstalled", "Uninstalled"],
] as const;

function ActivityList({ data }: { data: Data }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number][0]>("all");
  const [tool, setTool] = useState("");
  const shown = useMemo(
    () =>
      data.events.filter(
        (e) =>
          (filter === "all" || (filter === "automatic" ? automatic(e) : e.action === filter)) && (tool === "" || e.tool === tool)
      ),
    [data.events, filter, tool]
  );
  return (
    <section className={card}>
      <div className="px-4 sm:px-5 py-3 flex flex-wrap items-center gap-2 border-b border-[var(--adm-line)]">
        {FILTERS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setFilter(id)}
            aria-pressed={filter === id}
            className={`px-3 py-1.5 rounded-lg text-[12.5px] font-semibold cursor-pointer ${
              filter === id ? "bg-blue-500/15 text-blue-200" : "text-slate-400 hover:text-slate-100 hover:bg-[var(--adm-hover)]"
            }`}
          >
            {label}
          </button>
        ))}
        <label className="ml-auto">
          <span className="sr-only">Tool</span>
          <select
            value={tool}
            onChange={(e) => setTool(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[var(--adm-bg)] border border-[var(--adm-line)] text-[13px] text-slate-200"
          >
            <option value="">Every tool</option>
            {data.tools.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <EventTable events={shown} tools={data.tools} />
      <p className="px-5 py-3 border-t border-[var(--adm-line)] text-[12px] text-slate-500">The newest 300 events. Each PC keeps its newest 1,000.</p>
    </section>
  );
}

/** The front page: the chosen design (C, the hub) in full, and the five options to compare */
function FrontPage() {
  const links = [
    {
      href: "/toolkit-beta/home",
      title: "The front page, in detail",
      tag: "Chosen: C · Hub Diagram",
      text: "The whole page in the chosen style: the hub, the five tools, how it works, the workspace, updates, safety, requirements and questions. A draft until the launch.",
      chosen: true,
    },
    {
      href: "/toolkit-beta/home-options",
      title: "All five options",
      tag: "A to E, side by side",
      text: "Update Center, Dark Steps, Hub Diagram, Bold Yellow and App Window, live, with a note on each animation. Kept to compare.",
      chosen: false,
    },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {links.map((l) => (
          <a
            key={l.href}
            href={l.href}
            target="_blank"
            rel="noopener"
            className={`${card} group block p-6 hover:border-blue-500/50 transition-colors`}
          >
            <span
              className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11.5px] font-bold ${
                l.chosen ? "bg-amber-400/15 text-amber-300" : "bg-[var(--adm-hover)] text-slate-400"
              }`}
            >
              {l.chosen && <Star className="w-3.5 h-3.5" aria-hidden />} {l.tag}
            </span>
            <p className="mt-3 text-[17px] font-bold text-white group-hover:text-blue-300">{l.title} ↗</p>
            <p className="mt-1.5 text-[13.5px] text-slate-400">{l.text}</p>
            <p className="mt-3 text-[12.5px] font-mono text-slate-500">{l.href}</p>
          </a>
        ))}
      </div>
      <p className="text-[13px] text-slate-500">
        Both pages are for admins only and never indexed. At the launch, the chosen page goes on the website and its Download button goes to the public installer.
      </p>
    </div>
  );
}

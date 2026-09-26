"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";

type Status = { live: boolean; repo: string; hasToken: boolean; build?: string | null; why?: string };

// Admin → Settings: whether the web app is live from the app repository or
// running on the old copy saved in the website
export default function AppSourceStatus({ adminFetch }: { adminFetch: (url: string, options?: RequestInit) => Promise<Response> }) {
  const [s, setS] = useState<Status | null>(null);
  useEffect(() => {
    adminFetch("/api/admin/app-source")
      .then((r) => (r.ok ? r.json() : null))
      .then(setS)
      .catch(() => {});
  }, [adminFetch]);
  if (!s) return null;

  return s.live ? (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-sm text-emerald-200">
      <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
      <div>
        <p className="font-semibold">Web app is live from {s.repo}</p>
        {s.build && <p className="text-xs text-emerald-300/80 mt-0.5">Serving {s.build}</p>}
      </div>
    </div>
  ) : (
    <div className="flex items-start gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-sm text-amber-100">
      <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
      <div>
        <p className="font-semibold">Web app is running an old saved copy</p>
        <p className="text-xs text-amber-200/90 mt-1">{s.why}</p>
        <p className="text-xs text-amber-200/90 mt-1">
          Fix: in Vercel → Settings → Environment Variables, set <code className="font-mono">APP_SOURCE_TOKEN</code> to a GitHub
          fine-grained token with read-only &quot;Contents&quot; access to {s.repo}, then redeploy.
        </p>
      </div>
    </div>
  );
}

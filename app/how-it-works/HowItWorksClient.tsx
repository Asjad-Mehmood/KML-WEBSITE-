"use client";

import React, { useState } from "react";
import Workflow from "../../components/Workflow";
import Showcase from "../../components/Showcase";
import { LATEST_VERSION } from "@/lib/site";

/** The three steps and the live demo, as on the home page. */
export default function HowItWorksClient() {
  const [toast, setToast] = useState<string | null>(null);
  const onToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast((t) => (t === msg ? null : t)), 3500);
  };
  return (
    <>
      <Workflow />
      <Showcase versionTag={LATEST_VERSION} onToast={onToast} />
      {toast && (
        <div role="status" className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-sm font-medium py-3 px-5 rounded-xl shadow-2xl">
          {toast}
        </div>
      )}
    </>
  );
}

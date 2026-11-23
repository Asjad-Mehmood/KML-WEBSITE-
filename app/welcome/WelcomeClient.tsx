"use client";

import { useId, useState } from "react";
import AuthShell, { buttonClass, inputClass } from "../../components/AuthShell";
import { OCCUPATIONS, OCCUPATION_MAX } from "../../lib/occupations";
import { usePublicSettings } from "../../lib/publicSettings";
import ToolkitInvite from "../../components/ToolkitInvite";
import { AuthCard, destination } from "../signin/SigninFlow";

export default function WelcomeClient(props: { next: string; firstName: string; email: string; organization: string; occupation: string }) {
  const id = useId();
  const [organization, setOrganization] = useState(props.organization);
  const [occupation, setOccupation] = useState(props.occupation);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // then, while the Survey Toolkit is open to everyone, the Toolkit to download (else straight on)
  const toolkitPublic = usePublicSettings()?.toolkitPublic === true;
  const [invite, setInvite] = useState(false);
  // Full load so every part of the site sees the finished account
  const onward = () => (toolkitPublic ? setInvite(true) : window.location.assign(props.next));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        // empty boxes are left as they are
        body: JSON.stringify({ organization: organization.trim(), occupation: occupation.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save. Please try again.");
      onward();
    } catch (err) {
      setError((err as Error).message);
      setSaving(false);
    }
  };

  if (invite) {
    return (
      <AuthCard>
        <ToolkitInvite
          firstName={props.firstName}
          downloadHref="/api/toolkit/download"
          onContinue={() => window.location.assign(props.next)}
          continueLabel={`Continue to ${destination(props.next)}`}
        />
      </AuthCard>
    );
  }

  return (
    <AuthShell
      title={`Welcome${props.firstName ? `, ${props.firstName}` : ""}!`}
      subtitle={`Your account (${props.email}) is ready. Two optional details: type your own, or skip.`}
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label htmlFor={`${id}-org`} className="block text-xs font-bold text-slate-700 mb-1.5">
            Organisation / company <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id={`${id}-org`}
            maxLength={120}
            autoComplete="organization"
            placeholder="e.g. Apex Geomatics, or Independent"
            value={organization}
            onChange={(e) => setOrganization(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${id}-occ`} className="block text-xs font-bold text-slate-700 mb-1.5">
            Occupation / designation <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id={`${id}-occ`}
            list={`${id}-occ-list`}
            maxLength={OCCUPATION_MAX}
            autoComplete="organization-title"
            placeholder="Type yours or pick one"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            className={inputClass}
          />
          <datalist id={`${id}-occ-list`}>
            {OCCUPATIONS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
        </div>
        {error && (
          <p role="alert" className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold">
            {error}
          </p>
        )}
        <button type="submit" disabled={saving} className={buttonClass}>
          {saving ? "Saving…" : "Finish and continue"}
        </button>
        <button type="button" onClick={onward} className="block w-full text-center text-[13px] font-semibold text-slate-500 hover:text-slate-700 hover:underline">
          Skip for now
        </button>
      </form>
    </AuthShell>
  );
}

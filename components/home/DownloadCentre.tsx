"use client";

import Link from "next/link";
import { Compass, Download, FileSpreadsheet, FileText, FolderTree, Info, Route, ShieldCheck, Smartphone, UserCheck, type LucideIcon } from "lucide-react";
import RoadProDownload from "../RoadProDownload";
import TraverseDownload from "../TraverseDownload";
import FolderManagerDownload from "../FolderManagerDownload";
import { ROADPRO_FILES, ROADPRO_VERSION } from "@/lib/roadpro";
import { TRAVERSE_FILES, TRAVERSE_VERSION } from "@/lib/traverse";
import { PFM_VERSION } from "@/lib/folderManager";
import { useTraverseRelease } from "@/lib/useTraverseRelease";
import { roundedCount, type PublicStats } from "@/lib/publicCounts";
import { SHOW_ANDROID } from "@/lib/site";

const button =
  "w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer transition-colors";

function Card({
  Icon,
  name,
  version,
  file,
  needs,
  action,
  guide,
  href,
  extra,
}: {
  Icon: LucideIcon;
  name: string;
  version: string;
  file: string;
  needs: string;
  action: React.ReactNode;
  guide?: { href: string; label: string };
  href: string;
  /** another way to get it, under the main button */
  extra?: React.ReactNode;
}) {
  return (
    <li className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <span className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 text-[#0071e3] flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5" aria-hidden />
        </span>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200 text-[11.5px] font-bold text-slate-700">{version}</span>
      </div>
      <h3 className="mt-4 text-[16px] font-bold text-slate-900">
        <Link href={href} className="hover:text-[#0071e3]">{name}</Link>
      </h3>
      <p className="mt-1 text-[13px] font-medium text-slate-700">{file}</p>
      <p className="mt-1 text-[12.5px] text-slate-500 leading-relaxed flex-1">{needs}</p>
      <div className="mt-5">{action}</div>
      {extra}
      {guide && (
        <a href={guide.href} className="mt-3 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-slate-600 hover:text-[#0071e3]">
          <FileText className="w-3.5 h-3.5" aria-hidden /> {guide.label}
        </a>
      )}
    </li>
  );
}

// Home page: every program's download in one place, each behind the same free-account sign-in
export default function DownloadCentre({
  versionTag,
  fileSizeText,
  onDownloadClick,
  stats,
}: {
  versionTag: string;
  fileSizeText: string;
  onDownloadClick: () => void;
  stats?: PublicStats | null;
}) {
  const traverse = useTraverseRelease();
  return (
    <section id="download" aria-labelledby="download-heading" className="scroll-mt-24 py-20 lg:py-24 bg-slate-50 border-b border-slate-100">
      <div className="max-w-[1180px] mx-auto px-5 sm:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div className="max-w-[640px]">
            <p className="text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">Downloads</p>
            <h2 id="download-heading" className="mt-2 text-2xl sm:text-3xl lg:text-[36px] font-extrabold tracking-tight text-slate-900 leading-[1.15]">
              Every program, free
            </h2>
            <p className="mt-3 text-[15px] sm:text-base text-slate-600 leading-relaxed">
              Create a free account once (30 seconds, or one click with Google) and download any of them. Each download is kept in your dashboard.
              {stats && stats.downloads >= 100 ? ` Downloaded ${roundedCount(stats.downloads)} times so far.` : ""}
            </p>
          </div>
          <p className="flex items-center gap-2 text-[13px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden /> Official files from this site and our GitHub releases
          </p>
        </div>

        <ul className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            Icon={FileSpreadsheet}
            name="Excel to KML"
            version={versionTag}
            file={`Windows installer${fileSizeText ? ` · ${fileSizeText}` : ""}`}
            needs={`Windows 10 and 11, 64-bit. Also ${SHOW_ANDROID ? "on Android and " : ""}in your browser.`}
            href="/download"
            action={
              <button onClick={onDownloadClick} className={button}>
                <Download className="w-4 h-4" aria-hidden /> Download
              </button>
            }
            guide={{ href: "/tutorial", label: "Tutorial" }}
            extra={
              SHOW_ANDROID && (
              <Link
                href="/download#android"
                className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-[13px] font-semibold text-slate-800"
              >
                <Smartphone className="w-4 h-4 text-slate-500" aria-hidden /> Android app
              </Link>
              )
            }
          />
          <Card
            Icon={Route}
            name="RoadPro"
            version={`v${ROADPRO_VERSION}`}
            file="AutoCAD plugin · ZIP, 83 KB"
            needs="AutoCAD, Civil 3D or Map 3D 2014 or newer."
            href="/roadpro"
            action={<RoadProDownload className={button} label="Download" />}
            guide={{ href: ROADPRO_FILES.guidePdf.href, label: "User guide (PDF)" }}
          />
          <Card
            Icon={Compass}
            name="Traverse & Level"
            version={traverse.versionTag || `v${TRAVERSE_VERSION}`}
            file={`Windows installer${traverse.fileSizeText ? ` · ${traverse.fileSizeText}` : ""}`}
            needs="Windows 10 and 11, updates itself. Also a web app."
            href="/traverse"
            action={<TraverseDownload className={button} label="Download" />}
            guide={{ href: TRAVERSE_FILES.manualPdf.href, label: "User manual (PDF)" }}
          />
          <Card
            Icon={FolderTree}
            name="Project Folder Manager"
            version={`v${PFM_VERSION}`}
            file="Windows program · ZIP, 65 KB"
            needs="Windows 10 and 11. Nothing to install."
            href="/project-folder-manager"
            action={<FolderManagerDownload className={button} label="Download" />}
            guide={{ href: "/project-folder-manager#install", label: "Install steps" }}
          />
        </ul>

        {/* What a first-time visitor meets on the way: the account, and Windows' warning */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <Info className="w-5 h-5 mt-0.5 shrink-0 text-amber-700" aria-hidden />
            <div className="text-[13.5px] leading-relaxed text-amber-950">
              <p className="font-bold">&ldquo;Windows protected your PC&rdquo; when you open it?</p>
              <p className="mt-1 text-amber-900/90">
                That is normal for new programs that aren&apos;t signed with a paid certificate yet. Press <b>More info</b>, then <b>Run anyway</b>. Each
                file comes from our official GitHub releases, with its SHA-256 published on the{" "}
                <Link href="/download" className="font-semibold underline">download page</Link> to check it.
              </p>
            </div>
          </div>
          <div className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-5">
            <UserCheck className="w-5 h-5 mt-0.5 shrink-0 text-[#0071e3]" aria-hidden />
            <div className="text-[13.5px] leading-relaxed text-slate-700">
              <p className="font-bold text-slate-900">Why an account?</p>
              <p className="mt-1">
                It is free and keeps your downloads, files and jobs in one place, tells you when there&apos;s an update, and lets us answer you if
                something goes wrong. We don&apos;t sell your information; read the{" "}
                <Link href="/privacy" className="font-semibold text-[#0071e3] hover:underline">privacy policy</Link>.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

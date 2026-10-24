"use client";

import Link from "next/link";
import { Compass, Download, FileSpreadsheet, FileText, FolderTree, Route, ShieldCheck, type LucideIcon } from "lucide-react";
import RoadProDownload from "../RoadProDownload";
import TraverseDownload from "../TraverseDownload";
import FolderManagerDownload from "../FolderManagerDownload";
import { ROADPRO_FILES, ROADPRO_VERSION } from "@/lib/roadpro";
import { TRAVERSE_FILES, TRAVERSE_VERSION } from "@/lib/traverse";
import { PFM_VERSION } from "@/lib/folderManager";
import { useTraverseRelease } from "@/lib/useTraverseRelease";

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
}: {
  Icon: LucideIcon;
  name: string;
  version: string;
  file: string;
  needs: string;
  action: React.ReactNode;
  guide?: { href: string; label: string };
  href: string;
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
      {guide && (
        <a href={guide.href} className="mt-3 inline-flex items-center justify-center gap-1.5 text-[12.5px] font-semibold text-slate-600 hover:text-[#0071e3]">
          <FileText className="w-3.5 h-3.5" aria-hidden /> {guide.label}
        </a>
      )}
    </li>
  );
}

// Home page: every program's download in one place, each behind the same free-account sign-in
export default function DownloadCentre({ versionTag, fileSizeText, onDownloadClick }: { versionTag: string; fileSizeText: string; onDownloadClick: () => void }) {
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
              Sign in or create a free account once, and download any of them. Each download is kept in your dashboard.
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
            needs="Windows 10 and 11, 64-bit. Also on Android and in your browser."
            href="/download"
            action={
              <button onClick={onDownloadClick} className={button}>
                <Download className="w-4 h-4" aria-hidden /> Download
              </button>
            }
            guide={{ href: "/tutorial", label: "Tutorial" }}
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
      </div>
    </section>
  );
}

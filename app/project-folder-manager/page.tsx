import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCopy,
  Download,
  Eye,
  FolderTree,
  HardDrive,
  LayoutPanelLeft,
  Package,
  PencilLine,
  RefreshCw,
  Search,
  SquareStack,
} from "lucide-react";
import PageShell from "../../components/PageShell";
import ProductReviews from "../../components/ProductReviews";
import FolderManagerDownload from "../../components/FolderManagerDownload";
import {
  PFM_FEATURES,
  PFM_FILES,
  PFM_FIXES,
  PFM_INSTALL,
  PFM_MODULES,
  PFM_NAME,
  PFM_RELEASED,
  PFM_REQUIREMENTS,
  PFM_VERSION,
} from "@/lib/folderManager";
import { SITE_URL, jsonLd, openGraphFor } from "@/lib/site";

const TITLE = "Project Folder Manager for Windows";
const DESCRIPTION =
  "One screen for your project's master folder: every module from Admin to Archive by discipline, instant search, copy, move and bulk rename, and drive space. Free for Windows.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/project-folder-manager" },
  openGraph: {
    ...openGraphFor("/project-folder-manager", `${TITLE} | Excel to KML`, DESCRIPTION),
    images: [{ url: PFM_FILES.shots.main.src, width: PFM_FILES.shots.main.width, height: PFM_FILES.shots.main.height, alt: "Project Folder Manager: the project's eleven modules by discipline" }],
  },
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: PFM_NAME,
  description: DESCRIPTION,
  applicationCategory: "BusinessApplication",
  operatingSystem: "Windows 10, Windows 11",
  softwareVersion: PFM_VERSION,
  datePublished: PFM_RELEASED,
  downloadUrl: `${SITE_URL}${PFM_FILES.package.href}`,
  url: `${SITE_URL}/project-folder-manager`,
  image: `${SITE_URL}${PFM_FILES.shots.main.src}`,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  author: { "@type": "Person", name: "Muhammad Abdullah" },
  publisher: { "@id": `${SITE_URL}/#organization` },
};

const FEATURE_ICONS = [FolderTree, Eye, Search, ClipboardCopy, PencilLine, HardDrive, LayoutPanelLeft, RefreshCw];

const SHOTS = [
  {
    ...PFM_FILES.shots.main,
    title: "The project at a glance",
    alt: "Project Folder Manager: the eleven numbered modules from 00 Admin to 99 Archive, each with its discipline, sub-folder count, VIEW and OPEN, under a title bar with a clock and calendar",
  },
  {
    ...PFM_FILES.shots.panel,
    title: "A folder in the panel, and the drives",
    alt: "Project Folder Manager with the drives strip showing free space, and the 10_Survey folder open in the side panel with copy, cut, paste, rename and delete",
  },
];

function SectionHead({ id, eyebrow, title, text, Icon }: { id: string; eyebrow: string; title: string; text?: string; Icon: React.ElementType }) {
  return (
    <div className="max-w-3xl">
      <p className="inline-flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#0071e3]">
        <Icon className="w-4 h-4" aria-hidden /> {eyebrow}
      </p>
      <h2 id={id} className="mt-2 text-2xl sm:text-[30px] font-extrabold tracking-tight text-slate-900 leading-tight">
        {title}
      </h2>
      {text && <p className="mt-2 text-[15px] text-slate-600 leading-relaxed">{text}</p>}
    </div>
  );
}

export default function FolderManagerPage() {
  return (
    <PageShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }} />
      <div className="max-w-[1140px] mx-auto px-5 sm:px-8">
        <nav aria-label="Breadcrumb" className="text-[12.5px] text-slate-500 mb-5">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li><Link href="/" className="hover:text-[#0071e3]">Home</Link></li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-slate-700 font-medium">Project Folder Manager</li>
          </ol>
        </nav>

        {/* Hero */}
        <header className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-10 items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-[12px] font-bold text-amber-800">
              <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] uppercase tracking-wider">New</span>
              Windows · version {PFM_VERSION}
            </p>
            <h1 className="mt-4 text-[32px] sm:text-[44px] font-extrabold tracking-tight text-slate-900 leading-[1.08]">
              Project Folder Manager: every project folder <span className="text-[#0071e3]">one click away</span>
            </h1>
            <p className="mt-4 text-[16px] sm:text-[17px] text-slate-600 leading-relaxed">
              One screen for your project&apos;s master folder. The eleven modules, from Admin and Survey to Design &amp; Drawings and the
              Archive, are listed by discipline. You can see inside any folder, search the whole project instantly, and copy, move or rename files without
              digging through Explorer.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <FolderManagerDownload />
              <a href="#screens" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50">
                <SquareStack className="w-4 h-4" aria-hidden /> See the screens
              </a>
            </div>
            <p className="mt-3 text-[12.5px] text-slate-500">
              {PFM_FILES.package.detail} · Windows 10 or 11 · Free account needed · Developed by Muhammad Abdullah
            </p>
          </div>
          <figure className="rounded-2xl border border-slate-200 bg-slate-900 p-1.5 shadow-[0_16px_40px_rgba(15,23,42,0.18)]">
            <Image
              src={PFM_FILES.shots.main.src}
              alt={SHOTS[0].alt}
              width={PFM_FILES.shots.main.width}
              height={PFM_FILES.shots.main.height}
              priority
              sizes="(min-width: 1024px) 620px, 100vw"
              className="w-full h-auto rounded-xl"
            />
          </figure>
        </header>

        {/* What it does */}
        <section aria-labelledby="features-h" className="mt-20">
          <SectionHead id="features-h" eyebrow="What it does" title="The whole project folder on one screen" Icon={Package} />
          <ul className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PFM_FEATURES.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? CheckCircle2;
              return (
                <li key={f.title} className="rounded-2xl border border-slate-200 bg-[#fafbfc] p-5">
                  <div className="w-10 h-10 rounded-xl bg-[#0071e3]/10 text-[#0071e3] flex items-center justify-center">
                    <Icon className="w-5 h-5" aria-hidden />
                  </div>
                  <h3 className="mt-3 font-bold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-[14px] text-slate-600 leading-relaxed">{f.text}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Screenshots */}
        <section id="screens" aria-labelledby="shots-h" className="scroll-mt-28 mt-20">
          <SectionHead id="shots-h" eyebrow="Screenshots" title="How it looks" text="Shown with an example project in D:\Project. Tap a picture to see it full size." Icon={SquareStack} />
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
            {SHOTS.map((s) => (
              <figure key={s.src}>
                <a href={s.src} target="_blank" rel="noopener" className="block rounded-2xl border border-slate-200 bg-slate-900 p-1.5 hover:shadow-[0_12px_32px_rgba(15,23,42,0.18)] transition-shadow">
                  <Image src={s.src} alt={s.alt} width={s.width} height={s.height} sizes="(min-width: 1140px) 540px, (min-width: 768px) 50vw, 100vw" className="w-full h-auto rounded-xl" />
                </a>
                <figcaption className="mt-2 text-[14px] font-semibold text-slate-800">{s.title}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* The modules */}
        <section aria-labelledby="modules-h" className="mt-20">
          <SectionHead
            id="modules-h"
            eyebrow="Modules"
            title="Eleven modules, each with its discipline"
            text="Read from the project's top-level folders: a folder's number gives its discipline, and you can pick another for any folder. New folders on the disk are added with SCAN."
            Icon={FolderTree}
          />
          <ul className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {PFM_MODULES.map(([n, d]) => (
              <li key={n} className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3">
                <span className="font-mono font-bold text-[#0071e3]">{n}</span>
                <span className="text-[14px] font-semibold text-slate-800">{d}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Install */}
        <section id="install" aria-labelledby="install-h" className="scroll-mt-28 mt-20 grid grid-cols-1 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-8">
          <div>
            <SectionHead id="install-h" eyebrow="Install" title="Ready in a minute" text="Nothing to install: unzip and open." Icon={Download} />
            <ol className="mt-6 space-y-4">
              {PFM_INSTALL.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="shrink-0 w-8 h-8 rounded-full bg-[#0071e3] text-white text-sm font-bold flex items-center justify-center">{i + 1}</span>
                  <div>
                    <p className="font-bold text-slate-900">{s.title}</p>
                    <p className="text-[14.5px] text-slate-600">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
          <aside className="rounded-2xl bg-amber-50 border border-amber-200/80 p-5 self-start">
            <h3 className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4" aria-hidden /> Before you start
            </h3>
            <ul className="mt-3 space-y-2">
              {PFM_REQUIREMENTS.map((r) => (
                <li key={r} className="flex gap-2 text-[14px] text-amber-900 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" aria-hidden /> {r}
                </li>
              ))}
            </ul>
          </aside>
        </section>

        {/* Fixes */}
        <section aria-labelledby="fixes-h" className="mt-20">
          <SectionHead id="fixes-h" eyebrow="Help" title="Quick fixes for common questions" Icon={AlertTriangle} />
          <div className="mt-6 divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {PFM_FIXES.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-slate-900">
                  {f.q}
                  <ArrowRight className="w-4 h-4 text-slate-400 transition-transform group-open:rotate-90" aria-hidden />
                </summary>
                <p className="mt-2 text-[14.5px] text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <ProductReviews product="project-folder-manager" name="Project Folder Manager" />

        {/* Download */}
        <section id="download" aria-labelledby="download-h" className="scroll-mt-28 mt-20 rounded-3xl border border-slate-200 bg-gradient-to-b from-blue-50/70 to-white p-6 sm:p-10">
          <SectionHead id="download-h" eyebrow="Download" title={`Get Project Folder Manager ${PFM_VERSION}`} text="Free. Sign in or create a free account, then the download starts." Icon={Download} />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-blue-200 bg-white p-5 flex flex-col">
              <Package className="w-6 h-6 text-[#0071e3]" aria-hidden />
              <h3 className="mt-2 font-bold text-slate-900">{PFM_FILES.package.label}</h3>
              <p className="text-[13.5px] text-slate-500 flex-1">{PFM_FILES.package.detail}. Unzip everything into one folder.</p>
              <FolderManagerDownload className="mt-4 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer" label="Download (.zip)" />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-col">
              <AlertTriangle className="w-6 h-6 text-slate-500" aria-hidden />
              <h3 className="mt-2 font-bold text-slate-900">If Windows warns you</h3>
              <p className="text-[13.5px] text-slate-500 flex-1">
                The program isn&apos;t code-signed, so Windows SmartScreen may say it protected your PC the first time. Choose More info, then Run anyway.
              </p>
            </div>
          </div>
          <p className="mt-5 text-[13px] text-slate-500">
            Questions or a feature request? <Link href="/contact?topic=idea" className="text-[#0071e3] hover:underline">Write to us</Link>.
          </p>
        </section>
      </div>
    </PageShell>
  );
}

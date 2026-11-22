"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import type { DownloadProgram } from "@/lib/directDownloads";
import { useDirectDownload } from "@/lib/publicSettings";

/**
 * In place of a program's download button while its download is switched off (Admin → Settings →
 * Downloads): the program is installed with the Survey Toolkit, so this leads there. Same look as
 * the button it stands in for.
 */
export default function ToolkitOnly({ className, name }: { className?: string; name: string }) {
  const cls =
    className ?? "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0071e3] hover:bg-[#0077ed] text-white text-sm font-semibold cursor-pointer";
  return (
    <Link href="/toolkit" className={cls} title={`${name} is installed with the Survey Toolkit`}>
      <PackageOpen className="w-4 h-4" aria-hidden /> Get it in the Survey Toolkit
    </Link>
  );
}

/**
 * [children] (a program's download button) while the website offers [program]'s installer;
 * "Get it in the Survey Toolkit", in [className], once Admin → Settings → Downloads has it off.
 */
export function DownloadOrToolkit({
  program,
  name,
  className,
  children,
}: {
  program: DownloadProgram;
  name: string;
  className?: string;
  children: ReactNode;
}) {
  const offered = useDirectDownload(program);
  return offered === false ? <ToolkitOnly className={className} name={name} /> : <>{children}</>;
}

"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { PackageOpen } from "lucide-react";
import type { DownloadProgram } from "@/lib/products/directDownloads";
import { useDirectDownload } from "@/lib/content/publicSettings";

/**
 * In place of a program's download button while its download is switched off (Admin → Settings →
 * Downloads): a small note that it comes with the Survey Toolkit, in the colour of the text around it.
 * [className] is the button's it stands in for; only its margins are kept, so the note sits where
 * the button would.
 */
export default function ToolkitOnly({ className, name }: { className?: string; name: string }) {
  const margins = (className ?? "").split(/\s+/).filter((c) => /^-?m[trblxy]?-/.test(c)).join(" ");
  return (
    <p className={`${margins} inline-flex items-center gap-1.5 text-[13px] leading-snug opacity-80`} title={`${name} is installed with the Survey Toolkit`}>
      <PackageOpen className="w-4 h-4 shrink-0" aria-hidden />
      <span>
        Download it with the{" "}
        <Link href="/toolkit" className="font-semibold underline underline-offset-2 hover:opacity-80">
          Survey Toolkit
        </Link>
      </span>
    </p>
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

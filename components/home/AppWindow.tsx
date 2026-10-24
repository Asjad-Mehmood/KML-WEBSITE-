import Image from "next/image";

// A program's screenshot in a plain window frame (title bar and three dots), as in the hero
export default function AppWindow({
  src,
  width,
  height,
  alt,
  title,
  dark = false,
  sizes = "(min-width: 1024px) 640px, 100vw",
}: {
  src: string;
  width: number;
  height: number;
  alt: string;
  title: string;
  /** a black screen (AutoCAD): the frame goes dark to match */
  dark?: boolean;
  sizes?: string;
}) {
  return (
    <div className="rounded-2xl p-1.5 bg-gradient-to-b from-slate-200/80 to-slate-100/40 shadow-[0_30px_70px_-25px_rgba(15,23,42,0.35)]">
      <div className={`rounded-xl overflow-hidden border ${dark ? "border-slate-800 bg-black" : "border-slate-300/70 bg-white"}`}>
        <div className={`flex items-center gap-3 px-3 h-8 border-b ${dark ? "bg-slate-900 border-slate-800" : "bg-slate-100 border-slate-200"}`}>
          <span className="flex gap-1.5" aria-hidden>
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
          </span>
          <span className={`flex-1 text-center text-[11.5px] font-medium truncate pr-10 ${dark ? "text-slate-400" : "text-slate-500"}`}>{title}</span>
        </div>
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} className="w-full h-auto" />
      </div>
    </div>
  );
}

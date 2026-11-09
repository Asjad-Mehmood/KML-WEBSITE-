import React from "react";

/* Release notes are Markdown. This draws the parts they use — headings, lists, bold, code,
   links — as React elements, so nothing in a note can run on the page. */
function inline(text: string, key: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\((https?:\/\/[^)\s]+)\)|\*[^*]+\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith("**")) out.push(<strong key={k} className="font-semibold text-slate-900">{inline(t.slice(2, -2), k)}</strong>);
    else if (t.startsWith("`")) out.push(<code key={k} className="px-1 py-0.5 rounded bg-slate-100 text-[0.92em]">{t.slice(1, -1)}</code>);
    else if (t.startsWith("[")) {
      const label = t.slice(1, t.indexOf("]"));
      out.push(<a key={k} href={m[2]} target="_blank" rel="noopener noreferrer" className="text-[#0071e3] hover:underline">{label}</a>);
    } else out.push(<em key={k}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export default function ReleaseNotes({ md }: { md: string }) {
  const lines = md.replace(/\r/g, "").split("\n");
  const blocks: React.ReactNode[] = [];
  let list: string[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) {
      blocks.push(<p key={`p${blocks.length}`} className="mt-3 text-[14.5px] text-slate-700 leading-relaxed">{inline(para.join(" "), `p${blocks.length}`)}</p>);
      para = [];
    }
    if (list.length) {
      const items = list;
      blocks.push(
        <ul key={`u${blocks.length}`} className="mt-3 space-y-1.5 list-disc pl-5 text-[14.5px] text-slate-700 leading-relaxed">
          {items.map((it, j) => <li key={j}>{inline(it, `l${blocks.length}-${j}`)}</li>)}
        </ul>
      );
      list = [];
    }
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (h) {
      flush();
      // the release's own title is shown above; skip a top-level heading repeating it
      if (h[1].length === 1) continue;
      blocks.push(<h3 key={`h${blocks.length}`} className="mt-6 text-[16px] font-bold text-slate-900">{inline(h[2], `h${blocks.length}`)}</h3>);
    } else if (li) {
      if (para.length) flush();
      list.push(li[1]);
    } else if (!line.trim() || /^\|/.test(line) || /^-{3,}$/.test(line)) {
      flush();
    } else if (list.length && /^\s{2,}\S/.test(raw)) {
      list[list.length - 1] += " " + line.trim();
    } else {
      if (list.length) flush();
      para.push(line.trim());
    }
  }
  flush();
  return <div>{blocks}</div>;
}

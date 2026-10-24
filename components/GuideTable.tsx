// A table of figures in a guide: a heading row, then rows of values (numbers right-aligned)
export default function GuideTable({ head, rows, caption, foot }: { head: string[]; rows: (string | number)[][]; caption?: string; foot?: (string | number)[] }) {
  const num = (v: string | number) => typeof v === "number" || /^[−+-]?[\d.,]+( ?mm)?$/.test(String(v));
  return (
    <figure className="not-prose my-5">
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-[13px]">
          <thead className="bg-slate-50">
            <tr>
              {head.map((h) => (
                <th key={h} className="px-3 py-2 text-left text-[11.5px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t border-slate-100">
                {r.map((c, j) => (
                  <td key={j} className={`px-3 py-1.5 whitespace-nowrap text-slate-800 ${j > 0 && num(c) ? "text-right font-mono tabular-nums" : ""}`}>{c}</td>
                ))}
              </tr>
            ))}
          </tbody>
          {foot && (
            <tfoot>
              <tr className="border-t border-slate-300 bg-slate-50 font-semibold">
                {foot.map((c, j) => (
                  <td key={j} className={`px-3 py-1.5 whitespace-nowrap text-slate-900 ${j > 0 && num(c) ? "text-right font-mono tabular-nums" : ""}`}>{c}</td>
                ))}
              </tr>
            </tfoot>
          )}
        </table>
      </div>
      {caption && <figcaption className="mt-2 text-[12.5px] text-slate-500">{caption}</figcaption>}
    </figure>
  );
}

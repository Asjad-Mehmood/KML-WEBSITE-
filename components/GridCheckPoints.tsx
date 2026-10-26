import type { EpsgSystem } from "@/lib/epsgCatalog";
import { examplePoints, fmtDeg, fmtGrid } from "@/lib/epsgExample";
import { unitLabel } from "@/lib/gridParams";

/** Five points in the grid's area in latitude/longitude and easting/northing, to test a conversion against */
export default function GridCheckPoints({ s, name }: { s: EpsgSystem; name: string }) {
  const examples = examplePoints(s);
  if (!examples.length) return null;
  return (
    <>
      <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-10 mb-3">Check points for {name}</h2>
      <p>
        Five points inside the area of use of {name}, with their latitude and longitude on WGS 84 and their easting and northing in this
        grid ({unitLabel(s.def)}). Enter an easting and northing in the converter above: you should get the latitude and longitude shown,
        to a few centimetres.
      </p>
      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-[13px] whitespace-nowrap">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th scope="col" className="px-3 py-2 font-semibold">Point</th>
              <th scope="col" className="px-3 py-2 font-semibold">Latitude</th>
              <th scope="col" className="px-3 py-2 font-semibold">Longitude</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Easting</th>
              <th scope="col" className="px-3 py-2 font-semibold text-right">Northing</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-slate-800">
            {examples.map((x) => (
              <tr key={x.label}>
                <th scope="row" className="px-3 py-2 font-sans font-medium text-slate-700 text-left">{x.label}</th>
                <td className="px-3 py-2">{fmtDeg(x.lat, "N", "S")}</td>
                <td className="px-3 py-2">{fmtDeg(x.lon, "E", "W")}</td>
                <td className="px-3 py-2 text-right">{fmtGrid(x.e)}</td>
                <td className="px-3 py-2 text-right">{fmtGrid(x.n)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

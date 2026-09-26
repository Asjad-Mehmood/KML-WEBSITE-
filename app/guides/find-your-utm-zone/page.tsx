import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";

const SLUG = "find-your-utm-zone";
export const metadata = guideMetadata(SLUG);

const ZONES: [string, string][] = [
  ["United Arab Emirates", "39N west of 54°E (Al Dhafra, Ruwais); 40N from 54°E (Abu Dhabi city, Dubai, the northern emirates)"],
  ["Qatar, Bahrain", "39N"],
  ["Kuwait", "38N"],
  ["Saudi Arabia", "37N (Jeddah, Makkah, Madinah), 38N (Riyadh), 39N (Dammam, Al Khobar); 36N in the far north-west and 40N in the far south-east"],
  ["Oman", "39N in the far west, 40N for most of the country including Muscat"],
  ["Pakistan", "41N (Gwadar, Turbat), 42N (Karachi, Quetta, Multan, Peshawar), 43N (Lahore, Islamabad)"],
  ["India", "42N to 47N — 43N for Mumbai and Delhi, 44N for Hyderabad and Chennai, 45N for Kolkata"],
  ["Egypt", "35N west of 30°E, 36N from 30°E including Cairo, and 37N for a small corner in the far south-east"],
  ["United Kingdom", "29N, 30N and 31N (most of England is 30N) — though the British National Grid is more usual"],
];

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>The rule</h2>
      <p>
        UTM (Universal Transverse Mercator) splits the world into 60 zones, each 6° of longitude wide, numbered eastwards starting at
        180°W. For a site at a given longitude:
      </p>
      <p>
        <strong>zone = floor((longitude + 180) ÷ 6) + 1</strong>
      </p>
      <p>
        Use negative longitudes for the west. For example, Dubai at 55.3°E: (55.3 + 180) ÷ 6 = 39.2, so floor gives 39, plus 1 is{" "}
        <strong>zone 40</strong>. London at 0.1°W: (−0.1 + 180) ÷ 6 = 29.98 → 29 + 1 = <strong>zone 30</strong>.
      </p>

      <h2>North or south</h2>
      <p>
        Add <strong>N</strong> for sites north of the equator and <strong>S</strong> for sites south of it. Northings in the south
        start at 10,000,000 m at the equator and decrease towards the pole, so the same numbers mean a completely different place in
        40N and 40S.
      </p>

      <h2>The EPSG code</h2>
      <p>
        On the WGS 84 datum, UTM codes follow a pattern: <strong>326xx</strong> for north and <strong>327xx</strong> for south, where xx is
        the zone. Zone 40N is EPSG:32640 and zone 55S is EPSG:32755. National versions exist too, such as GDA2020 (MGA) in Australia
        and SIRGAS 2000 in Brazil, with their own codes.
      </p>

      <h2>Zones for common regions</h2>
      <ul>
        {ZONES.map(([place, zones]) => (
          <li key={place}>
            <strong>{place}:</strong> {zones}
          </li>
        ))}
      </ul>
      <p>
        Each zone has its own page with a converter already set to it, for example <Link href="/convert/utm-zone-40n">UTM zone 40N</Link>{" "}
        or <Link href="/convert/utm-zone-42n">UTM zone 42N</Link>. All zones are listed under{" "}
        <Link href="/convert/country/world">world-wide coordinate systems</Link>.
      </p>

      <h2>Sites near a zone edge</h2>
      <p>
        A project that crosses a zone boundary is usually kept in one zone, chosen by the client or the survey specification, even
        if part of it lies just outside. Check the drawing or control sheet rather than working it out from the longitude. There are
        also a few official exceptions, such as around Norway and Svalbard.
      </p>

      <h2>Not sure at all?</h2>
      <p>
        In the web and Windows apps, type a rough latitude and longitude in <strong>Near this</strong> under Coordinate system, and the
        list narrows to the systems whose area of use covers that spot. Points that fall outside the chosen zone are flagged after
        conversion.
      </p>
    </GuideLayout>
  );
}

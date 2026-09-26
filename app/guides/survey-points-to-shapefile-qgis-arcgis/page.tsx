import Link from "next/link";
import GuideLayout from "../../../components/GuideLayout";
import { guideMetadata } from "@/lib/guideMeta";
import WebAppLink from "@/components/WebAppLink";

const SLUG = "survey-points-to-shapefile-qgis-arcgis";
export const metadata = guideMetadata(SLUG);

export default function Guide() {
  return (
    <GuideLayout slug={SLUG}>
      <h2>Which one to send</h2>
      <ul>
        <li>
          <strong>Shapefile</strong> — for QGIS, ArcGIS and most GIS departments. It&apos;s the format they ask for when they say
          &ldquo;send me the GIS data&rdquo;.
        </li>
        <li>
          <strong>GeoJSON</strong> — one text file, for web maps (Leaflet, Mapbox, OpenLayers), QGIS and developers. Every column is
          kept with its full heading.
        </li>
      </ul>

      <h2>Step by step</h2>
      <ol>
        <li>
          Load your points in the <WebAppLink>web app</WebAppLink> or the Windows app and choose the grid. Check a known point on the
          map.
        </li>
        <li>
          If you want lines or plots as well, set them up under <strong>Lines and areas</strong> — see{" "}
          <Link href="/guides/boundaries-and-land-area-in-google-earth">boundaries and land area</Link>.
        </li>
        <li>
          Open the Save menu, press <strong>More formats</strong>, and under <strong>For GIS and GPS</strong> choose{" "}
          <strong>Shapefile</strong> or <strong>GeoJSON</strong>.
        </li>
      </ol>

      <h2>What&apos;s in the Shapefile</h2>
      <p>
        A zip holding a complete Shapefile for the points — .shp, .shx, .dbf, .prj and .cpg — and a second set named{" "}
        <strong>_lines</strong> or <strong>_areas</strong> when the job has them, since one Shapefile holds only one kind of shape.
      </p>
      <ul>
        <li>
          <strong>Point attributes:</strong> NAME, CODE, EASTING, NORTHING, ELEV, LAT and LON, then every other column in your sheet.
          Shapefile field names are limited to 10 characters, so long headings are shortened.
        </li>
        <li>
          <strong>Line and area attributes:</strong> NAME, POINTS and LENGTH_M, plus AREA_M2 and AREA_HA for closed areas.
        </li>
        <li>
          <strong>Text</strong> is UTF-8, so Arabic, Urdu and accented names come through.
        </li>
      </ul>

      <h2>What&apos;s in the GeoJSON</h2>
      <p>
        One FeatureCollection: a Point for every survey point, with its level as the third coordinate and every column as a property,
        and a LineString or Polygon for every line or area, with its length and area.
      </p>

      <h2>Coordinate system</h2>
      <p>
        Both are saved in <strong>WGS 84 latitude and longitude</strong> (EPSG:4326), which every GIS program reads without asking. Your
        grid eastings and northings travel as attributes, so nothing is lost. In QGIS, set the project to your grid and the layer is
        re-projected on the fly.
      </p>

      <h2>Opening them</h2>
      <ul>
        <li>
          <strong>QGIS:</strong> drag the zip or the .geojson file onto the map.
        </li>
        <li>
          <strong>ArcGIS Pro:</strong> unzip, then add the .shp from the Catalog pane.
        </li>
      </ul>
    </GuideLayout>
  );
}

import { test } from "node:test";
import assert from "node:assert/strict";
import { formatDms, fromUtm, gridInverse, inverse, parseDms, planarArea, selfIntersects, toUtm, utmZone } from "@/lib/geo/toolMath";

const near = (a: number, b: number, tol: number, what = "") => assert.ok(Math.abs(a - b) <= tol, `${what} ${a} ≠ ${b} (±${tol})`);

test("degrees, minutes and seconds read and write", () => {
  near(parseDms("25°17'10.5\"N")!, 25 + 17 / 60 + 10.5 / 3600, 1e-9, "N");
  near(parseDms("51 31 30 W")!, -(51 + 31 / 60 + 30 / 3600), 1e-9, "W");
  assert.equal(parseDms("not a bearing"), null);
  near(parseDms(formatDms(25.28625, "lat"))!, 25.28625, 1e-6, "round trip");
});

test("UTM: the zone, and there and back to within a millimetre", () => {
  assert.equal(utmZone(25.3, 51.5), 39);
  assert.equal(utmZone(60.5, 5.5), 32); // the Norway exception
  const u = toUtm(25.2854, 51.531);
  const back = fromUtm(u.easting, u.northing, u.zone, u.hemisphere);
  near(back.lat, 25.2854, 1e-8, "lat");
  near(back.lon, 51.531, 1e-8, "lon");
  near(u.easting, 553_200, 5_000, "easting in the right place");
});

test("ellipsoid distance: Flinders Peak to Buninyong (the textbook Vincenty example)", () => {
  const r = inverse(-(37 + 57 / 60 + 3.7203 / 3600), 144 + 25 / 60 + 29.5244 / 3600, -(37 + 39 / 60 + 10.1561 / 3600), 143 + 55 / 60 + 35.3839 / 3600);
  near(r.distance, 54972.271, 0.01, "distance");
});

test("grid distance and bearing", () => {
  const r = gridInverse(1000, 1000, 1000, 2000);
  near(r.distance, 1000, 1e-9);
  near(r.bearing, 0, 1e-9);
  near(gridInverse(0, 0, 100, 0).bearing, 90, 1e-9);
});

test("area and perimeter of a 100 m square, and a figure that crosses itself", () => {
  const sq: [number, number][] = [[0, 0], [100, 0], [100, 100], [0, 100]];
  const a = planarArea(sq);
  near(a.area, 10_000, 1e-9);
  near(a.perimeter, 400, 1e-9);
  assert.equal(selfIntersects(sq), false);
  assert.equal(selfIntersects([[0, 0], [100, 100], [100, 0], [0, 100]]), true);
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { MAX_ROWS, buildKml, parseSurveyRows } from "@/lib/geo/surveyRows";

test("ID, E, N, Z and a description, with a header line skipped", () => {
  const { rows, issues } = parseSurveyRows("Point,Easting,Northing,Level,Code\nTBM-01,228450.312,441203.845,12.5,Steel pin\n2,228610.458,441118.300,11.9,");
  assert.equal(issues.length, 0);
  assert.equal(rows.length, 2);
  assert.deepEqual(
    { id: rows[0].id, e: rows[0].easting, n: rows[0].northing, z: rows[0].elevation, d: rows[0].description },
    { id: "TBM-01", e: 228450.312, n: 441203.845, z: 12.5, d: "Steel pin" }
  );
});

test("N before E when asked, tabs and semicolons with decimal commas", () => {
  const tab = parseSurveyRows("P1\t441203.845\t228450.312", "NEZ").rows[0];
  assert.equal(tab.easting, 228450.312);
  assert.equal(tab.northing, 441203.845);
  const semi = parseSurveyRows("P1;228450,312;441203,845;12,5").rows[0];
  assert.equal(semi.easting, 228450.312);
  assert.equal(semi.elevation, 12.5);
});

test("a line without coordinates in the middle is reported, not guessed", () => {
  const { rows, issues } = parseSurveyRows("A,1000,2000\nB,abc,def\nC,1010,2010");
  assert.equal(rows.length, 2);
  assert.equal(issues.length, 1);
  assert.equal(issues[0].line, 2);
});

test("more than the maximum is cut off and says so", () => {
  const text = Array.from({ length: MAX_ROWS + 5 }, (_, i) => `P${i},${1000 + i},${2000 + i}`).join("\n");
  const r = parseSurveyRows(text);
  assert.equal(r.rows.length, MAX_ROWS);
  assert.equal(r.truncated, true);
});

test("the KML has one placemark per point and escapes text", () => {
  const kml = buildKml(
    [{ line: 1, id: "A<1>", easting: 1, northing: 2, elevation: 3, description: 'x & "y"', lat: 25.1, lon: 51.2 }],
    { title: "Test & job", gridLabel: "EPSG:2932", unit: "m" }
  );
  assert.equal((kml.match(/<Placemark>/g) || []).length, 1);
  assert.ok(kml.includes("A&lt;1&gt;"));
  assert.ok(kml.includes("x &amp; &quot;y&quot;"));
  assert.ok(kml.includes("51.2") && kml.includes("25.1"));
  assert.ok(!/<[^>]*Test & job/.test(kml));
});

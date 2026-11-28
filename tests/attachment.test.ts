import { test } from "node:test";
import assert from "node:assert/strict";
import { attachment } from "@/lib/http/attachment";

test("plain names are kept", () => {
  assert.equal(attachment("points.kmz"), `attachment; filename="points.kmz"; filename*=UTF-8''points.kmz`);
});

test("quotes, backslashes and line breaks cannot break the header", () => {
  const h = attachment('a"b\\c\r\nSet-Cookie: x=1.kml');
  assert.ok(!/[\r\n]/.test(h));
  const ascii = /filename="([^"]*)"/.exec(h)?.[1] ?? "";
  assert.ok(!ascii.includes('"') && !ascii.includes("\\"));
});

test("non-English names keep their exact name for browsers", () => {
  const h = attachment("نقاط مساحة.kml");
  assert.match(h, /filename="[_ ]+\.kml"/);
  assert.ok(h.includes("filename*=UTF-8''" + encodeURIComponent("نقاط مساحة.kml")));
});

test("an empty name still downloads", () => {
  assert.match(attachment(""), /filename="download"/);
});

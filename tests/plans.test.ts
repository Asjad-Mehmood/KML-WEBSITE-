import { test } from "node:test";
import assert from "node:assert/strict";
import { FREE_LIMITS, METER_LABEL, PLANS, freePoints, limitText, type Meter } from "@/lib/billing/plans";

test("the free plan has a limit on every meter; Pro has none", () => {
  for (const m of Object.keys(METER_LABEL) as Meter[]) {
    assert.ok(typeof PLANS.free.limits[m] === "number" && PLANS.free.limits[m]! > 0, m);
    assert.equal(PLANS.pro.limits[m], null, m);
  }
});

test("the free plan's words follow its limits", () => {
  assert.deepEqual(PLANS.free.points, freePoints(PLANS.free.limits.monthlyWork!, PLANS.free.limits["jobs:kml"]!));
  assert.match(freePoints(12, 3)[0], /^12 /);
  assert.match(freePoints(12, 3)[1], /^3 /);
  assert.equal(FREE_LIMITS.monthlyWork, PLANS.free.limits.monthlyWork);
});

test("every limit message names its number", () => {
  for (const m of Object.keys(METER_LABEL) as Meter[]) {
    const t = limitText(m, 7);
    assert.ok(t.includes("7"), m);
    assert.ok(t.length > 20, m);
  }
});

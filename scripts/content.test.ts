import { test } from "node:test";
import assert from "node:assert/strict";
import { currentJobs, earlierJobs, fleetPortals, metrics, profile, stackGroups } from "../src/data/content.ts";
import { formatPeriod, plainText } from "../src/lib/format.ts";

test("every job has a unique id and a parseable period", () => {
  const ids = [...currentJobs, ...earlierJobs].map((j) => j.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const j of [...currentJobs, ...earlierJobs]) assert.match(formatPeriod(j.period), /^(\w{3} )?\d{4} - ((\w{3} )?\d{4}|Present)$/);
});

test("tenant count is derived from fleetPortals", () => {
  assert.equal(profile.statusLine, `OPERATIONAL - ${fleetPortals.length} TENANTS · AWS · REMOTE (ITALY)`);
  assert.equal(metrics.find((m) => m.label === "tenant portals")?.value, String(fleetPortals.length));
  assert.equal(new Set(fleetPortals.map((p) => p.key)).size, fleetPortals.length);
});

test("headline, employer and promotion history follow the spec", () => {
  assert.equal(profile.role, "Staff Software Engineer");
  assert.equal(currentJobs[0].company, "ESC Partners / HometownHUB");
  assert.equal(currentJobs[0].role, "Staff Software Engineer, Platform & Product");
  assert.equal(currentJobs[0].positions?.[0].title, currentJobs[0].role);
  assert.equal(currentJobs[0].positions?.length, 2);
  assert.equal(currentJobs[0].period.start, "2023-05");
  assert.ok(earlierJobs.some((j) => j.id === "basemap"));
  assert.match(profile.updated, /^\d{4}-\d{2}-\d{2}$/);
});

test("bullet lengths respect the limits", () => {
  for (const j of [...currentJobs, ...earlierJobs]) {
    for (const r of j.receipts) assert.ok(plainText(r).length <= 220, `site receipt too long: ${r.slice(0, 40)}`);
    for (const r of j.resumeReceipts ?? []) assert.ok(plainText(r).length <= 360, `resume bullet too long: ${r.slice(0, 40)}`);
  }
});

test("a Practices group exists and is resume-only", () => {
  const practices = stackGroups.find((g) => g.title === "Practices");
  assert.equal(practices?.resumeOnly, true);
});

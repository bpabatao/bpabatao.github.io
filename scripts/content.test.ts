import { test } from "node:test";
import assert from "node:assert/strict";
import { currentJobs, earlierJobs, earlierProjects, fleetPortals, fleetSize, metrics, profile, stackGroups } from "../src/data/content.ts";
import { cases } from "../src/data/cases.ts";
import { formatPeriod, plainText } from "../src/lib/format.ts";

test("every job has a unique id and a parseable period", () => {
  const ids = [...currentJobs, ...earlierJobs].map((j) => j.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const j of [...currentJobs, ...earlierJobs]) assert.match(formatPeriod(j.period), /^(\w{3} )?\d{4} - ((\w{3} )?\d{4}|Present)$/);
});

test("tenant count is derived from fleetPortals", () => {
  /* the fleet tile names the live subset and the whole fleet; both stay derived */
  const fleetTile = metrics.find((m) => m.label.endsWith("tenant fleet"));
  assert.equal(fleetTile?.value, `${fleetPortals.length} live`);
  assert.equal(fleetTile?.label, `${fleetSize}-tenant fleet`);
  assert.equal(metrics.length, 4, "four tiles fill a 2x2 grid on phones");
  assert.ok(fleetSize >= fleetPortals.length, "fleet cannot be smaller than the launched subset");
  assert.equal(new Set(fleetPortals.map((p) => p.key)).size, fleetPortals.length);
});

test("headline, employer and promotion history follow the spec", () => {
  assert.equal(profile.role, "Staff Software Engineer, Platform & Product");
  assert.equal(currentJobs[0].company, "ESC Partners / HometownHUB");
  assert.equal(currentJobs[0].role, "Staff Software Engineer, Platform & Product");
  assert.equal(currentJobs[0].positions?.[0].title, currentJobs[0].role);
  assert.equal(currentJobs[0].positions?.length, 2);
  assert.equal(currentJobs[0].period.start, "2023-05");
  // BaseMap was a client of the CoDev agency, not an employer: it is a project under codev, never a job
  assert.ok(!earlierJobs.some((j) => j.id === "basemap"));
  assert.ok(earlierProjects.some((p) => p.title.startsWith("Basemap") && p.jobId === "codev"));
  assert.match(profile.updated, /^\d{4}-\d{2}-\d{2}$/);
});

test("bullet lengths respect the limits", () => {
  for (const j of [...currentJobs, ...earlierJobs]) {
    for (const r of j.receipts) assert.ok(plainText(r).length <= 220, `site receipt too long: ${r.slice(0, 40)}`);
    for (const r of j.resumeReceipts ?? []) assert.ok(plainText(r).length <= 360, `resume bullet too long: ${r.slice(0, 40)}`);
  }
});

test("a Practices group exists and is LinkedIn-only", () => {
  const practices = stackGroups.find((g) => g.title === "Practices");
  assert.equal(practices?.linkedinOnly, true);
});

test("hero availability line carries remote, CET, work authorization and the markets", () => {
  assert.equal(profile.markets, "US and EU teams");
  assert.equal(profile.availabilityLine, "Open to Staff / Lead platform and product engineering roles · Remote from Italy (CET), async-first · EU work authorization · US and EU teams");
  assert.ok(profile.availabilityLine.endsWith(profile.markets));
});

test("stack items name each technology once", () => {
  const items = stackGroups.flatMap((g) => g.items.flatMap((i) => i.split(/\s*(?:·|,|\s-\s)\s*/)));
  assert.ok(!items.includes("Bedrock"), "bare Bedrock duplicates AWS Bedrock (Claude)");
  assert.ok(!items.includes("WAF"), "bare WAF duplicates WAFv2");
});

test("every case has decisions, moved out of the sections rather than copied", () => {
  const norm = (s: string) => s.toLowerCase().replace(/[.;:,]+$/, "");
  for (const c of cases) {
    assert.ok(c.decisions?.length, `${c.slug} has no decisions`);
    assert.ok(c.sections.some((s) => s.heading === "Architecture"), `${c.slug}: decisions render before Architecture`);
    const body = norm(c.sections.flatMap((s) => s.paragraphs).join(" "));
    for (const d of c.decisions ?? []) assert.ok(!body.includes(norm(d).slice(-40)), `${c.slug} repeats: ${d.slice(0, 40)}`);
  }
});

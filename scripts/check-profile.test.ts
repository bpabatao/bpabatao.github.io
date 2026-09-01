import { test } from "node:test";
import assert from "node:assert/strict";
import { bulletProblems, dateProblems, denylistHits, keywordGaps, lintResumeHtml, slugProblems, tokenHits, trackedTextFiles } from "./check-profile.ts";
import { renderHtml } from "./render-resume.ts";
import { buildResumeModel } from "./resume-model.ts";

const good = renderHtml(buildResumeModel());

test("the real resume passes the ATS lint", () => {
  assert.deepEqual(lintResumeHtml(good), []);
  assert.deepEqual(dateProblems(good), []);
  assert.deepEqual(bulletProblems(good), []);
  assert.deepEqual(keywordGaps(good, ["Staff", "REST", "Terraform"]), []);
});

test("negative fixtures fail", () => {
  assert.ok(lintResumeHtml(good.replace("<h2>Summary</h2>", "<h2>Summary</h2><table><tr><td>x</td></tr></table>")).some((p) => p.includes("<table")));
  assert.ok(lintResumeHtml(good.replace("<h2>Education</h2>", "<h2>Schooling</h2>")).some((p) => p.includes("heading")));
  assert.ok(dateProblems(good.replace("Sep 2025 - Present", "Sep 2025 - now")).length > 0);
  assert.ok(bulletProblems(`<ul><li>${"x".repeat(361)}</li></ul>`).length > 0);
  assert.deepEqual(keywordGaps("nothing here", ["Kubernetes"]), ["Kubernetes"]);
  assert.deepEqual(denylistHits("work for Acme and zenith today", ["Acme", "Zenith"], "t"), ["t: Acme", "t: Zenith"]);
  assert.deepEqual(denylistHits("zenith-v rocket", ["Zenith"], "t"), ["t: Zenith"]);
  assert.ok(tokenHits("key AKIAABCDEFGHIJKLMNOP here", "t").length === 1);
  assert.ok(tokenHits("token ATATT3xFfGF0abcdefghijklmnopqrstuvwxyz", "t").length === 1);
  assert.deepEqual(tokenHits("nothing", "t"), []);
});

test("slugs map to diagrams and flagships", () => {
  assert.deepEqual(slugProblems(), []);
});

test("denylist scan covers every tracked text file and carves out only fleetPortals", () => {
  const files = trackedTextFiles();
  const labels = files.map((f) => f.label);
  for (const must of ["src/data/content.ts", "src/data/cases.ts", "scripts/check-profile.ts", "resume/og-source.json", "README.md"]) assert.ok(labels.includes(must), must);
  const content = files.find((f) => f.label === "src/data/content.ts");
  assert.ok(content && !content.text.includes("export const fleetPortals"), "the fleetPortals block is blanked before scanning");
  assert.ok(content && content.text.includes("fleetPortals: the one allowed place"));
  // a term planted anywhere else would be reported with its file as the label
  assert.deepEqual(denylistHits("// note: Acme Water goes live next week", ["Acme Water"], "src/data/content.ts"), ["src/data/content.ts: Acme Water"]);
});

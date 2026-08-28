import { test } from "node:test";
import assert from "node:assert/strict";
import { bulletProblems, dateProblems, denylistHits, keywordGaps, lintResumeHtml, slugProblems, tokenHits } from "./check-profile.ts";
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
  assert.ok(dateProblems(good.replace("May 2023 - Present", "May 2023 - now")).length > 0);
  assert.ok(bulletProblems(`<ul><li>${"x".repeat(361)}</li></ul>`).length > 0);
  assert.deepEqual(keywordGaps("nothing here", ["Kubernetes"]), ["Kubernetes"]);
  assert.deepEqual(denylistHits("work for Carmel and delta today", ["Carmel", "Delta"], "t"), ["t: Carmel", "t: Delta"]);
  assert.deepEqual(denylistHits("delta-v rocket", ["Delta"], "t"), ["t: Delta"]);
  assert.ok(tokenHits("key AKIAABCDEFGHIJKLMNOP here", "t").length === 1);
  assert.ok(tokenHits("token ATATT3xFfGF0abcdefghijklmnopqrstuvwxyz", "t").length === 1);
  assert.deepEqual(tokenHits("nothing", "t"), []);
});

test("slugs map to diagrams and flagships", () => {
  assert.deepEqual(slugProblems(), []);
});

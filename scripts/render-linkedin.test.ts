import { test } from "node:test";
import assert from "node:assert/strict";
import { LIMITS, bodyOf, buildLinkedinPack } from "./render-linkedin.ts";

import { currentJobs, earlierJobs, earlierProjects, flagships, secondaryProjects } from "../src/data/content.ts";

const pack = buildLinkedinPack();
const names = Object.keys(pack).sort();

test("pack covers every job and every project with a paste header", () => {
  for (const f of ["headline.txt", "about.txt", "skills.txt", "experience-hth.txt", "experience-basemap.txt", "projects-core-api.txt", "projects-nmblr.txt"]) assert.ok(names.includes(f), f);
  assert.equal(names.filter((n) => n.startsWith("experience-")).length, currentJobs.length + earlierJobs.length);
  assert.equal(names.filter((n) => n.startsWith("projects-")).length, flagships.length + [...secondaryProjects, ...earlierProjects].filter((p) => p.linkedin !== false).length);
  for (const [name, text] of Object.entries(pack)) assert.match(text.split("\n")[0], /^# updated \d{4}-\d{2}-\d{2} - paste into LinkedIn > /, name);
});

test("bodies respect LinkedIn limits and render positions", () => {
  assert.equal(LIMITS.skills, 100);
  assert.ok(bodyOf(pack["headline.txt"]).length <= LIMITS.headline);
  assert.ok(bodyOf(pack["about.txt"]).length <= LIMITS.about);
  for (const n of names.filter((n) => n.startsWith("experience-") || n.startsWith("projects-"))) assert.ok(bodyOf(pack[n]).length <= LIMITS.description, n);
  assert.ok(bodyOf(pack["skills.txt"]).split("\n").length <= LIMITS.skills);
  assert.equal(bodyOf(pack["headline.txt"]), "Staff Software Engineer, Platform & Product | Multi-tenant SaaS | AWS · Terraform · TypeScript · agentic tooling");
  const hth = bodyOf(pack["experience-hth.txt"]);
  assert.ok(!hth.includes("**"), "lead markers must be stripped");
  assert.ok(hth.startsWith("## Staff Software Engineer, Platform & Product\nESC Partners / HometownHUB · Contract\nSep 2025 - Present\nNew York, USA (Remote)\n"));
  assert.ok(hth.includes("\n## Senior Full-Stack Engineer (Cloud)\nESC Partners / HometownHUB · Contract\nMay 2023 - Jan 2026\n"));
  assert.ok(bodyOf(pack["experience-basemap.txt"]).startsWith("## Senior Software Engineer\nBaseMap Inc · Full-time\nMar 2022 - Sep 2022\n"));
  assert.ok(bodyOf(pack["projects-core-api.txt"]).includes("https://bpabatao.github.io/case/core-api/"));
  assert.ok(bodyOf(pack["projects-nmblr.txt"]).includes("Associated with: Nmblr"));
  assert.ok(bodyOf(pack["projects-nmblr.txt"]).includes("Mar 2024 - Present"));
});

test("skills.txt lists Bedrock and WAF once", () => {
  const skills = bodyOf(pack["skills.txt"]).split("\n");
  assert.equal(skills.filter((s) => /bedrock/i.test(s)).length, 1);
  assert.equal(skills.filter((s) => /^WAF/i.test(s)).length, 1);
});

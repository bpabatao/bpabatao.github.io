import { test } from "node:test";
import assert from "node:assert/strict";
import { buildResumeModel } from "./resume-model.ts";

test("model uses ASCII separators, resume overlays and Present", () => {
  const m = buildResumeModel();
  assert.equal(m.page, "a4");
  assert.ok(!m.roleLine.includes("·"), "roleLine must use | not ·");
  assert.equal(m.roleLine, m.roleLine.toUpperCase());
  assert.ok(m.contact.includes(" | ") && !m.contact.includes("https://"));
  assert.equal(m.experience[0].title, "Staff Software Engineer, Platform & Product");
  assert.equal(m.experience[0].company, "ESC Partners / HometownHUB");
  assert.match(m.experience[0].dates, /^Sep 2025 - Present$/);
  assert.deepEqual(m.experience[0].previous, [{ title: "Senior Full-Stack Engineer (Cloud)", dates: "May 2023 - Aug 2025" }]);
  assert.equal(m.experience[0].bullets.length, 10);
  assert.equal(m.experience[0].bullets[0].lead, "Primary author of both generations of the fleet's core REST API");
  assert.equal(m.experience[1].company, "Nmblr - Biopharma Strategy & Collaboration Platform");
  assert.equal(m.earlier.length, 5); // BaseMap folded into CoDev
  assert.equal(m.earlier.find((r) => r.company === "Ordermentum")?.contract, true);
  assert.ok(m.skills.some((s) => s.title === "Practices"));
  assert.ok(!m.skills.some((s) => s.items.includes(" · ")), "skills items must be comma lists");
  assert.equal(m.education[0].dates, "2014 - 2018");
});

test("letter page is passed through", () => {
  assert.equal(buildResumeModel("letter").page, "letter");
});

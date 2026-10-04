import { test } from "node:test";
import assert from "node:assert/strict";
import { pdfPageCount, renderHtml } from "./render-resume.ts";
import { buildResumeModel } from "./resume-model.ts";

const html = renderHtml(buildResumeModel());

test("html keeps the ATS contract", () => {
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(html.includes('<meta name="author" content="Benedict Pabatao">'));
  assert.ok(html.includes("<title>Benedict Pabatao - Staff Software Engineer, Platform &amp; Product</title>"));
  assert.ok(html.includes("@page { size: A4; margin: 14mm 16mm; }"));
  for (const bad of ["<table", "<img", "column-count", "position: absolute", "@font-face"]) assert.ok(!html.includes(bad), bad);
  const h2 = [...html.matchAll(/<h2>(.*?)<\/h2>/g)].map((m) => m[1]);
  assert.deepEqual(h2, ["Summary", "Professional Experience", "Earlier Experience", "Technical Skills", "Education"]);
});

test("roles render in the two conventions with escaped text", () => {
  // stacked titles under one employer; the employer line keeps the full tenure for ATS date extraction
  assert.ok(html.includes('<div class="row employer"><span><span class="co">ESC Partners / HometownHUB</span> - multi-tenant utility customer-portal SaaS (contract) - New York, USA (Remote)</span> <span class="meta">May 2023 - Present</span></div>\n<h3 class="row"><span>Staff Software Engineer, Platform &amp; Product</span> <span class="meta">Sep 2025 - Present</span></h3>\n<h3 class="row"><span>Senior Full-Stack Engineer (Cloud)</span> <span class="meta">May 2023 - Aug 2025</span></h3>'));
  assert.ok(html.includes('<p class="earlier row"><span><b>Senior Software Engineer II</b> - HCL Technologies - New York, USA (Remote) (Kubernetes, Selenium)</span> <span class="meta">Feb 2020 - Apr 2022</span></p>'));
  // earlier roles are one line each: no heading, no bullets
  assert.ok(html.includes('<p class="earlier row"><span><b>Full-Stack Software Engineer</b> - Ordermentum (contract) - NSW, Australia (Remote) (Node.js, PostgreSQL, Docker, Kubernetes)</span> <span class="meta">Sep 2022 - Mar 2023</span></p>'));
  assert.ok(html.includes("<b>Senior Software Engineer</b> - CoDev (agency, embedded with BaseMap) - Utah, USA (Remote)"));
  assert.ok(!html.includes("<h3>Full-Stack Software Engineer"));
  assert.ok(!/Menlo|monospace/.test(html), "one typeface: dates and contact use the body font");
  assert.ok(html.includes("<li><b>Primary author of the fleet's core REST API, both generations</b> - 58% of v1"));
  assert.ok(html.includes("Biopharma Strategy &amp; Collaboration Platform"));
  assert.ok(!html.includes("<b>Practices:</b>"));
});

test("contact links are clickable and date ranges never wrap", () => {
  assert.ok(html.includes('<a href="mailto:jajapabatao@gmail.com">jajapabatao@gmail.com</a>'));
  assert.ok(html.includes('<a href="https://linkedin.com/in/benedict-pabatao">linkedin.com/in/benedict-pabatao</a>'));
  assert.ok(html.includes('<a href="https://github.com/bpabatao">github.com/bpabatao</a>'));
  assert.ok(html.includes('<a href="https://bpabatao.github.io">bpabatao.github.io</a>'));
  assert.match(html, /\.meta \{ white-space: nowrap;/);
});

test("letter page size is honoured", () => {
  assert.ok(renderHtml(buildResumeModel("letter")).includes("@page { size: Letter; margin: 14mm 16mm; }"));
});

test("pdfPageCount counts page objects", () => {
  assert.equal(pdfPageCount(Buffer.from("%PDF-1.4\n<< /Type /Pages /Count 2 >>\n<< /Type /Page >>\n<< /Type /Page >>", "latin1")), 2);
});

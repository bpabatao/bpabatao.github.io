import { test } from "node:test";
import assert from "node:assert/strict";
import { pdfPageCount, renderHtml } from "./render-resume.ts";
import { buildResumeModel } from "./resume-model.ts";

const html = renderHtml(buildResumeModel());

test("html keeps the ATS contract", () => {
  assert.ok(html.startsWith("<!doctype html>"));
  assert.ok(html.includes('<meta name="author" content="Benedict Pabatao">'));
  assert.ok(html.includes("<title>Benedict Pabatao - Staff Software Engineer</title>"));
  assert.ok(html.includes("@page { size: A4; margin: 14mm 16mm; }"));
  for (const bad of ["<table", "<img", "column-count", "position: absolute", "@font-face"]) assert.ok(!html.includes(bad), bad);
  const h2 = [...html.matchAll(/<h2>(.*?)<\/h2>/g)].map((m) => m[1]);
  assert.deepEqual(h2, ["Summary", "Professional Experience", "Earlier Experience", "Technical Skills", "Education"]);
});

test("roles render in the two conventions with escaped text", () => {
  assert.ok(html.includes("<h3>Staff Software Engineer, Platform &amp; Product</h3>\n<div class=\"loc\"><span class=\"co\">ESC Partners / HometownHUB</span> - New York, USA (Remote) | <span class=\"meta\">Sep 2025 - Present</span></div>\n<div class=\"loc\">Previously Senior Full-Stack Engineer (Cloud) | <span class=\"meta\">May 2023 - Jan 2026</span></div>"));
  assert.ok(html.includes("<h3>Senior Software Engineer II - HCL Technologies (New York, USA / Remote)</h3>\n<div class=\"loc\"><span class=\"meta\">Feb 2020 - Apr 2022</span></div>"));
  assert.ok(html.includes("<h3>Full Stack Software Engineer - Ordermentum (New South Wales, Australia / Remote, contract)</h3>"));
  assert.ok(html.includes("<li><b>Primary author (78%) of the core REST API middleware</b> connecting"));
  assert.ok(html.includes("Biopharma Strategy &amp; Collaboration Platform"));
  assert.ok(html.includes("<p><b>Practices:</b> Platform Engineering, "));
});

test("letter page size is honoured", () => {
  assert.ok(renderHtml(buildResumeModel("letter")).includes("@page { size: Letter; margin: 14mm 16mm; }"));
});

test("pdfPageCount counts page objects", () => {
  assert.equal(pdfPageCount(Buffer.from("%PDF-1.4\n<< /Type /Pages /Count 2 >>\n<< /Type /Page >>\n<< /Type /Page >>", "latin1")), 2);
});

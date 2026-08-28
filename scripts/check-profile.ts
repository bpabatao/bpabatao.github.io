import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { currentJobs, earlierJobs, earlierProjects, flagships, profile, secondaryProjects } from "../src/data/content.ts";
import { cases } from "../src/data/cases.ts";
import { plainText } from "../src/lib/format.ts";
import { LIMITS, bodyOf, buildLinkedinPack } from "./render-linkedin.ts";
import { pdfPageCount, renderHtml } from "./render-resume.ts";
import { buildResumeModel } from "./resume-model.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DENYLIST = resolve(homedir(), ".profile-sync/denylist.txt");
const HEADINGS = ["Summary", "Professional Experience", "Earlier Experience", "Technical Skills", "Education"];
const DATE = /^([A-Z][a-z]{2} )?\d{4} - (([A-Z][a-z]{2} )?\d{4}|Present)$/;
const TOKENS: [string, RegExp][] = [
  ["aws access key", /AKIA[0-9A-Z]{16}/],
  ["atlassian token", /ATAT[A-Za-z0-9_-]{20,}/],
  ["github token", /gh[pousr]_[A-Za-z0-9]{20,}/],
  ["jwt", /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/],
  ["password assignment", /(password|passwd|secret)\s*[:=]\s*\S{6,}/i],
];

const strip = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ");

export function lintResumeHtml(html: string): string[] {
  const out: string[] = [];
  for (const bad of ["<table", "<img", "column-count", "position: absolute", "position:absolute", "@font-face", "<header", "<footer"]) if (html.includes(bad)) out.push(`resume contains ${bad}`);
  const h2 = [...html.matchAll(/<h2>(.*?)<\/h2>/g)].map((m) => m[1]);
  if (h2.join("|") !== HEADINGS.join("|")) out.push(`resume heading order is ${h2.join(", ")} - expected ${HEADINGS.join(", ")}`);
  return out;
}

export function dateProblems(html: string): string[] {
  return [...html.matchAll(/<span class="meta">(.*?)<\/span>/g)].map((m) => m[1]).filter((d) => !DATE.test(d)).map((d) => `bad date: ${d}`);
}

export function bulletProblems(html: string, max = 360): string[] {
  return [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => strip(m[1]).trim()).filter((t) => t.length > max).map((t) => `bullet over ${max} chars: ${t.slice(0, 50)}...`);
}

export function keywordGaps(text: string, keywords: readonly string[]): string[] {
  const hay = strip(text).toLowerCase();
  return keywords.filter((k) => !hay.includes(k.toLowerCase()));
}

export function denylistHits(text: string, terms: readonly string[], label: string): string[] {
  const hay = strip(text);
  return terms.filter((t) => new RegExp(`(^|[^A-Za-z])${t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^A-Za-z])`, "i").test(hay)).map((t) => `${label}: ${t}`);
}

export function tokenHits(text: string, label: string): string[] {
  return TOKENS.filter(([, re]) => re.test(text)).map(([name]) => `${label}: looks like a ${name}`);
}

export function linkedinProblems(dir: string): string[] {
  const out: string[] = [];
  if (!existsSync(dir)) return ["linkedin/ missing - run npm run render"];
  for (const f of readdirSync(dir).filter((f) => f.endsWith(".txt"))) {
    const body = bodyOf(readFileSync(resolve(dir, f), "utf8"));
    const limit = f === "headline.txt" ? LIMITS.headline : f === "about.txt" ? LIMITS.about : f === "skills.txt" ? Infinity : LIMITS.description;
    if (body.length > limit) out.push(`${f} is ${body.length} chars, limit ${limit}`);
    if (f === "skills.txt" && body.split("\n").length > LIMITS.skills) out.push(`skills.txt has more than ${LIMITS.skills} entries`);
  }
  return out;
}

export function slugProblems(): string[] {
  const page = readFileSync(resolve(ROOT, "src/app/case/[slug]/page.tsx"), "utf8");
  const diagramKeys = [...page.matchAll(/"([a-z0-9-]+)":\s*\w+Diagram/g)].map((m) => m[1]);
  const out: string[] = [];
  for (const c of cases) if (!diagramKeys.includes(c.slug)) out.push(`case ${c.slug} has no diagram in page.tsx`);
  for (const f of flagships) if (!cases.some((c) => c.slug === f.slug)) out.push(`flagship ${f.slug} has no case study`);
  return out;
}

/* Fields that feed the resume and the LinkedIn pack; fleetPortals is deliberately not here. */
export function narrativeFields(): { label: string; text: string }[] {
  const out = [
    { label: "profile.summary", text: profile.summary },
    { label: "profile.resumeSummary", text: profile.resumeSummary },
    { label: "profile.headline", text: profile.headline },
    ...flagships.map((f) => ({ label: `flagship ${f.slug}`, text: `${f.title} ${f.outcome}` })),
    ...[...secondaryProjects, ...earlierProjects].filter((p) => p.linkedin !== false).map((p) => ({ label: `project ${p.title}`, text: `${p.title} ${p.description}` })),
  ];
  for (const j of [...currentJobs, ...earlierJobs]) {
    out.push(...j.receipts.map((r, i) => ({ label: `${j.id}.receipts[${i}]`, text: plainText(r) })));
    out.push(...(j.resumeReceipts ?? []).map((r, i) => ({ label: `${j.id}.resumeReceipts[${i}]`, text: plainText(r) })));
  }
  for (const c of cases) {
    out.push({ label: `case ${c.slug} subtitle`, text: c.subtitle });
    for (const section of c.sections) out.push(...section.paragraphs.map((p, i) => ({ label: `case ${c.slug} ${section.heading}[${i}]`, text: p })));
    out.push(...c.outcomes.map((o, i) => ({ label: `case ${c.slug} outcome[${i}]`, text: o })));
    out.push({ label: `case ${c.slug} meta`, text: `${c.meta.role} ${c.meta.ownership}` });
  }
  return out;
}

function main(argv: string[]): void {
  const ci = argv.includes("--ci");
  const problems: string[] = [];
  const html = renderHtml(buildResumeModel());
  problems.push(...lintResumeHtml(html), ...dateProblems(html), ...bulletProblems(html));
  problems.push(...keywordGaps(html, profile.atsKeywords).map((k) => `resume is missing ATS keyword: ${k}`));
  for (const j of [...currentJobs, ...earlierJobs]) for (const r of j.receipts) if (plainText(r).length > 220) problems.push(`${j.id} site receipt over 220 chars: ${r.slice(0, 50)}...`);
  problems.push(...linkedinProblems(resolve(ROOT, "linkedin")));
  problems.push(...slugProblems());

  const committed = resolve(ROOT, "resume/resume.html");
  if (existsSync(committed) && readFileSync(committed, "utf8") !== html) problems.push("resume/resume.html is stale - run npm run render");
  const pdf = resolve(ROOT, "public/resume.pdf");
  if (existsSync(pdf) && pdfPageCount(readFileSync(pdf)) > 2) problems.push("public/resume.pdf has more than 2 pages");

  const linkedinDir = resolve(ROOT, "linkedin");
  const pack = buildLinkedinPack();
  for (const [name, text] of Object.entries(pack)) {
    const file = resolve(linkedinDir, name);
    if (!existsSync(file) || readFileSync(file, "utf8") !== text) problems.push(`linkedin/${name} is stale - run npm run render`);
  }
  if (existsSync(linkedinDir)) for (const f of readdirSync(linkedinDir).filter((f) => f.endsWith(".txt"))) if (!(f in pack)) problems.push(`linkedin/${f} is orphaned - run npm run render`);

  for (const { label, text } of narrativeFields()) problems.push(...tokenHits(text, label));
  problems.push(...tokenHits(html, "resume.html"));

  if (!ci) {
    if (!existsSync(DENYLIST)) problems.push(`denylist missing at ${DENYLIST} (created by profile-sync --init)`);
    else {
      const terms = readFileSync(DENYLIST, "utf8").split("\n").map((t) => t.trim()).filter((t) => t && !t.startsWith("#"));
      for (const { label, text } of narrativeFields()) problems.push(...denylistHits(text, terms, label));
      problems.push(...denylistHits(html, terms, "resume.html"));
      const dir = resolve(ROOT, "linkedin");
      if (existsSync(dir)) for (const f of readdirSync(dir).filter((f) => f.endsWith(".txt"))) problems.push(...denylistHits(readFileSync(resolve(dir, f), "utf8"), terms, `linkedin/${f}`));
    }
  }
  if (argv.includes("--require-fresh") && profile.updated !== new Date().toISOString().slice(0, 10)) problems.push(`profile.updated is ${profile.updated}, expected today`);

  if (problems.length) {
    for (const p of problems) console.error(`CHECK_FAIL ${p}`);
    process.exit(1);
  }
  console.log("check-profile ok");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));

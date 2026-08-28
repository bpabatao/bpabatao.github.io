# profile-sync Phase 1 (repo side) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `src/data/content.ts` the single source of truth and generate the resume HTML, PDF, docx and LinkedIn paste-pack from it, ending in the one-time `profile-sync/init` PR that also fixes today's drift.

**Architecture:** A dependency-free `src/lib/format.ts` holds the period and bullet-lead helpers shared by React components and Node scripts. Scripts in `scripts/` run under Node 22's native type stripping, build a plain `ResumeModel` from `content.ts`, and render HTML (then PDF via headless Chrome), a `.model.json` that a Python-stdlib `docx.py` turns into Word, and the LinkedIn text files. `scripts/check-profile.ts` is the gate: ATS lint, denylist, token shapes, keyword coverage, LinkedIn limits, slug mapping.

**Tech Stack:** Next.js 15 static export, React 19, TypeScript 5.9 strict, Node 22.22 (`node file.ts` works natively, `node:test` + `node:assert/strict` for tests), Python 3.9 stdlib (`zipfile`, `json`, `xml.sax.saxutils`), Google Chrome headless for PDF. No new npm dependencies.

**Spec:** `docs/superpowers/specs/2026-08-28-profile-sync-design.md` (sections 3, 4.1, 7, 10, 11, 12)

## Global Constraints

- No em dashes anywhere in code, docs, commit messages or generated text; plain dash "-" only. A PostToolUse hook rejects em dashes on write.
- Commit style is the repo's: `Area: lowercase imperative summary` (e.g. `Resume: drop Staff level from headline`). No Conventional Commits prefix, no Co-Authored-By or agent trailer.
- All work happens on branch `profile-sync/init`, never on `main`. Never push to `main`; never force-push.
- Headline is exactly `Staff Software Engineer`. Employer string is exactly `ESC Partners / HometownHUB`.
- Generated resume, LinkedIn and `content.ts` narrative fields must not contain client names; the denylist file lives at `~/.profile-sync/denylist.txt` (never in the repo). `fleetPortals` is the only allowed place for tenant names.
- Resume renders A4 by default (`@page { size: A4; margin: 14mm 16mm; }`), ASCII ` | ` separators, dates `Mon YYYY - Mon YYYY` / `Mon YYYY - Present` / `YYYY - YYYY`, two pages maximum, section order Summary, Professional Experience, Earlier Experience, Technical Skills, Education.
- Scripts are Node 22 `.ts` files importing with explicit `.ts` extensions (`../src/data/content.ts`); `src/data/content.ts` has no imports; `src/lib/format.ts` uses only a top-level `import type` (fully erased by Node).
- Python scripts use the standard library only.
- Resume bullet limit 360 characters (markers stripped), site receipt limit 220, LinkedIn headline 220, About 2600, experience and project descriptions 2000, skills 50 entries.
- One sentence per line in Markdown files.

---

## File structure

| File | Responsibility |
|---|---|
| `src/lib/format.ts` (new) | `Period` formatting, `splitLead`/`plainText` for `**lead**` bullet markers, `shortMonthYear` |
| `src/data/content.ts` (modify) | Canonical profile. `Period` type, `fleetPortals` with `key`, derived tenant count, `profile.headline/summary/resumeSummary/location/availability/updated/atsKeywords`, `Job.id/period/resumeReceipts/tagline`, typed `StackGroup` with `resumeOnly` |
| `src/components/Hero.tsx`, `Contact.tsx`, `Footer.tsx`, `Work.tsx`, `StackGrid.tsx`, `diagrams.tsx`, `src/app/layout.tsx` (modify) | Read from `profile`/`fleetPortals` instead of hardcoded strings |
| `scripts/tsconfig.json` (new) | Type-checks scripts with `allowImportingTsExtensions`, `@/*` alias |
| `scripts/resume-model.ts` (new) | `buildResumeModel(page)` -> `ResumeModel` (plain data, no HTML) |
| `scripts/render-resume.ts` (new) | `renderHtml(model)`, writes `resume/resume.html` + `resume/.model.json`, prints PDF via Chrome, `--golden`, `--page`, `--no-pdf` |
| `scripts/docx.py` (new) | `resume/.model.json` -> `resume/resume.docx`; `--selftest` |
| `scripts/render-linkedin.ts` (new) | `linkedin/*.txt` from `content.ts` |
| `scripts/check-profile.ts` (new) | All gates; `--ci` skips denylist and freshness; `--require-fresh` demands `profile.updated` = today |
| `scripts/*.test.ts` (new) | `node:test` files, run directly with `node scripts/x.test.ts` |
| `package.json`, `.gitignore`, `.github/workflows/deploy.yml`, `CLAUDE.md`, `README.md` (modify) | `render`, `check`, `test` scripts; ignore generated intermediates; CI gate; SSOT rules |

---

### Task 1: Branch and `src/lib/format.ts`

**Files:**
- Create: `src/lib/format.ts`
- Test: `scripts/format.test.ts`

**Interfaces:**
- Produces: `interface Period { start: string; end: string | null }` (lives in `content.ts`, see Task 2; `format.ts` imports it as a type), `monthLabel(ym: string): string`, `formatPeriod(p: Period): string`, `splitLead(text: string): { lead: string | null; rest: string }`, `plainText(text: string): string`, `shortMonthYear(iso: string): string`.

- [ ] **Step 1: Create the working branch**

```bash
cd /Users/macbook-pro/projects/personal/bpabatao.github.io
git checkout -b profile-sync/init
git log --oneline -1
```
Expected: branch `profile-sync/init` at `69cd2ee Docs: profile-sync design spec`.

- [ ] **Step 2: Write the failing test**

Create `scripts/format.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { formatPeriod, monthLabel, plainText, shortMonthYear, splitLead } from "../src/lib/format.ts";

test("monthLabel formats YYYY-MM and passes YYYY through", () => {
  assert.equal(monthLabel("2023-06"), "Jun 2023");
  assert.equal(monthLabel("2019"), "2019");
  assert.throws(() => monthLabel("2023-13"), /bad period value/);
  assert.throws(() => monthLabel("June 2023"), /bad period value/);
});

test("formatPeriod renders Present for a null end", () => {
  assert.equal(formatPeriod({ start: "2023-06", end: null }), "Jun 2023 - Present");
  assert.equal(formatPeriod({ start: "2022-09", end: "2023-02" }), "Sep 2022 - Feb 2023");
  assert.equal(formatPeriod({ start: "2019", end: "2020" }), "2019 - 2020");
});

test("splitLead extracts a **lead** marker", () => {
  assert.deepEqual(splitLead("**Sole author of X:** the rest"), { lead: "Sole author of X:", rest: "the rest" });
  assert.deepEqual(splitLead("No lead here"), { lead: null, rest: "No lead here" });
  assert.equal(plainText("**Lead** rest"), "Lead rest");
  assert.equal(plainText("plain"), "plain");
});

test("shortMonthYear gives the Contact label form", () => {
  assert.equal(shortMonthYear("2026-08-28"), "aug 2026");
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node scripts/format.test.ts`
Expected: FAIL - `Cannot find module '.../src/lib/format.ts'`.

- [ ] **Step 4: Write the implementation**

Create `src/lib/format.ts`:

```ts
import type { Period } from "@/data/content";

/* Shared by React components and the Node scripts in scripts/.
   Keep this file free of runtime imports - Node runs it with type stripping,
   so only the top-level `import type` above is allowed (it is erased). */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(ym: string): string {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(ym);
  const month = m?.[2] ? Number(m[2]) : 0;
  if (!m || month > 12) throw new Error(`bad period value: ${ym}`);
  return month ? `${MONTHS[month - 1]} ${m[1]}` : m[1];
}

export function formatPeriod(p: Period): string {
  return `${monthLabel(p.start)} - ${p.end ? monthLabel(p.end) : "Present"}`;
}

/* Bullets may open with a bolded lead phrase written as **lead** rest. */
export function splitLead(text: string): { lead: string | null; rest: string } {
  const m = /^\*\*(.+?)\*\*\s*([\s\S]*)$/.exec(text);
  return m ? { lead: m[1], rest: m[2] } : { lead: null, rest: text };
}

export function plainText(text: string): string {
  const { lead, rest } = splitLead(text);
  return lead ? `${lead} ${rest}`.trim() : rest;
}

/* "2026-08-28" -> "aug 2026" (Contact.tsx label style) */
export function shortMonthYear(iso: string): string {
  return monthLabel(iso.slice(0, 7)).toLowerCase();
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node scripts/format.test.ts`
Expected: `# pass 4`, `# fail 0`. (The `import type` line is erased by Node, so the `@/` alias is never resolved at runtime.)

- [ ] **Step 6: Commit**

```bash
git add src/lib/format.ts scripts/format.test.ts
git commit -m "Format: shared period and bullet-lead helpers"
```

---

### Task 2: `content.ts` becomes the single source of truth

**Files:**
- Modify: `src/data/content.ts` (whole file reorganised; every block below is the final content)
- Create: `scripts/tsconfig.json`
- Test: `scripts/content.test.ts`

**Interfaces:**
- Produces (all exported from `src/data/content.ts`): `interface Period`, `fleetPortals: { key: string; tenant: string; url: string }[]`, `profile` with fields `name, role, headline, thesis, statusLine, summary, resumeSummary, location, availability, updated, atsKeywords, email, github, linkedin, siteUrl`, `metrics`, `principles`, `interface Job { id; company; tagline?; role; period: Period; location?; receipts; resumeReceipts?; stack? }`, `currentJobs`, `earlierJobs`, `credentials`, `Flagship`/`flagships`, `SecondaryProject`/`secondaryProjects`/`earlierProjects`, `interface StackGroup { title; span: 1 | 2; items: string[]; resumeOnly?: boolean }`, `stackGroups: StackGroup[]`.

- [ ] **Step 0: Gate - the LinkedIn data export must be present (LinkedIn wins on conflicts)**

Benedict exports it from LinkedIn (Settings > Data privacy > Get a copy of your data > Positions, Projects, Skills, Profile) and drops the unzipped CSVs into `~/.profile-sync/linkedin-export/`.

```bash
ls ~/.profile-sync/linkedin-export/
head -3 ~/.profile-sync/linkedin-export/Positions.csv ~/.profile-sync/linkedin-export/Projects.csv
wc -l ~/.profile-sync/linkedin-export/Skills.csv
```
Expected: `Positions.csv` (columns `Company Name,Title,Description,Location,Started On,Finished On`, dates like `May 2023`), `Projects.csv` (`Title,Description,Url,Started On,Finished On`), `Skills.csv` (`Name`, 53 rows), `Profile.csv`.
If the folder is missing, STOP and ask Benedict for the export; do not guess dates.
Use these CSVs as the source of truth for every title, date, employment type, location and project below; the values written into the code in Step 3 are what the 2026-08-28 screenshots showed and must be corrected wherever the CSV differs.

- [ ] **Step 1: Write the failing data test**

Create `scripts/content.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/content.test.ts`
Expected: FAIL - `does not provide an export named 'fleetPortals'` is fine too; any failure counts. (Today `fleetPortals` exists but `j.id`, `profile.statusLine` derivation, `Practices` do not.)

- [ ] **Step 3: Rewrite `src/data/content.ts`**

Replace the whole file with the following. Blocks marked `unchanged` are copied verbatim from the current file (lines 21-38 `principles`, 112-118 `credentials`, 120-153 `Flagship`/`flagships`, 155-159 `SecondaryProject`, 174-240 `secondaryProjects`/`earlierProjects`).

```ts
export interface Period {
  /* "YYYY-MM", or "YYYY" when the month is unknown; end null = Present */
  start: string;
  end: string | null;
}

/* Tenant portals live in production on the core API + control-plane.
   Public production URLs only - internal/test domains never ship here.
   IPU intentionally absent until it launches.
   `key` feeds the case-study diagram; tenant count everywhere derives from this list. */
export const fleetPortals: { key: string; tenant: string; url: string }[] = [
  { key: "delta", tenant: "Delta Utilities", url: "https://mydu.com" },
  { key: "mvu", tenant: "MVU", url: "https://mvumobile.com" },
  { key: "nep", tenant: "NEP", url: "https://mynationwideenergypartners.com" },
  { key: "delco", tenant: "DelCo Water", url: "https://delcowaterportal.com" },
  { key: "alexrenew", tenant: "Alex Renew", url: "https://myalexrenew.com" },
  { key: "carmel", tenant: "Carmel Utilities", url: "https://mycarmelutilities.com" },
  { key: "aruba", tenant: "Web Aruba", url: "https://webcare.webaruba.com" },
];

export const profile = {
  name: "Benedict Pabatao",
  role: "Staff Software Engineer",
  headline:
    "Staff Software Engineer, Platform & Product | Multi-tenant SaaS | AWS · Terraform · TypeScript · agentic tooling",
  thesis: { lead: "I build the platform", tail: "other engineers", accent: "ship on." },
  statusLine: `OPERATIONAL - ${fleetPortals.length} TENANTS · AWS · REMOTE (ITALY)`,
  summary:
    "I build multi-tenant SaaS platforms end to end - the Terraform that provisions them, the API they run on, and the product customers actually use. Staff Software Engineer - 8+ years in software, 5+ hands-on with AWS, and ~3 years leading cloud platforms end to end: from AWS infrastructure-as-code to the shared backend services an entire product fleet runs on.",
  resumeSummary:
    "I build multi-tenant SaaS platforms end to end - the Terraform that provisions them, the API they run on, and the product customers actually use. Staff Software Engineer - 8+ years in software, 5+ hands-on with AWS, and ~3 years leading cloud platforms end to end: from AWS infrastructure-as-code to the shared backend services an entire product fleet runs on. Near-sole author of a Terraform control-plane and internal developer platform that ships 8 multi-tenant client portals on ECS Fargate, and primary author (78%) of the core REST API those portals are built on. Operates ~$110K/year of multi-tenant portal infrastructure on AWS, turns it into self-service, and builds the products on it end to end - full-stack from React/TypeScript through Node/GraphQL - not just the infrastructure they run on.",
  location: "Italy (Remote)",
  availability: "STAFF/LEAD PLATFORM ROLES · CONSULTING · AWS / TERRAFORM / MULTI-TENANT",
  updated: "2026-08-28",
  atsKeywords: ["Staff", "REST", "Python", "Kubernetes", "Terraform", "AWS", "TypeScript", "multi-tenant", "OAuth", "CI/CD", "React", "Node", "GraphQL", "IDOR"],
  email: "jajapabatao@gmail.com",
  github: "https://github.com/bpabatao",
  linkedin: "https://linkedin.com/in/benedict-pabatao",
  siteUrl: "https://bpabatao.github.io",
} as const;

export const metrics = [
  { value: "8+", label: "years in software" },
  { value: String(fleetPortals.length), label: "tenant portals" },
  { value: "78%", label: "core API authorship" },
  { value: "$110K/yr", label: "AWS under management" },
] as const;

// principles: unchanged (copy lines 21-38 of the current file verbatim)

/* Promotion history inside one employer, newest first. */
export interface Position {
  title: string;
  period: Period;
}

export interface Job {
  id: string;
  company: string;
  /* resume-only descriptor rendered after the company name */
  tagline?: string;
  /* latest title; equals positions[0].title when positions exist */
  role: string;
  period: Period;
  location?: string;
  employmentType?: "Contract" | "Full-time" | "Freelance";
  positions?: Position[];
  /* site + LinkedIn bullets; may open with a **lead** marker */
  receipts: string[];
  /* resume-only overlay; defaults to receipts */
  resumeReceipts?: string[];
  stack?: string[];
}

export const currentJobs: Job[] = [
  {
    id: "hth",
    company: "ESC Partners / HometownHUB",
    role: "Staff Software Engineer, Platform & Product",
    period: { start: "2023-05", end: null },
    location: "New York, USA (Remote)",
    employmentType: "Contract",
    positions: [
      { title: "Staff Software Engineer, Platform & Product", period: { start: "2025-09", end: null } },
      { title: "Senior Full-Stack Engineer (Cloud)", period: { start: "2023-05", end: "2026-01" } },
    ],
    receipts: [
      "Primary author (78%) of the core API middleware connecting 8 utility tenant portals to Oracle CCS via OAuth 2.0 - the auth, data-access, and integration patterns the whole fleet is built on.",
      "Sole author of the internal developer platform: a Terraform control-plane (9 stacks, ~60 AWS resource types) with a Fastify/React dashboard that self-service provisions every client environment.",
      "De-facto technical lead of a 5-engineer team, reporting to the COO/CEO - set the platform standards the fleet adopts.",
      "Own ~$110K/yr of AWS across the production and test fleet - CI/CD, Datadog/CloudWatch observability, and FinOps tooling driving right-sizing and Fargate-Spot savings.",
      "Built the team's AI tooling: Bedrock auto-remediation that opens fix PRs, a Claude PR reviewer in CI, and an agentic AI-SDLC pipeline with human approval gates.",
      "Owned production go-live readiness for 6 client launches.",
    ],
    resumeReceipts: [
      "**Primary author (78%) of the core REST API middleware** connecting 8 utility tenant portals to Oracle CCS via OAuth 2.0 - the multi-tenant auth, data-access, and integration patterns the whole fleet is built on.",
      "**Sole author of the internal developer platform:** a Terraform control-plane (9 stacks, ~60 AWS resource types) with a Fastify/React dashboard that self-service provisions and ships every client environment - Cognito, ECS Fargate, CloudFront, WAFv2, Secrets Manager, Route 53, ElastiCache, KMS - turning tenant onboarding into a templated, repeatable workflow.",
      "**De-facto technical lead of a 5-engineer team** - most senior hands-on engineer, reporting to the COO/CEO; set the platform standards the fleet adopts (provisioning modules, CI/CD, security guardrails).",
      "**Designed and built a multi-channel campaign manager** integrating Twilio (SMS + IVR voice) and AWS SES (email) with CSV recipient lists and templated messaging, replacing manual notification workflows.",
      "**Built an automated batch pipeline** syncing multi-account customers between Oracle CCS and Invoice Cloud in 5K-record batches - idempotency checks, error tracking, and automated success/failure email reporting.",
      "**Built the team's AI-augmented developer tooling** - an AWS Bedrock auto-remediation service (Claude via bedrock-runtime) that triages alerts and opens fix PRs, an automated Claude PR-reviewer in CI, an agentic AI-SDLC pipeline (Jira + GitHub, with human approval gates), and an LLM-maintained knowledge base built with Python data pipelines.",
      "**Own and operate the multi-tenant portal infrastructure as sole platform engineer** - ~$110K/year of AWS across the 8-tenant production and test fleet - with CI/CD (Bitbucket Pipelines), Datadog / CloudWatch observability, on-call incident response, and cost-attribution tooling (Cost Explorer API) driving right-sizing, shared-ALB, and Fargate-Spot savings.",
      "**Owned production go-live readiness for 6 client launches** - primary engineer on four, core contributor on two - environment validation, deployment, rollback planning, and stabilization.",
    ],
    stack: ["TypeScript", "Fastify", "React", "Terraform", "AWS", "MongoDB", "Oracle CCS"],
  },
  {
    id: "nmblr",
    company: "Nmblr",
    tagline: "Biopharma Strategy & Collaboration Platform",
    role: "Senior Full Stack Engineer",
    period: { start: "2024-03", end: null },
    location: "London, UK (Remote)",
    employmentType: "Contract",
    receipts: [
      "One of 3 core engineers on an ISO 27001-certified biopharma strategy SaaS in private beta with enterprise pharma clients.",
      "Originated two subsystems from scratch: a DMMF-driven strategy clone engine and the Edge archive/restore isolation system.",
      "Contributed to real-time collaboration (GraphQL subscriptions), OpenAI-backed generation features, and platform security (OWASP/IDOR, JWT sessions).",
    ],
    resumeReceipts: [
      "One of 3 core engineers on an ISO 27001-certified biopharma strategy SaaS (React/TypeScript, Node/GraphQL/Prisma, AWS Elastic Beanstalk), reporting to the CEO; private beta with enterprise pharma clients.",
      "**Originated two subsystems from scratch:** a DMMF-driven strategy clone engine (automated deep-clone of entire strategies) and the Edge archive/restore isolation system.",
      "Contributed to real-time collaboration (GraphQL subscriptions), OpenAI-backed generation features, and platform security (OWASP/IDOR, JWT sessions).",
      "Added production observability - streamed Elastic Beanstalk logs to CloudWatch with enhanced health reporting - and contributed to CI/CD workflow tuning.",
    ],
    stack: ["React", "TypeScript", "Node", "GraphQL", "Prisma", "PostgreSQL", "AWS"],
  },
];

export const earlierJobs: Job[] = [
  {
    id: "codev",
    company: "CoDev",
    role: "Senior Software Engineer",
    period: { start: "2022-03", end: "2023-05" },
    location: "Utah, USA / Remote",
    employmentType: "Full-time",
    receipts: ["Internal talent-management portal; rapid, iterative issue resolution."],
    resumeReceipts: ["Built an internal talent-management portal (JavaScript, Docker); improved reliability through rapid, iterative issue resolution."],
  },
  {
    id: "ordermentum",
    company: "Ordermentum",
    role: "Full Stack Software Engineer",
    period: { start: "2022-09", end: "2023-02" },
    location: "New South Wales, Australia / Remote",
    employmentType: "Contract",
    receipts: ["Restaurant ordering and payment management for hospitality clients."],
    resumeReceipts: ["Designed and deployed a restaurant ordering and payment management system for hospitality clients (Node.js, PostgreSQL, Docker, Kubernetes)."],
  },
  {
    id: "basemap",
    company: "BaseMap Inc",
    role: "Senior Software Engineer",
    period: { start: "2022-03", end: "2022-09" },
    location: "Washington, USA / Remote",
    employmentType: "Full-time",
    receipts: ["GIS-based hunting and fishing mapping platform."],
    resumeReceipts: ["Built GIS-based hunting and fishing mapping features (JavaScript, Docker) on a consumer GPS-maps platform."],
  },
  {
    id: "hcl",
    company: "HCL Technologies",
    role: "Senior Software Engineer II",
    period: { start: "2020-02", end: "2022-03" },
    location: "New York, USA / Remote",
    employmentType: "Full-time",
    receipts: ["Product features at scale on HCL DX; automated test suites; led code reviews."],
    resumeReceipts: ["Shipped product features at scale on HCL Digital Experience (Kubernetes-based); built and maintained automated test suites (Selenium) for unit, integration, and acceptance testing; led code reviews and knowledge transfer."],
  },
  {
    id: "zencomputes",
    company: "Zencomputes",
    role: "Software Developer",
    period: { start: "2019", end: "2020" },
    location: "Singapore",
    receipts: ["Full-stack development, Singapore."],
    resumeReceipts: ["Full-stack web development for studio and commerce clients (React, Node.js)."],
  },
  {
    id: "halcyon",
    company: "Halcyon Digital",
    role: "Mobile App Developer",
    period: { start: "2018", end: "2019" },
    location: "Philippines",
    receipts: ["Mobile applications, Philippines."],
    resumeReceipts: ["Built customer and rider mobile applications (React Native)."],
  },
];

// credentials: unchanged (lines 112-118)
// Flagship + flagships: unchanged (lines 120-153)

export interface SecondaryProject {
  title: string;
  description: string;
  url?: string;
  /* LinkedIn project dates */
  period?: Period;
  /* "Associated with" employer - a Job.id */
  jobId?: string;
  /* exclude from the LinkedIn paste-pack */
  linkedin?: false;
}

/* secondaryProjects and earlierProjects keep their current entries (lines 174-240) with these changes,
   every period/jobId taken from Projects.csv (LinkedIn wins; omit `period` when the CSV has no row): */
// secondaryProjects[0] "Nmblr":              period { start: "2024-03", end: null }, jobId: "nmblr"
// secondaryProjects[4] "Tenant Go-Lives":    description: "Primary engineer on four tenant launches; core contributor on two." (client names removed)
// earlierProjects[0]  "Ordermentum":         title: "Ordermentum Wholesale Food and Beverage Online Ordering System", period { start: "2022-09", end: "2023-02" }, jobId: "ordermentum"
// earlierProjects[1]  "HCL Digital Experience": split into two entries as on LinkedIn - "HCL Digital Experience Content Composer" and "HCL Digital Experience Design Studio", both period { start: "2020-02", end: "2022-02" }, jobId: "hcl", same url
// earlierProjects[2]  "Basemap":             title: "Basemap Hunting and Fishing GPS Maps", period { start: "2022-03", end: "2022-11" }, jobId: "basemap"
// remaining entries:  jobId from the employer named in the description or in Projects.csv; add any Projects.csv row that has no site entry; list site-only projects in the PR body

export interface StackGroup {
  title: string;
  span: 1 | 2;
  items: string[];
  /* rendered in the resume only (site omits it) */
  resumeOnly?: boolean;
}

export const stackGroups: StackGroup[] = [
  {
    title: "Cloud & Infra",
    span: 2,
    items: [
      "AWS - ECS Fargate, CloudFront, Cognito, RDS, ElastiCache, KMS, Secrets Manager, WAFv2, SES, S3, Route 53, VPC, ALB, Elastic Beanstalk, Bedrock",
      "Terraform",
      "Docker · Kubernetes",
      "Linux · OpenSearch",
    ],
  },
  {
    title: "Platform & DevOps",
    span: 1,
    items: [
      "Internal Developer Platform",
      "Multi-tenant provisioning",
      "Bitbucket Pipelines · GitHub Actions",
      "FinOps - Cost Explorer",
    ],
  },
  {
    title: "AI on the Platform",
    span: 1,
    items: [
      "AWS Bedrock (Claude)",
      "AIOps auto-remediation",
      "Agentic SDLC pipelines",
      "AI code review · LLM knowledge bases",
    ],
  },
  {
    title: "Backend & Data",
    span: 2,
    items: [
      "Node.js - Fastify, Express",
      "TypeScript · Python",
      "REST APIs · GraphQL · Prisma",
      "PostgreSQL · MongoDB · Redis/BullMQ",
      "Oracle Utilities CCS · Invoice Cloud",
    ],
  },
  {
    title: "Observability & Security",
    span: 1,
    items: [
      "Datadog RUM/APM · CloudWatch · Sentry",
      "Structured logging",
      "OWASP/IDOR · JWT · WAF · Snyk",
    ],
  },
  {
    title: "Frontend",
    span: 1,
    items: ["React · Redux", "TypeScript", "Styled Components · Tailwind", "Next.js"],
  },
  {
    title: "Practices",
    span: 1,
    resumeOnly: true,
    items: ["Platform Engineering", "Infrastructure-as-Code", "System Design & Architecture", "Security & Compliance", "Incident Response"],
  },
];
```

Order of blocks in the file: `Period`, `fleetPortals`, `profile`, `metrics`, `principles`, `Job` + jobs, `credentials`, `Flagship` + `flagships`, `SecondaryProject` + projects, `StackGroup` + `stackGroups`.
Remove the old `fleetPortals` block from its former position between `flagships` and `secondaryProjects`.

- [ ] **Step 4: Create `scripts/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "skipLibCheck": true,
    "types": ["node"],
    "baseUrl": "..",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["./*.ts", "../src/data/*.ts", "../src/lib/format.ts"]
}
```

`module: esnext` + `moduleResolution: bundler` (not `nodenext`): the repo's `package.json` has no `"type": "module"`, so under `nodenext` TypeScript would treat the scripts as CommonJS and reject `import.meta`; Node itself detects the ESM syntax and runs them as ESM.
Also add `"scripts"` to the root `tsconfig.json` `exclude` array so `next build` does not type-check the scripts with its bundler rules:

```json
  "exclude": ["node_modules", "scripts"]
```

- [ ] **Step 5: Run the test and the type checks**

Run: `node scripts/content.test.ts`
Expected: `# pass 5`, `# fail 0`.

Run: `npx tsc -p scripts/tsconfig.json --noEmit`
Expected: no output (clean).

Run: `npm run build`
Expected: FAIL in `Work.tsx` (`job.period` is no longer a string) and `StackGrid.tsx` is fine. The component failures are fixed in Task 3; that is expected here.

- [ ] **Step 6: Commit**

```bash
git add src/data/content.ts scripts/tsconfig.json tsconfig.json scripts/content.test.ts
git commit -m "Content: single source of truth - Staff headline, structured periods, resume overlays"
```

---

### Task 3: Wire the components to the data

**Files:**
- Modify: `src/components/Hero.tsx:10-21`, `src/components/Contact.tsx:13-14,30`, `src/components/Footer.tsx:5`, `src/components/Work.tsx`, `src/components/StackGrid.tsx:13`, `src/components/diagrams.tsx:72,76`, `src/app/layout.tsx:12-22`

**Interfaces:**
- Consumes: `profile.statusLine/thesis/availability/updated/summary/role/name`, `fleetPortals[].key`, `formatPeriod`, `splitLead`, `shortMonthYear`, `StackGroup.resumeOnly`.

- [ ] **Step 1: Hero.tsx - status line and thesis from data**

Replace lines 10-21 (the `<p>` status line and the `<h1>`) with:

```tsx
        <p className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted">
          <span className="status-dot size-2 shrink-0 rounded-full bg-ok" aria-hidden />
          <span className="status-text">
            <span className="text-ok">{profile.statusLine.split(" - ")[0]}</span> - {profile.statusLine.split(" - ").slice(1).join(" - ")}
          </span>
        </p>

        <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[1.04] font-semibold tracking-tight text-ink sm:text-6xl md:text-7xl">
          <span className="hero-rise block">{profile.thesis.lead}</span>
          <span className="hero-rise block" style={{ animationDelay: "0.12s" }}>
            {profile.thesis.tail} <span className="text-accent">{profile.thesis.accent}</span>
          </span>
        </h1>
```

- [ ] **Step 2: Contact.tsx - availability and resume date**

Import `shortMonthYear`:

```tsx
import { profile } from "@/data/content";
import { shortMonthYear } from "@/lib/format";
```

Replace line 14 `<span>- STAFF/LEAD PLATFORM ROLES · CONSULTING · AWS / TERRAFORM / MULTI-TENANT</span>` with:

```tsx
            <span>- {profile.availability}</span>
```

Replace line 30 `resume.pdf · jul 2026 ↗` with:

```tsx
              resume.pdf · {shortMonthYear(profile.updated)} ↗
```

- [ ] **Step 3: Footer.tsx - year and name from data**

```tsx
import { profile } from "@/data/content";

export function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-2 px-6 py-6 font-mono text-xs text-muted">
        <span>© {new Date().getFullYear()} {profile.name}</span>
```
(rest of the file unchanged)

- [ ] **Step 4: Work.tsx - periods, ids, bullet leads**

Change the import block to:

```tsx
import { credentials, currentJobs, earlierJobs } from "@/data/content";
import { formatPeriod, splitLead } from "@/lib/format";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

function Bullet({ text }: { text: string }) {
  const { lead, rest } = splitLead(text);
  return lead ? (
    <span>
      <b className="font-semibold text-ink">{lead}</b> {rest}
    </span>
  ) : (
    <span>{rest}</span>
  );
}
```

In the current-jobs map: `key={job.company}` -> `key={job.id}`; `<div>{job.period}</div>` -> `<div>{formatPeriod(job.period)}</div>`; `<span>{r}</span>` -> `<Bullet text={r} />`.
Directly after `<div className="mt-0.5 font-mono text-sm text-accent">{job.company}</div>` insert the promotion history:

```tsx
                {job.positions && job.positions.length > 1 && (
                  <ul className="mt-1.5 space-y-0.5 font-mono text-[11px] text-muted">
                    {job.positions.map((p) => (
                      <li key={p.title}>
                        {p.title} · {formatPeriod(p.period)}
                      </li>
                    ))}
                  </ul>
                )}
```

In the earlier-jobs map: `key={job.company}` -> `key={job.id}`; `{job.period}` -> `{formatPeriod(job.period)}`.

- [ ] **Step 5: StackGrid.tsx - hide resume-only groups**

Line 13: `{stackGroups.map((group) => (` -> `{stackGroups.filter((group) => !group.resumeOnly).map((group) => (`

- [ ] **Step 6: diagrams.tsx - tenants from fleetPortals**

Add at the top of the file: `import { fleetPortals } from "@/data/content";`
Replace line 72 with: `const TENANTS = fleetPortals.map((t) => t.key);`
Replace the `aria-label` on line 76 with: `` aria-label={`${TENANTS.length} tenant portals connect through the core API to Oracle CCS over OAuth 2.0`} ``

- [ ] **Step 7: layout.tsx - metadata from data**

Replace lines 12-22 (`title`, `description`, `alternates`, `openGraph.title/description`) with:

```tsx
  title: {
    default: `${profile.name} - ${profile.role}`,
    template: `%s - ${profile.name}`,
  },
  description: profile.summary,
  alternates: { canonical: "/" },
  openGraph: {
    title: `${profile.name} - ${profile.role}`,
    description: `${profile.thesis.lead} ${profile.thesis.tail} ${profile.thesis.accent}`,
```
(keep `url`, `siteName`, `images`, `type`, `twitter` as they are)

- [ ] **Step 8: Build and verify the rendered strings**

Run: `npm run build`
Expected: build succeeds, static export in `out/`.

Run:
```bash
for s in "Staff Software Engineer" "Lead Platform Engineer" "7 TENANTS" "8 TENANTS" "aug 2026" "jul 2026" "Practices"; do printf '%-26s %s\n' "$s" "$(grep -c -- "$s" out/index.html)"; done
grep -c '"ipu"\|>ipu<' out/case/core-api/index.html
```
Expected: `Staff Software Engineer` >= 1, `Lead Platform Engineer` 0, `7 TENANTS` 1, `8 TENANTS` 0, `aug 2026` 1, `jul 2026` 0, `Practices` 0 (resume-only), and `0` for `ipu` on the case page.

- [ ] **Step 9: Commit**

```bash
git add src/components src/app/layout.tsx
git commit -m "Components: read status, thesis, availability, dates and tenants from data"
```

---

### Task 4: `scripts/resume-model.ts`

**Files:**
- Create: `scripts/resume-model.ts`
- Test: `scripts/resume-model.test.ts`

**Interfaces:**
- Produces:
```ts
export type Page = "a4" | "letter";
export interface Bullet { lead: string | null; rest: string }
export interface Role { title: string; company: string; location: string | null; dates: string; bullets: Bullet[] }
export interface ResumeModel {
  name: string; role: string; roleLine: string; contact: string; summary: string;
  experience: Role[]; earlier: Role[];
  skills: { title: string; items: string }[];
  education: { title: string; detail: string; dates: string }[];
  keywords: string[]; updated: string; page: Page;
}
export function buildResumeModel(page?: Page): ResumeModel
```

- [ ] **Step 1: Write the failing test**

Create `scripts/resume-model.test.ts`:

```ts
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
  assert.match(m.experience[0].dates, /^May 2023 - Present$/);
  assert.deepEqual(m.experience[0].previous, [{ title: "Senior Full-Stack Engineer (Cloud)", dates: "May 2023 - Jan 2026" }]);
  assert.equal(m.experience[0].bullets.length, 8);
  assert.equal(m.experience[0].bullets[0].lead, "Primary author (78%) of the core REST API middleware");
  assert.equal(m.experience[1].company, "Nmblr - Biopharma Strategy & Collaboration Platform");
  assert.equal(m.earlier.length, 6);
  assert.equal(m.earlier.find((r) => r.company === "Ordermentum")?.contract, true);
  assert.ok(m.skills.some((s) => s.title === "Practices"));
  assert.ok(!m.skills.some((s) => s.items.includes(" · ")), "skills items must be comma lists");
  assert.equal(m.education[0].dates, "2014 - 2018");
});

test("letter page is passed through", () => {
  assert.equal(buildResumeModel("letter").page, "letter");
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/resume-model.test.ts`
Expected: FAIL - cannot find `./resume-model.ts`.

- [ ] **Step 3: Write the implementation**

Create `scripts/resume-model.ts`:

```ts
import { credentials, currentJobs, earlierJobs, profile, stackGroups, type Job } from "../src/data/content.ts";
import { formatPeriod, splitLead } from "../src/lib/format.ts";

export type Page = "a4" | "letter";
export interface Bullet { lead: string | null; rest: string }
export interface Role {
  title: string;
  company: string;
  location: string | null;
  dates: string;
  contract: boolean;
  /* earlier titles held at the same employer, newest first */
  previous: { title: string; dates: string }[];
  bullets: Bullet[];
}
export interface ResumeModel {
  name: string;
  role: string;
  roleLine: string;
  contact: string;
  summary: string;
  experience: Role[];
  earlier: Role[];
  skills: { title: string; items: string }[];
  education: { title: string; detail: string; dates: string }[];
  keywords: string[];
  updated: string;
  page: Page;
}

/* ATS parsers are happiest with ASCII; the site keeps "·", the resume gets " | ". */
const ascii = (s: string) => s.replace(/\s*·\s*/g, " | ");
const bare = (url: string) => url.replace(/^https?:\/\//, "");

function role(job: Job): Role {
  return {
    title: job.role,
    company: job.tagline ? `${job.company} - ${job.tagline}` : job.company,
    location: job.location ?? null,
    dates: formatPeriod(job.period),
    contract: job.employmentType === "Contract",
    previous: (job.positions ?? []).slice(1).map((p) => ({ title: p.title, dates: formatPeriod(p.period) })),
    bullets: (job.resumeReceipts ?? job.receipts).map(splitLead),
  };
}

export function buildResumeModel(page: Page = "a4"): ResumeModel {
  return {
    name: profile.name,
    role: profile.role,
    roleLine: ascii(profile.headline).toUpperCase(),
    contact: [profile.location, profile.email, bare(profile.linkedin), bare(profile.github), bare(profile.siteUrl)].join(" | "),
    summary: profile.resumeSummary,
    experience: currentJobs.map(role),
    earlier: earlierJobs.map(role),
    skills: stackGroups.map((g) => ({ title: g.title, items: g.items.map((i) => i.replace(/\s*·\s*/g, ", ")).join(", ") })),
    education: credentials.map((c) => ({ title: c.title, detail: c.detail, dates: c.period })),
    keywords: [...profile.atsKeywords],
    updated: profile.updated,
    page,
  };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/resume-model.test.ts`
Expected: `# pass 2`, `# fail 0`.

- [ ] **Step 5: Commit**

```bash
git add scripts/resume-model.ts scripts/resume-model.test.ts
git commit -m "Resume: plain data model built from content.ts"
```

---

### Task 5: `scripts/render-resume.ts` - HTML, model JSON, PDF

**Files:**
- Create: `scripts/render-resume.ts`
- Modify: `.gitignore` (add `resume/.model.json`, `resume/resume-letter.*`)
- Test: `scripts/render-resume.test.ts`

**Interfaces:**
- Consumes: `buildResumeModel`, `ResumeModel`.
- Produces: `renderHtml(model: ResumeModel): string`, `pdfPageCount(buf: Buffer): number`, CLI flags `--page a4|letter`, `--no-pdf`, `--golden`. Writes `resume/resume.html`, `resume/.model.json`, `public/resume.pdf` (A4) or `resume/resume-letter.{html,pdf}` (Letter). Prints `pages: N` and `PDF_SKIPPED <reason>` when Chrome is unavailable.

- [ ] **Step 1: Write the failing test**

Create `scripts/render-resume.test.ts`:

```ts
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
  assert.ok(html.includes("<h3>Staff Software Engineer, Platform &amp; Product</h3>\n<div class=\"loc\"><span class=\"co\">ESC Partners / HometownHUB</span> - New York, USA (Remote) | <span class=\"meta\">May 2023 - Present</span></div>\n<div class=\"loc\">Previously Senior Full-Stack Engineer (Cloud) | <span class=\"meta\">May 2023 - Jan 2026</span></div>"));
  assert.ok(html.includes("<h3>Senior Software Engineer II - HCL Technologies (New York, USA / Remote)</h3>\n<div class=\"loc\"><span class=\"meta\">Feb 2020 - Mar 2022</span></div>"));
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/render-resume.test.ts`
Expected: FAIL - cannot find `./render-resume.ts`.

- [ ] **Step 3: Write the implementation**

Create `scripts/render-resume.ts`:

```ts
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { buildResumeModel, type Bullet, type Page, type ResumeModel, type Role } from "./resume-model.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const li = (b: Bullet) => (b.lead ? `  <li><b>${esc(b.lead)}</b> ${esc(b.rest)}</li>` : `  <li>${esc(b.rest)}</li>`);

function currentRole(r: Role): string {
  const loc = r.location ? ` - ${esc(r.location)}` : "";
  return [
    `<h3>${esc(r.title)}</h3>`,
    `<div class="loc"><span class="co">${esc(r.company)}</span>${loc} | <span class="meta">${r.dates}</span></div>`,
    ...r.previous.map((p) => `<div class="loc">Previously ${esc(p.title)} | <span class="meta">${p.dates}</span></div>`),
    "<ul>",
    ...r.bullets.map(li),
    "</ul>",
  ].join("\n");
}

function earlierRole(r: Role): string {
  const parts = [r.location, r.contract ? "contract" : null].filter(Boolean) as string[];
  const loc = parts.length ? ` (${esc(parts.join(", "))})` : "";
  return [
    `<h3>${esc(r.title)} - ${esc(r.company)}${loc}</h3>`,
    `<div class="loc"><span class="meta">${r.dates}</span></div>`,
    `<ul>${r.bullets.map((b) => li(b).trim()).join("")}</ul>`,
  ].join("\n");
}

/* The template is the July 2026 ATS-safe resume verbatim: single column, linear flow,
   real headings, no text boxes, system fonts. Only data changes here. */
export function renderHtml(m: ResumeModel): string {
  const size = m.page === "letter" ? "Letter" : "A4";
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="author" content="${esc(m.name)}">
<title>${esc(m.name)} - ${esc(m.role)}</title>
<style>
  /* ATS-safe: single column, linear flow, real words in headings, no text-boxes.
     Styling via CSS only - text layer stays clean. */
  @page { size: ${size}; margin: 14mm 16mm; }
  * { margin: 0; box-sizing: border-box; }
  body {
    font-family: "Helvetica Neue", Arial, sans-serif;
    font-size: 9.6pt;
    line-height: 1.45;
    color: #1a1c1f;
    max-width: 178mm;
  }
  h1 { font-size: 20pt; letter-spacing: -0.01em; color: #111; }
  .role-line { font-size: 9.5pt; font-weight: 600; color: #c44400; margin-top: 2pt; }
  .contact { font-size: 9pt; color: #444; margin-top: 4pt; font-family: "SF Mono", Menlo, Consolas, monospace; }
  h2 {
    font-size: 10pt;
    text-transform: uppercase;
    color: #c44400;
    border-bottom: 1.2pt solid #2a2d31;
    padding-bottom: 2pt;
    margin: 12pt 0 6pt;
  }
  h3 { font-size: 10.5pt; margin-top: 8pt; }
  .co { color: #c44400; font-weight: 600; }
  .meta { font-size: 8.5pt; color: #555; font-family: "SF Mono", Menlo, Consolas, monospace; font-weight: 400; }
  .loc { font-size: 8.8pt; color: #555; margin-bottom: 3pt; }
  ul { padding-left: 12pt; margin: 3pt 0 6pt; }
  li { margin: 2.2pt 0; }
  li b, p b { color: #111; }
  .skills p { margin: 2.5pt 0; }
  .skills b { text-transform: uppercase; font-size: 8.4pt; letter-spacing: 0.02em; }
  a { color: inherit; text-decoration: none; }
</style>
</head>
<body>

<h1>${esc(m.name)}</h1>
<div class="role-line">${esc(m.roleLine)}</div>
<div class="contact">${esc(m.contact)}</div>

<h2>Summary</h2>
<p>${esc(m.summary)}</p>

<h2>Professional Experience</h2>

${m.experience.map(currentRole).join("\n\n")}

<h2>Earlier Experience</h2>

${m.earlier.map(earlierRole).join("\n\n")}

<h2>Technical Skills</h2>
<div class="skills">
${m.skills.map((s) => `  <p><b>${esc(s.title)}:</b> ${esc(s.items)}</p>`).join("\n")}
</div>

<h2>Education</h2>
${m.education.map((e) => `<h3>${esc(e.title)}</h3>\n<div class="loc">${esc(e.detail)} | <span class="meta">${e.dates}</span></div>`).join("\n")}

</body>
</html>
`;
}

export function pdfPageCount(buf: Buffer): number {
  return (buf.toString("latin1").match(/\/Type\s*\/Page(?!s)/g) ?? []).length;
}

function printPdf(htmlPath: string, pdfPath: string): void {
  if (!existsSync(CHROME)) {
    console.log(`PDF_SKIPPED chrome not found at ${CHROME}`);
    return;
  }
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], { stdio: "ignore" });
  console.log(`pages: ${pdfPageCount(readFileSync(pdfPath))}`);
}

function main(argv: string[]): void {
  const page: Page = argv.includes("--page") && argv[argv.indexOf("--page") + 1] === "letter" ? "letter" : "a4";
  const model = buildResumeModel(page);
  const html = renderHtml(model);
  const htmlPath = resolve(ROOT, page === "a4" ? "resume/resume.html" : "resume/resume-letter.html");
  const pdfPath = resolve(ROOT, page === "a4" ? "public/resume.pdf" : "resume/resume-letter.pdf");

  if (argv.includes("--golden")) {
    const current = existsSync(htmlPath) ? readFileSync(htmlPath, "utf8") : "";
    if (current !== html) {
      console.error(`GOLDEN_MISMATCH ${htmlPath} differs from the render of content.ts - run npm run render`);
      process.exit(1);
    }
    console.log("golden ok");
    return;
  }

  mkdirSync(dirname(htmlPath), { recursive: true });
  writeFileSync(htmlPath, html);
  writeFileSync(resolve(ROOT, "resume/.model.json"), JSON.stringify(model, null, 2));
  console.log(`wrote ${htmlPath}`);
  if (!argv.includes("--no-pdf")) printPdf(htmlPath, pdfPath);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/render-resume.test.ts`
Expected: `# pass 4`, `# fail 0`.

- [ ] **Step 5: Ignore the intermediates and render for real**

Append to `.gitignore`:

```
# profile-sync intermediates
resume/.model.json
resume/resume-letter.*
```

Run: `node scripts/render-resume.ts`
Expected: `wrote .../resume/resume.html`, then `pages: 2`. `public/resume.pdf` is regenerated.

Run: `git diff --stat resume/resume.html && node scripts/render-resume.ts --golden`
Expected: the diff touches the headline, summary, tenant-list wording, separators, Nmblr role dates and skills lines only (review it; that is the reconciliation diff the spec asks for in section 12.8). `golden ok`.

- [ ] **Step 6: Commit**

```bash
git add scripts/render-resume.ts scripts/render-resume.test.ts .gitignore resume/resume.html public/resume.pdf
git commit -m "Resume: render HTML and PDF from content.ts"
```

---

### Task 6: `scripts/docx.py`

**Files:**
- Create: `scripts/docx.py`

**Interfaces:**
- Consumes: `resume/.model.json` (the `ResumeModel` shape from Task 4).
- Produces: `resume/resume.docx`; CLI `python3 scripts/docx.py [--in resume/.model.json] [--out resume/resume.docx] [--selftest]`.

- [ ] **Step 1: Write the implementation with its self-test**

Create `scripts/docx.py`:

```python
#!/usr/bin/env python3
"""content.ts -> resume.docx, via the JSON model render-resume.ts writes.

Stdlib only. Real Heading styles and a real bullet numbering definition so ATS
parsers see structure, not just bold runs (textutil -convert docx flattens both,
which is why this exists). Page size follows model.page: a4 | letter.
"""
import json, os, sys, tempfile, zipfile
from xml.sax.saxutils import escape

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"'
PAGE = {"a4": (11906, 16838), "letter": (12240, 15840)}   # twips
MARGIN_TB, MARGIN_LR = 794, 907                            # 14mm, 16mm


def run(text, bold=False):
    b = "<w:rPr><w:b/></w:rPr>" if bold else ""
    return f'<w:r>{b}<w:t xml:space="preserve">{escape(text)}</w:t></w:r>'


def para(runs, style=None, bullet=False):
    ppr = ""
    if style:
        ppr += f'<w:pStyle w:val="{style}"/>'
    if bullet:
        ppr += '<w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>'
    ppr = f"<w:pPr>{ppr}</w:pPr>" if ppr else ""
    return f"<w:p>{ppr}{''.join(runs)}</w:p>"


def bullet(b):
    runs = [run(b["lead"] + " ", bold=True)] if b.get("lead") else []
    runs.append(run(b["rest"]))
    return para(runs, style="ListParagraph", bullet=True)


def body(m):
    p = [para([run(m["name"])], "Heading1"), para([run(m["roleLine"], bold=True)]), para([run(m["contact"])])]
    p += [para([run("Summary")], "Heading2"), para([run(m["summary"])])]
    p.append(para([run("Professional Experience")], "Heading2"))
    for r in m["experience"]:
        p.append(para([run(r["title"])], "Heading3"))
        loc = f" - {r['location']}" if r.get("location") else ""
        p.append(para([run(r["company"], bold=True), run(f"{loc} | {r['dates']}")]))
        p += [bullet(b) for b in r["bullets"]]
    p.append(para([run("Earlier Experience")], "Heading2"))
    for r in m["earlier"]:
        loc = f" ({r['location']})" if r.get("location") else ""
        p.append(para([run(f"{r['title']} - {r['company']}{loc}")], "Heading3"))
        p.append(para([run(r["dates"])]))
        p += [bullet(b) for b in r["bullets"]]
    p.append(para([run("Technical Skills")], "Heading2"))
    for s in m["skills"]:
        p.append(para([run(s["title"] + ": ", bold=True), run(s["items"])]))
    p.append(para([run("Education")], "Heading2"))
    for e in m["education"]:
        p.append(para([run(e["title"])], "Heading3"))
        p.append(para([run(f"{e['detail']} | {e['dates']}")]))
    w, h = PAGE[m.get("page", "a4")]
    sect = (f'<w:sectPr><w:pgSz w:w="{w}" w:h="{h}"/>'
            f'<w:pgMar w:top="{MARGIN_TB}" w:right="{MARGIN_LR}" w:bottom="{MARGIN_TB}" w:left="{MARGIN_LR}" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr>')
    return f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document {W}><w:body>{"".join(p)}{sect}</w:body></w:document>'


STYLES = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles {W}>
<w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="19"/></w:rPr></w:rPrDefault>
<w:pPrDefault><w:pPr><w:spacing w:after="40" w:line="276" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults>
<w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
<w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:sz w:val="40"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="200" w:after="60"/><w:pBdr><w:bottom w:val="single" w:sz="8" w:space="1" w:color="2A2D31"/></w:pBdr><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:caps/><w:color w:val="C44400"/><w:sz w:val="20"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:before="120" w:after="20"/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:sz w:val="21"/></w:rPr></w:style>
<w:style w:type="paragraph" w:styleId="ListParagraph"><w:name w:val="List Paragraph"/><w:basedOn w:val="Normal"/><w:pPr><w:ind w:left="360"/></w:pPr></w:style>
</w:styles>'''

NUMBERING = f'''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:numbering {W}>
<w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/>
<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/><w:lvlJc w:val="left"/><w:pPr><w:ind w:left="360" w:hanging="200"/></w:pPr></w:lvl>
</w:abstractNum>
<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
</w:numbering>'''

CONTENT_TYPES = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
<Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>
</Types>'''

RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>'''

DOC_RELS = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>
</Relationships>'''


def write_docx(model, out_path):
    with zipfile.ZipFile(out_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", CONTENT_TYPES)
        z.writestr("_rels/.rels", RELS)
        z.writestr("word/_rels/document.xml.rels", DOC_RELS)
        z.writestr("word/styles.xml", STYLES)
        z.writestr("word/numbering.xml", NUMBERING)
        z.writestr("word/document.xml", body(model))


def _selftest():
    model = {
        "name": "Test Person", "role": "Engineer", "roleLine": "ENGINEER | AWS", "contact": "a | b",
        "summary": "Sum & more", "page": "letter",
        "experience": [{"title": "T", "company": "C", "location": "L", "dates": "Jan 2020 - Present",
                        "bullets": [{"lead": "Did X:", "rest": "then Y"}, {"lead": None, "rest": "plain"}]}],
        "earlier": [{"title": "T2", "company": "C2", "location": None, "dates": "2019 - 2020", "bullets": [{"lead": None, "rest": "old"}]}],
        "skills": [{"title": "Cloud", "items": "AWS, Terraform"}],
        "education": [{"title": "BS", "detail": "Uni", "dates": "2014 - 2018"}],
    }
    with tempfile.TemporaryDirectory() as d:
        out = os.path.join(d, "t.docx")
        write_docx(model, out)
        with zipfile.ZipFile(out) as z:
            doc = z.read("word/document.xml").decode()
            names = set(z.namelist())
    assert {"word/document.xml", "word/styles.xml", "word/numbering.xml", "[Content_Types].xml"} <= names
    assert doc.count('w:val="Heading2"') == 5, doc.count('w:val="Heading2"')
    assert doc.count("<w:numPr>") == 3
    assert "<w:tbl" not in doc
    assert "Sum &amp; more" in doc
    assert 'w:w="12240" w:h="15840"' in doc
    print("docx selftest ok")


if __name__ == "__main__":
    if "--selftest" in sys.argv:
        _selftest()
        sys.exit(0)
    args = sys.argv[1:]
    src = args[args.index("--in") + 1] if "--in" in args else os.path.join(ROOT, "resume", ".model.json")
    dst = args[args.index("--out") + 1] if "--out" in args else os.path.join(ROOT, "resume", "resume.docx")
    with open(src) as f:
        write_docx(json.load(f), dst)
    print(f"wrote {dst}")
```

- [ ] **Step 2: Run the self-test**

Run: `python3 scripts/docx.py --selftest`
Expected: `docx selftest ok`.

- [ ] **Step 3: Generate the real docx and open it once**

Run: `python3 scripts/docx.py && open resume/resume.docx`
Expected: `wrote .../resume/resume.docx`; Word or Pages opens a two-page document with orange section headings, bold lead phrases and real bullets. Close it without saving.

- [ ] **Step 4: Commit**

```bash
git add scripts/docx.py resume/resume.docx
git commit -m "Resume: generate docx with real headings and list numbering"
```

---

### Task 7: `scripts/render-linkedin.ts`

**Files:**
- Create: `scripts/render-linkedin.ts`
- Test: `scripts/render-linkedin.test.ts`

**Interfaces:**
- Consumes: `profile`, `currentJobs`, `flagships`, `stackGroups`, `formatPeriod`, `plainText`.
- Produces: `buildLinkedinPack(): Record<string, string>` (filename -> file content, header line included) and the `LIMITS` map; writes `linkedin/*.txt`.

- [ ] **Step 1: Write the failing test**

Create `scripts/render-linkedin.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/render-linkedin.test.ts`
Expected: FAIL - cannot find `./render-linkedin.ts`.

- [ ] **Step 3: Write the implementation**

Create `scripts/render-linkedin.ts`:

```ts
import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { currentJobs, earlierJobs, earlierProjects, flagships, profile, secondaryProjects, stackGroups, type Job, type SecondaryProject } from "../src/data/content.ts";
import { formatPeriod, plainText } from "../src/lib/format.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const LIMITS = { headline: 220, about: 2600, description: 2000, skills: 100 } as const;

const header = (section: string) => `# updated ${profile.updated} - paste into LinkedIn > ${section}\n`;
export const bodyOf = (file: string) => file.split("\n").slice(1).join("\n").trim();
export const slugOf = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const allJobs = () => [...currentJobs, ...earlierJobs];

function about(): string {
  const now = currentJobs.map((j) => `${j.role}, ${j.company}: ${plainText(j.receipts[0])}`);
  return `${profile.summary}\n\nCurrently:\n${now.map((l) => `- ${l}`).join("\n")}`;
}

/* One block per LinkedIn position; bullets belong to the latest position only. */
function experience(j: Job): string {
  const positions = j.positions?.length ? j.positions : [{ title: j.role, period: j.period }];
  return positions
    .map((p, i) => {
      const head = [`## ${p.title}`, j.employmentType ? `${j.company} · ${j.employmentType}` : j.company, formatPeriod(p.period), j.location ?? ""].filter(Boolean);
      return i === 0 ? [...head, "", ...j.receipts.map((r) => `- ${plainText(r)}`)].join("\n") : head.join("\n");
    })
    .join("\n\n");
}

function project(p: SecondaryProject): string {
  const job = allJobs().find((j) => j.id === p.jobId);
  return [p.title, p.period ? formatPeriod(p.period) : "", job ? `Associated with: ${job.company}` : "", "", p.description, p.url ?? ""].filter((l, i) => l || i === 3).join("\n");
}

function skills(): string {
  const seen = new Set<string>();
  for (const g of stackGroups) for (const item of g.items) for (const s of item.split(/\s*(?:·|,|\s-\s)\s*/)) if (s && !seen.has(s)) seen.add(s);
  return [...seen].slice(0, LIMITS.skills).join("\n");
}

export function buildLinkedinPack(): Record<string, string> {
  const pack: Record<string, string> = {
    "headline.txt": header("Intro > Headline") + profile.headline + "\n",
    "about.txt": header("About") + about() + "\n",
    "skills.txt": header("Skills (one per line)") + skills() + "\n",
  };
  for (const j of allJobs()) pack[`experience-${j.id}.txt`] = header(`Experience > ${j.company} (one block per position)`) + experience(j) + "\n";
  for (const f of flagships) {
    pack[`projects-${f.slug}.txt`] = header(`Projects > ${f.title}`) + [f.title, f.outcome, `Ownership: ${f.ownership}`, `Stack: ${f.stack.join(", ")}`, `${profile.siteUrl}/case/${f.slug}/`].join("\n") + "\n";
  }
  for (const p of [...secondaryProjects, ...earlierProjects]) {
    if (p.linkedin === false) continue;
    pack[`projects-${slugOf(p.title)}.txt`] = header(`Projects > ${p.title}`) + project(p) + "\n";
  }
  for (const [name, text] of Object.entries(pack)) {
    const body = bodyOf(text);
    const limit = name === "headline.txt" ? LIMITS.headline : name === "about.txt" ? LIMITS.about : name === "skills.txt" ? Infinity : LIMITS.description;
    if (body.length > limit) throw new Error(`${name} exceeds ${limit} characters (${body.length})`);
  }
  return pack;
}

function main(): void {
  const dir = resolve(ROOT, "linkedin");
  mkdirSync(dir, { recursive: true });
  for (const f of readdirSync(dir)) if (f.endsWith(".txt")) rmSync(resolve(dir, f));
  const pack = buildLinkedinPack();
  for (const [name, text] of Object.entries(pack)) writeFileSync(resolve(dir, name), text);
  console.log(`wrote ${Object.keys(pack).length} files to linkedin/`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node scripts/render-linkedin.test.ts`
Expected: `# pass 2`, `# fail 0`.

- [ ] **Step 5: Generate the pack and commit**

Run: `node scripts/render-linkedin.ts && ls linkedin | wc -l && head -3 linkedin/about.txt`
Expected: `wrote N files to linkedin/` where N = 3 + 8 experience files + 3 flagship + every secondary/earlier project (about 28); the About file starts with the `# updated 2026-08-28 - paste into LinkedIn > About` header.

```bash
git add scripts/render-linkedin.ts scripts/render-linkedin.test.ts linkedin
git commit -m "LinkedIn: paste-pack rendered from content.ts"
```

---

### Task 8: `scripts/check-profile.ts` - the gate

**Files:**
- Create: `scripts/check-profile.ts`
- Create: `~/.profile-sync/denylist.txt` (outside the repo)
- Test: `scripts/check-profile.test.ts`

**Interfaces:**
- Consumes: `renderHtml`, `buildResumeModel`, `pdfPageCount`, `LIMITS`, `bodyOf`, `content.ts` exports, `cases`.
- Produces: `lintResumeHtml(html): string[]`, `dateProblems(html): string[]`, `bulletProblems(html, max?): string[]`, `keywordGaps(text, keywords): string[]`, `denylistHits(text, terms, label): string[]`, `tokenHits(text, label): string[]`, `linkedinProblems(dir): string[]`, `slugProblems(): string[]`, `narrativeFields(): { label: string; text: string }[]`. CLI: `node scripts/check-profile.ts [--ci] [--require-fresh]`; exit 1 on any problem.

- [ ] **Step 1: Write the failing test**

Create `scripts/check-profile.test.ts`:

```ts
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
  assert.ok(dateProblems(good.replace("Jun 2023 - Present", "June 2023 - now")).length > 0);
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
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node scripts/check-profile.test.ts`
Expected: FAIL - cannot find `./check-profile.ts`.

- [ ] **Step 3: Write the implementation**

Create `scripts/check-profile.ts`:

```ts
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { currentJobs, earlierJobs, earlierProjects, flagships, profile, secondaryProjects } from "../src/data/content.ts";
import { cases } from "../src/data/cases.ts";
import { plainText } from "../src/lib/format.ts";
import { LIMITS, bodyOf } from "./render-linkedin.ts";
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

  for (const { label, text } of narrativeFields()) problems.push(...tokenHits(text, label));
  problems.push(...tokenHits(html, "resume.html"));

  if (!ci) {
    if (!existsSync(DENYLIST)) problems.push(`denylist missing at ${DENYLIST} (created by profile-sync --init)`);
    else {
      const terms = readFileSync(DENYLIST, "utf8").split("\n").map((t) => t.trim()).filter((t) => t && !t.startsWith("#"));
      for (const { label, text } of narrativeFields()) problems.push(...denylistHits(text, terms, label));
      problems.push(...denylistHits(html, terms, "resume.html"));
      const dir = resolve(ROOT, "linkedin");
      if (existsSync(dir)) for (const f of readdirSync(dir)) problems.push(...denylistHits(readFileSync(resolve(dir, f), "utf8"), terms, `linkedin/${f}`));
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
```

- [ ] **Step 4: Create the denylist outside the repo**

```bash
mkdir -p ~/.profile-sync && cat > ~/.profile-sync/denylist.txt <<'EOF'
# profile-sync client denylist - never commit; one term per line, matched case-insensitively as a whole word
Delta Utilities
IPU
MVU
Moreno Valley
NEP
Nationwide Energy
DelCo
Del-Co
Alex Renew
AlexRenew
Alexandria Renew
Carmel
Aruba
Cary
Tempe
WTG
Vertosoft
EOF
```
Note: `Delta` alone is not listed because the resume never uses it bare and "delta" is a common word; `Delta Utilities` is.

- [ ] **Step 5: Run the tests and the real gate**

Run: `node scripts/check-profile.test.ts`
Expected: `# pass 3`, `# fail 0`.

Run: `node scripts/check-profile.ts`
Expected: `check-profile ok`. If it reports `denylist` hits, the offending field names a client - fix the text in `content.ts`, re-run `node scripts/render-resume.ts && node scripts/render-linkedin.ts`, and re-check. If it reports `resume is missing ATS keyword`, add the keyword to a bullet or skills item (not to `atsKeywords`).

- [ ] **Step 6: Commit**

```bash
git add scripts/check-profile.ts scripts/check-profile.test.ts
git commit -m "Check: ATS lint, denylist, token shapes, keyword coverage, LinkedIn limits"
```

---

### Task 9: npm scripts, CI gate, repo CLAUDE.md, README

**Files:**
- Modify: `package.json:5-9`, `.github/workflows/deploy.yml:27`, `README.md:5,21`
- Create: `CLAUDE.md`

- [ ] **Step 1: package.json scripts**

Replace the `scripts` block with:

```json
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "npx serve out",
    "render": "node scripts/render-resume.ts && python3 scripts/docx.py && node scripts/render-linkedin.ts",
    "check": "tsc -p scripts/tsconfig.json --noEmit && node scripts/check-profile.ts",
    "test": "node scripts/format.test.ts && node scripts/content.test.ts && node scripts/resume-model.test.ts && node scripts/render-resume.test.ts && node scripts/render-linkedin.test.ts && node scripts/check-profile.test.ts && python3 scripts/docx.py --selftest"
  },
```

Run: `npm test && npm run check && npm run render && npm run check`
Expected: every test file reports `# fail 0`, `docx selftest ok`, `check-profile ok` twice, render prints `pages: 2` and `wrote 8 files`.

- [ ] **Step 2: CI gate in deploy.yml**

Insert after `- run: npm ci` (line 27):

```yaml
      - run: npm run check -- --ci
```

- [ ] **Step 3: Repo CLAUDE.md**

Create `CLAUDE.md`:

```markdown
# bpabatao.github.io

Personal portfolio and resume.
`src/data/content.ts` is the single source of truth for every profile fact.

- Never hand-edit `resume/resume.html`, `resume/resume.docx`, `public/resume.pdf` or `linkedin/*.txt`; they are generated.
- After changing `content.ts`: `npm run render && npm run check && npm run build`.
- `npm test` runs the script tests; `npm run check -- --ci` is what CI runs.
- Profile updates from work evidence arrive as `profile-sync/*` pull requests from the global `/profile-sync` skill; merge them, never push profile changes straight to `main`.
- Client and tenant names never appear in generated text; `fleetPortals` is the only place tenant names are allowed.
- Commit style: `Area: lowercase imperative summary`. Plain dash "-", never an em dash.
```

- [ ] **Step 4: README fixes**

Line 5: replace `Next.js 15 (static export) + React 19 + Tailwind CSS v4 + Motion, deployed to GitHub Pages via Actions.` with `Next.js 15 (static export) + React 19 + Tailwind CSS v4, CSS-only motion, deployed to GitHub Pages via Actions.`
Line 3: replace `Lead Platform Engineer` with `Staff Software Engineer`.
After line 21 (`Content lives in ...`) add:

```
Resume (`resume/`, `public/resume.pdf`) and the LinkedIn paste-pack (`linkedin/`) are generated from it: `npm run render && npm run check`.
```

- [ ] **Step 5: Commit**

```bash
git add package.json .github/workflows/deploy.yml CLAUDE.md README.md
git commit -m "Tooling: render, check and test scripts; CI gate; SSOT rules"
```

---

### Task 10: Open the `profile-sync/init` PR

**Files:**
- None new; pushes the branch and opens the PR.

- [ ] **Step 1: Final verification on the branch**

```bash
npm test && npm run render && npm run check && npm run build && git status --short
```
Expected: all green; `git status --short` is empty (render is idempotent; if `resume/resume.html` or `linkedin/` changed, commit them with `Resume: re-render` and re-run).

- [ ] **Step 2: Review the reconciliation diff once more**

```bash
git diff main..profile-sync/init --stat
git diff main..profile-sync/init -- resume/resume.html | head -120
```
Expected changes in `resume.html`: `<title>` and role line (Staff), summary paragraph, HtH bullet 1 and bullet 8 (no tenant names), ` | ` separators, Nmblr fourth bullet unchanged, skills lines rebuilt from `stackGroups`, `<meta name="author">`. Nothing else structural.

- [ ] **Step 3: Push and open the PR**

```bash
git push -u origin profile-sync/init
gh pr create --base main --head profile-sync/init --title "Profile sync: single source of truth, Staff headline, generated resume and LinkedIn pack" --body-file - <<'EOF'
## What

- `src/data/content.ts` is now the single source of truth; resume HTML/PDF/docx and `linkedin/*.txt` are rendered from it (`npm run render`).
- Headline is Staff Software Engineer everywhere; employer string is "ESC Partners / HometownHUB"; summary rebuilt from the LinkedIn About lead plus the resume metrics sentence.
- LinkedIn wins on conflicts: HtH starts May 2023 with the promotion to Staff (Sep 2025) recorded as positions; BaseMap Inc is its own earlier role; Ordermentum is "Full Stack Software Engineer"; Nmblr is Contract, London (Remote). Projects carry LinkedIn dates and employer association; site-only projects: <list>.
- Resume tenant lists anonymised ("8 utility tenant portals", "primary engineer on four, core contributor on two"); `fleetPortals` unchanged.
- Tenant count derives from `fleetPortals` (7); hero status line, metrics and the core-API diagram follow it (stale `ipu` removed).
- Resume-only skills merged into `stackGroups` (Kubernetes, OpenSearch, Python, REST APIs, S3, VPC, ALB, Elastic Beanstalk) plus a resume-only Practices row.
- Hardcoded strings in Hero, Contact, Footer, layout and diagrams now read from data.
- New: `resume/resume.docx`, `linkedin/` paste-pack (8 files), `scripts/check-profile.ts` gate (also in CI as `npm run check -- --ci`), repo `CLAUDE.md`.
- Includes the design spec commit (`docs/superpowers/specs/2026-08-28-profile-sync-design.md`).

## Verification

- `npm test`: 6 test files + docx selftest green.
- `npm run check`: ATS lint, dates, bullet lengths, keyword coverage, LinkedIn limits, slug map, denylist, token shapes - ok.
- `npm run build`: static export ok; `out/index.html` shows "Staff Software Engineer", "7 TENANTS", "aug 2026".
- `public/resume.pdf`: 2 pages, printed by headless Chrome from the rendered HTML.

## Not in this PR

- The evidence harvester and the `/profile-sync` skill (phase 2).
- The full-history backfill (runs after phase 2 lands).

## Paste checklist (LinkedIn)

- [ ] headline.txt -> Intro > Headline
- [ ] about.txt -> About
- [ ] experience-*.txt -> Experience (one block per position; 8 employers)
- [ ] skills.txt -> Skills
- [ ] projects-*.txt -> Projects (3 case studies + every site project)
EOF
```
Expected: PR URL printed. Do not merge; Benedict reviews and merges.

- [ ] **Step 4: Record where things stand**

Print for the session summary: the PR URL, the reconciliation diff summary, and that phase 2 (`docs/superpowers/plans/2026-08-28-profile-sync-phase2-skill.md`) starts after this PR merges.

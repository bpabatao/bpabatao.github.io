# Recruiter Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorder the home page around proof, put availability in the hero, collapse early work, generate the share cards from `content.ts`, give case pages their own metadata, fix the accessibility/font/print gaps, add cookie-free analytics - all without changing anything the `/profile-sync` skill writes.

**Architecture:** Presentation-only changes to the Next.js 15 static export. `content.ts` gains two additive fields. A new `scripts/render-og.ts` joins `npm run render` and screenshots HTML cards with the installed Chrome (same path as the resume PDF); `check-profile.ts` gains an og-freshness check that also runs in CI. GoatCounter is a single env-gated script tag.

**Tech Stack:** Next.js 15, React 19, Tailwind v4, TypeScript 5.9 strict, Node 22 native `.ts`, Google Chrome headless, fonttools + brotli (installed) for the woff2 conversion, GoatCounter.

**Spec:** `docs/superpowers/specs/2026-08-29-recruiter-redesign-design.md`

## Global Constraints

- No em dashes anywhere; plain dash "-". A PostToolUse hook rejects em dashes on write.
- Commit style `Area: lowercase imperative summary`; no Co-Authored-By or trailers. All work on branch `site/recruiter-redesign`; never push to `main`; never force-push.
- `src/data/content.ts` stays the single source of truth; the fields the profile-sync skill writes (`receipts`, `resumeReceipts`, `stackGroups` items, `profile.updated`) keep their shape. After every content change: `npm run render && npm run check && npm run build`.
- Section order on the home page: Hero, Selected work, Experience, Operating principles, Capabilities, Contact.
- Hero availability line text exactly: `Open to Staff / Lead platform roles · Remote from Italy (CET), async-first · US and EU teams`.
- Share cards are 1200x630 PNG rendered by `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome --headless=new --window-size=1200,630 --screenshot`; `OG_SKIPPED` printed (not thrown) when Chrome is missing.
- GoatCounter script only when `NEXT_PUBLIC_GOATCOUNTER_CODE` is set at build time; click events named `resume`, `email`, `linkedin`, `case-<slug>`.
- Lighthouse floor on the built `out/`: mobile >= 97, desktop 100, accessibility 100, no `label-content-name-mismatch`.
- Generated files (`public/og.png`, `public/og/*.png`, `public/favicon.ico`, `resume/og-source.json`) are only ever produced by the scripts; never hand-edited.
- One sentence per line in Markdown files.

---

## File structure

| File | Responsibility |
|---|---|
| `src/data/content.ts` (modify) | `profile.availabilityLine`, `profile.markets`; stack de-duplication |
| `src/data/cases.ts` (modify) | one sentence |
| `src/app/page.tsx` (modify) | section order |
| `src/components/Header.tsx`, `MobileMenu.tsx` (modify) | nav order/labels |
| `src/components/Hero.tsx` (modify) | availability line, two buttons, click attributes, new-tab hints |
| `src/components/Projects.tsx` (modify) | collapsed lists, click attributes, new-tab hints |
| `src/components/Contact.tsx`, `Footer.tsx`, `Work.tsx`, `StackGrid.tsx`, `Approach.tsx` (modify) | click attributes, new-tab hints, `aria-labelledby` |
| `src/components/SectionHeading.tsx` (modify) | `id` on the h2 |
| `src/components/ThemeToggle.tsx` (modify) | accessible name |
| `src/components/diagrams.tsx` (modify) | derived tenant wording |
| `src/lib/fonts.ts`, `src/fonts/` (modify) | Satoshi woff2 |
| `scripts/render-og.ts` (new) + `scripts/render-og.test.ts` | card inputs, card HTML, PNG size parser, Chrome screenshot, favicon |
| `scripts/check-profile.ts` (modify) | og freshness |
| `scripts/site.test.ts` (new) | assertions on the built `out/` (order, metadata, analytics, a11y strings) |
| `src/app/case/[slug]/page.tsx` (modify) | full per-page metadata |
| `src/app/layout.tsx` (modify) | GoatCounter script, beforeprint hook |
| `src/app/globals.css` (modify) | print stylesheet |
| `package.json`, `.github/workflows/deploy.yml`, `CLAUDE.md`, `.gitignore` (modify) | scripts, CI env var, rules |
| `public/og.png`, `public/og/*.png`, `public/favicon.ico`, `resume/og-source.json` (generated, tracked) | share cards and their inputs |

One deviation from the spec, made here: `og-source.json` is **tracked** (not gitignored) so the CI `--ci` check can compare it; it is small deterministic JSON. Task 4 updates the spec sentence.

---

### Task 1: Branch, content fields, stack de-duplication, wording

**Files:**
- Modify: `src/data/content.ts` (profile block lines 21-40; stack items lines 392 and 435), `src/data/cases.ts:104`
- Test: `scripts/content.test.ts`, `scripts/render-linkedin.test.ts`

**Interfaces:**
- Produces: `profile.availabilityLine: string`, `profile.markets: string` (both `as const` literals).

- [ ] **Step 1: Branch**

```bash
cd /Users/macbook-pro/projects/personal/bpabatao.github.io
git checkout main && git status --short | wc -l   # must print 0
git checkout -b site/recruiter-redesign
```

- [ ] **Step 2: Failing tests**

Append to `scripts/content.test.ts`:

```ts
test("hero availability line carries remote, CET and the markets", () => {
  assert.equal(profile.markets, "US and EU teams");
  assert.equal(profile.availabilityLine, "Open to Staff / Lead platform roles · Remote from Italy (CET), async-first · US and EU teams");
  assert.ok(profile.availabilityLine.endsWith(profile.markets));
});

test("stack items name each technology once", () => {
  const items = stackGroups.flatMap((g) => g.items.flatMap((i) => i.split(/\s*(?:·|,|\s-\s)\s*/)));
  assert.ok(!items.includes("Bedrock"), "bare Bedrock duplicates AWS Bedrock (Claude)");
  assert.ok(!items.includes("WAF"), "bare WAF duplicates WAFv2");
});
```

Append to `scripts/render-linkedin.test.ts`:

```ts
test("skills.txt lists Bedrock and WAF once", () => {
  const skills = bodyOf(pack["skills.txt"]).split("\n");
  assert.equal(skills.filter((s) => /bedrock/i.test(s)).length, 1);
  assert.equal(skills.filter((s) => /^WAF/i.test(s)).length, 1);
});
```

Run: `npm test`
Expected: FAIL in `content.test.ts` (`availabilityLine` undefined) and in `render-linkedin.test.ts` (two Bedrock entries).

- [ ] **Step 3: Content edits**

In `src/data/content.ts`, above `export const profile`, add:

```ts
const MARKETS = "US and EU teams";
```

Inside `profile`, after `availability: ...`, add:

```ts
  availabilityLine: `Open to Staff / Lead platform roles · Remote from Italy (CET), async-first · ${MARKETS}`,
  markets: MARKETS,
```

Stack de-duplication:
- Line 392 item: remove the trailing `, Bedrock` so it ends `..., Elastic Beanstalk"`.
- Line 435 item: `"OWASP/IDOR · JWT · WAF · Snyk"` -> `"OWASP/IDOR · JWT · WAFv2 · Snyk"`.

In `src/data/cases.ts:104` replace `Five engineers, every production tenant:` with `Five engineers, one fleet:`.

- [ ] **Step 4: Render, test, gate**

```bash
npm run render && npm test && npm run check && npm run build
git status --short
```
Expected: tests all `# fail 0`; `check-profile ok`; build green; changed files are `content.ts`, `cases.ts`, the two test files, `linkedin/skills.txt` and any other `linkedin/*.txt` whose body changed (`headline.txt`/`about.txt` unchanged), plus `public/resume.pdf`/`resume/resume.docx` timestamp-only - revert those two: `git checkout -- public/resume.pdf resume/resume.docx` (the resume text did not change; `resume/resume.html` must show no diff - if it does, keep the binaries).

- [ ] **Step 5: Commit**

```bash
git add src/data/content.ts src/data/cases.ts scripts/content.test.ts scripts/render-linkedin.test.ts linkedin
git commit -m "Content: hero availability line, markets, stack de-duplication, ai-sdlc wording"
```

---

### Task 2: Section order, nav, hero, collapsed project lists, click hooks

**Files:**
- Modify: `src/app/page.tsx`, `src/components/Header.tsx:5-10`, `src/components/Hero.tsx:24-48`, `src/components/Projects.tsx`, `src/components/Contact.tsx:17-33`, `src/components/MobileMenu.tsx:31-39`
- Test: `scripts/site.test.ts` (new; runs against `out/`)

**Interfaces:**
- Consumes: `profile.availabilityLine`.
- Produces: `data-goatcounter-click` attributes `resume`, `email`, `linkedin`, `case-<slug>`; the `sr-only` new-tab hint pattern `<span className="sr-only"> (opens in new tab)</span>` used by later tasks.

- [ ] **Step 1: Failing built-output test**

Create `scripts/site.test.ts` (asserts on the static export; Task 7 wires it into `npm run verify:site`):

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cases } from "../src/data/cases.ts";
import { profile } from "../src/data/content.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const home = readFileSync(resolve(ROOT, "out/index.html"), "utf8");
const order = (ids: string[]) => ids.map((id) => home.indexOf(`id="${id}"`));

test("built home page exists", () => {
  assert.ok(existsSync(resolve(ROOT, "out/index.html")), "run npm run build first");
});

test("sections appear in the recruiter order", () => {
  const pos = order(["projects", "work", "approach", "stack", "contact"]);
  assert.ok(pos.every((p) => p > 0), `missing section id: ${pos}`);
  assert.deepEqual([...pos].sort((a, b) => a - b), pos);
});

test("hero carries the availability line and two buttons", () => {
  assert.ok(home.includes(profile.availabilityLine.replace(/&/g, "&amp;")));
  assert.ok(home.includes('data-goatcounter-click="resume"'));
  assert.ok(home.includes('data-goatcounter-click="email"'));
  assert.ok(home.includes('data-goatcounter-click="linkedin"'));
  for (const c of cases) assert.ok(home.includes(`data-goatcounter-click="case-${c.slug}"`), c.slug);
});

test("early project lists are collapsed", () => {
  assert.ok(home.includes("also shipped ("));
  assert.ok(home.includes("earlier work ("));
  assert.equal((home.match(/<details/g) ?? []).length, 3, "earlier roles + also shipped + earlier work");
});

test("external links announce new tab", () => {
  const blanks = home.match(/target="_blank"/g) ?? [];
  const hints = home.match(/\(opens in new tab\)/g) ?? [];
  assert.equal(hints.length, blanks.length, `${blanks.length} target=_blank links, ${hints.length} hints`);
});
```

Run: `npm run build && node scripts/site.test.ts`
Expected: FAIL (order, missing attributes, `<details>` count 1, hints 0).

- [ ] **Step 2: page.tsx order**

```tsx
import { Hero } from "@/components/Hero";
import { Projects } from "@/components/Projects";
import { Work } from "@/components/Work";
import { Approach } from "@/components/Approach";
import { StackGrid } from "@/components/StackGrid";
import { Contact } from "@/components/Contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <Projects />
      <Work />
      <Approach />
      <StackGrid />
      <Contact />
    </main>
  );
}
```

Confirm `src/components/Approach.tsx` has `id="approach"` on its `<section>`; if it has no id, add `id="approach"`.

- [ ] **Step 3: Nav order**

`src/components/Header.tsx:5-10`:

```ts
const nav = [
  { href: "/#projects", label: "work" },
  { href: "/#work", label: "experience" },
  { href: "/#stack", label: "stack" },
  { href: "/#contact", label: "contact" },
];
```

`MobileMenu.tsx:31-39` resume link: add `data-goatcounter-click="resume"` and change the text to `resume.pdf ↗<span className="sr-only"> (opens in new tab)</span>`.

- [ ] **Step 4: Hero**

Replace `Hero.tsx` lines 24-48 with:

```tsx
        <p className="hero-fade mt-6 max-w-2xl text-lg leading-relaxed" style={{ animationDelay: "0.2s" }}>
          {profile.summary}
        </p>

        <p className="hero-fade mt-4 max-w-2xl leading-relaxed text-ink" style={{ animationDelay: "0.28s" }}>
          {profile.availabilityLine}
        </p>

        <div className="hero-fade mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "0.35s" }}>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener"
            data-goatcounter-click="resume"
            className="rounded-sm bg-accent px-5 py-2.5 font-mono text-sm font-medium text-accent-contrast transition-opacity hover:opacity-85"
          >
            view resume ↗<span className="sr-only"> (opens in new tab)</span>
          </a>
          <a
            href={`mailto:${profile.email}`}
            data-goatcounter-click="email"
            className="rounded-sm border border-line px-5 py-2.5 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            email me
          </a>
          <div className="flex gap-4 font-mono text-sm">
            <a className="link-sweep text-muted transition-colors hover:text-accent" href={profile.github} target="_blank" rel="noopener">
              github ↗<span className="sr-only"> (opens in new tab)</span>
            </a>
            <a className="link-sweep text-muted transition-colors hover:text-accent" href={profile.linkedin} target="_blank" rel="noopener" data-goatcounter-click="linkedin">
              linkedin ↗<span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </div>
```

- [ ] **Step 5: Projects - collapsed lists and click hooks**

Replace `ProjectList` (`Projects.tsx:6-26`) with:

```tsx
function ProjectList({ label, projects }: { label: string; projects: SecondaryProject[] }) {
  return (
    <Reveal className="mt-12">
      <details className="group">
        <summary className="cursor-pointer list-none font-mono text-sm text-muted transition-colors hover:text-accent">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span> {label.toLowerCase()} ({projects.length})
        </summary>
        <div className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {projects.map((p) => (
            <div key={p.title}>
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener" className="font-medium text-ink transition-colors hover:text-accent">
                  {p.title} ↗<span className="sr-only"> (opens in new tab)</span>
                </a>
              ) : (
                <span className="font-medium text-ink">{p.title}</span>
              )}
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.description}</p>
            </div>
          ))}
        </div>
      </details>
    </Reveal>
  );
}
```

On the flagship `<Link>` (`Projects.tsx:40-43`) add `data-goatcounter-click={`case-${p.slug}`}`.
On the fleet portal `<a>` (`Projects.tsx:78-85`) append `<span className="sr-only"> (opens in new tab)</span>` after the `↗`.

- [ ] **Step 6: Contact click hooks and hints**

`Contact.tsx:17-33`: add `data-goatcounter-click="email"` to the mailto link; add `data-goatcounter-click="linkedin"` to the linkedin link and `data-goatcounter-click="resume"` to the resume link; append `<span className="sr-only"> (opens in new tab)</span>` after each `↗` on the three `target="_blank"` links.

`src/components/Footer.tsx` source link (`target="_blank"`): append the same hint after `source ↗`.

- [ ] **Step 7: Build and test**

```bash
npm run build && node scripts/site.test.ts
```
Expected: `# pass 5`, `# fail 0`. If the "external links announce new tab" count differs, `grep -n 'target="_blank"' src/components/*.tsx src/app/**/*.tsx` and add the hint to every remaining one (the case page has none today).

- [ ] **Step 8: Commit**

```bash
git add src/app/page.tsx src/components scripts/site.test.ts
git commit -m "Site: proof second, availability in the hero, collapsed project lists, click hooks"
```

---

### Task 3: Accessibility names, section landmarks, derived diagram wording, Satoshi woff2

**Files:**
- Modify: `src/components/ThemeToggle.tsx:13-19`, `src/components/SectionHeading.tsx`, every component that calls `SectionHeading` (`Work.tsx`, `Projects.tsx`, `StackGrid.tsx`, `Contact.tsx`, `Approach.tsx`), `src/components/diagrams.tsx:138`, `src/lib/fonts.ts:10-15`, `src/fonts/`
- Test: `scripts/site.test.ts`

- [ ] **Step 1: Failing tests (append to `scripts/site.test.ts`)**

```ts
test("theme toggle accessible name contains its visible label", () => {
  assert.ok(home.includes('aria-label="Switch to light mode"') || home.includes('aria-label="Switch to dark mode"'));
  assert.ok(!home.includes('aria-label="Toggle color theme"'));
});

test("every section is labelled by its heading", () => {
  for (const id of ["projects", "work", "approach", "stack", "contact"]) {
    assert.ok(home.includes(`id="${id}" aria-labelledby="${id}-heading"`) || home.includes(`aria-labelledby="${id}-heading" id="${id}"`), id);
    assert.ok(home.includes(`id="${id}-heading"`), `${id}-heading`);
  }
});

test("fonts ship as woff2 only", () => {
  assert.ok(!existsSync(resolve(ROOT, "src/fonts/Satoshi-Variable.ttf")));
  assert.ok(existsSync(resolve(ROOT, "src/fonts/Satoshi-Variable.woff2")));
});
```

Run: `node scripts/site.test.ts` -> the three new tests FAIL.

- [ ] **Step 2: ThemeToggle**

Replace lines 14-19 of `ThemeToggle.tsx`: the visible label is CSS-swapped, so give the button two accessible names the same way:

```tsx
    <button
      type="button"
      onClick={toggle}
      className="flex cursor-pointer items-center gap-2 rounded-sm border border-line px-3 py-1.5 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
```
Delete the `aria-label` line entirely; the accessible name becomes the button's text content ("light mode" / "dark mode", one of which is hidden per theme), which satisfies label-in-name. Then adjust the test in Step 1 to assert the absence of `aria-label="Toggle color theme"` and the presence of the two visible labels (`>light mode<` and `>dark mode<`).

- [ ] **Step 3: SectionHeading id + aria-labelledby**

`src/components/SectionHeading.tsx`:

```tsx
import { Reveal } from "./Reveal";

export function SectionHeading({ id, title, annotation }: { id: string; title: string; annotation: string }) {
  return (
    <Reveal className="mb-10 flex flex-wrap items-baseline justify-between gap-2">
      <h2 id={`${id}-heading`} className="font-display text-3xl font-semibold tracking-tight text-ink">
        {title}
      </h2>
      <span className="font-mono text-xs text-muted">{annotation}</span>
    </Reveal>
  );
}
```

In each caller, pass `id` equal to the section id and add `aria-labelledby` to the `<section>`:
- `Projects.tsx`: `<section id="projects" aria-labelledby="projects-heading" ...>` and `<SectionHeading id="projects" ...>`
- `Work.tsx`: `id="work"` / `aria-labelledby="work-heading"`
- `StackGrid.tsx`: `id="stack"` / `aria-labelledby="stack-heading"`
- `Contact.tsx`: `id="contact"` / `aria-labelledby="contact-heading"`
- `Approach.tsx`: `id="approach"` / `aria-labelledby="approach-heading"` (read the file first; it uses `SectionHeading` with title "Operating principles").

- [ ] **Step 4: Diagram wording**

`diagrams.tsx:138`: replace the `aria-label` string with `` aria-label={`The provisioning dashboard drives the Terraform control-plane, which provisions ${TENANTS.length} tenant environments`} ``.

- [ ] **Step 5: Satoshi woff2**

```bash
python3 -m fontTools.ttLib.woff2 compress -o src/fonts/Satoshi-Variable.woff2 src/fonts/Satoshi-Variable.ttf
ls -la src/fonts/
git rm -q src/fonts/Satoshi-Variable.ttf
```
Expected: `Satoshi-Variable.woff2` around 50-70 KB. Edit `src/lib/fonts.ts:11` to `src: "../fonts/Satoshi-Variable.woff2",`.

- [ ] **Step 6: Build and test**

```bash
npm run build && node scripts/site.test.ts
```
Expected: `# fail 0`.

- [ ] **Step 7: Commit**

```bash
git add src/components src/lib/fonts.ts src/fonts scripts/site.test.ts
git commit -m "A11y: label-in-name toggle, new-tab hints, section landmarks; Satoshi as woff2"
```

---

### Task 4: Generated share cards, favicon, og freshness gate

**Files:**
- Create: `scripts/render-og.ts`, `scripts/render-og.test.ts`
- Modify: `scripts/check-profile.ts` (`main()` after the resume staleness check, line ~110), `package.json` scripts, `.gitignore`, `CLAUDE.md`, `docs/superpowers/specs/2026-08-29-recruiter-redesign-design.md` (section 5, the gitignore sentence)
- Generated: `public/og.png`, `public/og/<slug>.png`, `public/favicon.ico`, `resume/og-source.json`

**Interfaces:**
- Produces: `interface Card { file: string; kicker: string; title: string; accent: string; body: string; foot: string }`, `cardInputs(): Card[]`, `cardHtml(card: Card): string`, `pngSize(buf: Buffer): { width: number; height: number }`. CLI: `node scripts/render-og.ts [--no-chrome]`.

- [ ] **Step 1: Failing test**

Create `scripts/render-og.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { cardHtml, cardInputs, pngSize } from "./render-og.ts";
import { cases } from "../src/data/cases.ts";
import { fleetPortals, profile } from "../src/data/content.ts";

test("one card for home and one per case", () => {
  const cards = cardInputs();
  assert.equal(cards.length, 1 + cases.length);
  assert.equal(cards[0].file, "og.png");
  for (const c of cases) assert.ok(cards.some((k) => k.file === `og/${c.slug}.png`), c.slug);
});

test("home card carries role and derived tenant count", () => {
  const html = cardHtml(cardInputs()[0]);
  assert.ok(html.includes(profile.role));
  assert.ok(html.includes(`${fleetPortals.length} TENANTS`));
  assert.ok(html.includes("width: 1200px") && html.includes("height: 630px"));
  assert.ok(!html.includes("Lead Platform Engineer"));
});

test("pngSize reads the IHDR chunk", () => {
  const buf = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a0000000d49484452", "hex").copy(buf, 0);
  buf.writeUInt32BE(1200, 16);
  buf.writeUInt32BE(630, 20);
  assert.deepEqual(pngSize(buf), { width: 1200, height: 630 });
});
```

Run: `NODE_OPTIONS=--disable-warning=MODULE_TYPELESS_PACKAGE_JSON node scripts/render-og.test.ts`
Expected: FAIL - cannot find `./render-og.ts`.

- [ ] **Step 2: Implementation**

Create `scripts/render-og.ts`:

```ts
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { cases } from "../src/data/cases.ts";
import { fleetPortals, metrics, profile } from "../src/data/content.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const FONTS = resolve(ROOT, "src/fonts");

export interface Card {
  file: string;
  kicker: string;
  title: string;
  accent: string;
  body: string;
  foot: string;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* The card inputs are the only thing check-profile compares; keep them a pure function of content.ts. */
export function cardInputs(): Card[] {
  return [
    {
      file: "og.png",
      kicker: profile.statusLine,
      title: `${profile.thesis.lead} ${profile.thesis.tail}`,
      accent: profile.thesis.accent,
      body: `${profile.name} · ${profile.role}`,
      foot: metrics.map((m) => `${m.value} ${m.label}`).join("   ·   "),
    },
    ...cases.map((c) => ({
      file: `og/${c.slug}.png`,
      kicker: `~/case/${c.slug}`,
      title: c.title,
      accent: "",
      body: c.subtitle,
      foot: `${c.meta.ownership} · ${c.meta.stack.slice(0, 4).join(" · ")}`,
    })),
  ];
}

export function cardHtml(c: Card): string {
  const font = (name: string, file: string) => `@font-face { font-family: "${name}"; src: url("${pathToFileURL(resolve(FONTS, file)).href}"); }`;
  return `<!doctype html><html><head><meta charset="utf-8"><style>
${font("Clash", "ClashDisplay-Variable.woff2")}
${font("Satoshi", "Satoshi-Variable.woff2")}
${font("Mono", "JetBrainsMono-Variable.woff2")}
html, body { margin: 0; }
body { width: 1200px; height: 630px; background: #0b0c0e; color: #e8eaed; font-family: Satoshi, system-ui, sans-serif; position: relative; overflow: hidden; }
.grid { position: absolute; inset: 0; background-image: linear-gradient(to right, #24272b 1px, transparent 1px), linear-gradient(to bottom, #24272b 1px, transparent 1px); background-size: 48px 48px; opacity: .35; mask-image: linear-gradient(to bottom, black, transparent 80%); }
.wrap { position: relative; padding: 72px 80px; display: flex; flex-direction: column; height: 630px; box-sizing: border-box; }
.kicker { font-family: Mono, monospace; font-size: 22px; color: #9ba1a8; letter-spacing: .04em; }
.kicker b { color: #4ade80; font-weight: 400; }
h1 { font-family: Clash, sans-serif; font-weight: 600; font-size: 72px; line-height: 1.04; letter-spacing: -.01em; margin: 28px 0 0; max-width: 1040px; }
h1 span { color: #ff5500; }
.body { margin-top: 26px; font-size: 30px; color: #c3c8ce; max-width: 1000px; line-height: 1.35; }
.foot { margin-top: auto; font-family: Mono, monospace; font-size: 22px; color: #9ba1a8; }
</style></head><body><div class="grid"></div><div class="wrap">
<div class="kicker">${c.kicker.startsWith("OPERATIONAL") ? `<b>OPERATIONAL</b>${esc(c.kicker.slice("OPERATIONAL".length))}` : esc(c.kicker)}</div>
<h1>${esc(c.title)}${c.accent ? ` <span>${esc(c.accent)}</span>` : ""}</h1>
<div class="body">${esc(c.body)}</div>
<div class="foot">${esc(c.foot)}</div>
</div></body></html>`;
}

export function pngSize(buf: Buffer): { width: number; height: number } {
  if (buf.length < 24 || buf.toString("hex", 0, 8) !== "89504e470d0a1a0a") throw new Error("not a PNG");
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function screenshot(html: string, out: string, width: number, height: number): boolean {
  if (!existsSync(CHROME)) {
    console.log(`OG_SKIPPED chrome not found at ${CHROME}`);
    return false;
  }
  const tmp = resolve(tmpdir(), `og-${Date.now()}-${Math.random().toString(16).slice(2)}.html`);
  writeFileSync(tmp, html);
  mkdirSync(dirname(out), { recursive: true });
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", `--window-size=${width},${height}`, `--screenshot=${out}`, pathToFileURL(tmp).href], { stdio: ["ignore", "ignore", "inherit"], timeout: 60_000 });
  const size = pngSize(readFileSync(out));
  if (size.width !== width || size.height !== height) throw new Error(`${out}: expected ${width}x${height}, got ${size.width}x${size.height}`);
  return true;
}

function faviconHtml(): string {
  const svg = readFileSync(resolve(ROOT, "src/app/icon.svg"), "utf8");
  return `<!doctype html><html><body style="margin:0;width:32px;height:32px;background:#0b0c0e">${svg.replace("<svg", '<svg width="32" height="32"')}</body></html>`;
}

function main(argv: string[]): void {
  const cards = cardInputs();
  const source = resolve(ROOT, "resume/og-source.json");
  const previous = existsSync(source) ? readFileSync(source, "utf8") : "";
  const next = JSON.stringify(cards, null, 2);
  const allPresent = cards.every((c) => existsSync(resolve(ROOT, "public", c.file)));
  if (previous === next && allPresent && !argv.includes("--force")) {
    console.log("og cards up to date");
    return;
  }
  if (argv.includes("--no-chrome")) {
    console.log("OG_SKIPPED --no-chrome");
    return;
  }
  for (const c of cards) {
    if (!screenshot(cardHtml(c), resolve(ROOT, "public", c.file), 1200, 630)) return;
    console.log(`wrote public/${c.file}`);
  }
  const favicon = resolve(ROOT, "public/favicon.ico");
  if (!existsSync(favicon) && screenshot(faviconHtml(), favicon, 32, 32)) console.log("wrote public/favicon.ico");
  writeFileSync(source, next + "\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));
```

- [ ] **Step 3: Test, then render the real cards**

```bash
NODE_OPTIONS=--disable-warning=MODULE_TYPELESS_PACKAGE_JSON node scripts/render-og.test.ts
NODE_OPTIONS=--disable-warning=MODULE_TYPELESS_PACKAGE_JSON node scripts/render-og.ts
ls -la public/og.png public/og public/favicon.ico resume/og-source.json
sips -g pixelWidth -g pixelHeight public/og.png public/og/core-api.png | grep pixel
open public/og.png
```
Expected: `# pass 3`; four `wrote ...` lines plus the favicon; every PNG 1200x630; the opened card shows "OPERATIONAL - 7 TENANTS", the thesis with the orange accent, "Benedict Pabatao · Staff Software Engineer", the four stats. If the fonts render as system fonts, check the `file://` URLs in `cardHtml` resolve (`src/fonts/Satoshi-Variable.woff2` must exist - Task 3).

- [ ] **Step 4: Freshness gate in `check-profile.ts`**

Add the import `import { cardInputs } from "./render-og.ts";` and, after the `resume/resume.html is stale` line (~110):

```ts
  const ogSource = resolve(ROOT, "resume/og-source.json");
  const ogWant = JSON.stringify(cardInputs(), null, 2) + "\n";
  if (!existsSync(ogSource) || readFileSync(ogSource, "utf8") !== ogWant) problems.push("og cards stale - run npm run render");
  for (const c of cardInputs()) if (!existsSync(resolve(ROOT, "public", c.file))) problems.push(`missing share card public/${c.file} - run npm run render`);
```

- [ ] **Step 5: Wire scripts, ignore rule, docs**

`package.json`:
- `render`: append ` && NODE_OPTIONS=--disable-warning=MODULE_TYPELESS_PACKAGE_JSON node scripts/render-og.ts`
- `test`: insert ` && NODE_OPTIONS=--disable-warning=MODULE_TYPELESS_PACKAGE_JSON node scripts/render-og.test.ts` before the `python3 scripts/docx.py --selftest` part.

`.gitignore`: nothing to add (`resume/og-source.json` is tracked on purpose).

`CLAUDE.md`: in the "Never hand-edit" bullet add `public/og.png`, `public/og/*.png`, `public/favicon.ico`, `resume/og-source.json`.

Spec `docs/superpowers/specs/2026-08-29-recruiter-redesign-design.md` section 5: change "`resume/.og-source.json` (gitignored)" to "`resume/og-source.json` (tracked, so the CI gate can compare it)" and the file table row accordingly.

- [ ] **Step 6: Gate and commit**

```bash
npm run render && npm test && npm run check && npm run build
git status --short
git add scripts/render-og.ts scripts/render-og.test.ts scripts/check-profile.ts package.json CLAUDE.md docs/superpowers/specs/2026-08-29-recruiter-redesign-design.md public/og.png public/og public/favicon.ico resume/og-source.json
git checkout -- public/resume.pdf resume/resume.docx 2>/dev/null; git status --short
git commit -m "Share cards: og.png, per-case cards and favicon generated from content.ts"
```
Expected before commit: `check-profile ok`; after commit: clean tree.

---

### Task 5: Case-page metadata

**Files:**
- Modify: `src/app/case/[slug]/page.tsx:21-25`
- Test: `scripts/site.test.ts`

- [ ] **Step 1: Failing test (append to `scripts/site.test.ts`)**

```ts
test("each case page owns its canonical and share card", () => {
  for (const c of cases) {
    const html = readFileSync(resolve(ROOT, `out/case/${c.slug}/index.html`), "utf8");
    assert.ok(html.includes(`<link rel="canonical" href="${profile.siteUrl}/case/${c.slug}/"`), `${c.slug} canonical`);
    assert.ok(html.includes(`property="og:image" content="${profile.siteUrl}/og/${c.slug}.png"`), `${c.slug} og:image`);
    assert.ok(html.includes(`property="og:url" content="${profile.siteUrl}/case/${c.slug}/"`), `${c.slug} og:url`);
    assert.ok(html.includes('name="twitter:card" content="summary_large_image"'), `${c.slug} twitter card`);
  }
});
```

Run: `node scripts/site.test.ts` -> FAIL (canonical points at the home page).

- [ ] **Step 2: Implementation**

Replace `generateMetadata`:

```tsx
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cs = cases.find((c) => c.slug === slug);
  if (!cs) return {};
  const url = `/case/${cs.slug}/`;
  const image = `/og/${cs.slug}.png`;
  return {
    title: cs.title,
    description: cs.subtitle,
    alternates: { canonical: url },
    openGraph: { url, title: cs.title, description: cs.subtitle, images: [image], type: "article" },
    twitter: { card: "summary_large_image", title: cs.title, description: cs.subtitle, images: [image] },
  };
}
```

- [ ] **Step 3: Build, test, commit**

```bash
npm run build && node scripts/site.test.ts && grep -o 'rel="canonical" href="[^"]*"' out/case/core-api/index.html
git add 'src/app/case/[slug]/page.tsx' scripts/site.test.ts
git commit -m "Case pages: own canonical, OpenGraph and Twitter card"
```

---

### Task 6: Print stylesheet and GoatCounter

**Files:**
- Modify: `src/app/globals.css` (append), `src/app/layout.tsx:36,48-61`, `.github/workflows/deploy.yml:28`
- Test: `scripts/site.test.ts`

- [ ] **Step 1: Failing tests (append to `scripts/site.test.ts`)**

```ts
test("analytics script is vendored and absent without the env var", () => {
  assert.ok(!home.includes("gc.zgo.at"), "never load the counter from the CDN");
  if (process.env.NEXT_PUBLIC_GOATCOUNTER_CODE) {
    assert.ok(home.includes(`https://${process.env.NEXT_PUBLIC_GOATCOUNTER_CODE}.goatcounter.com/count`));
    assert.ok(home.includes('src="/gc/count.js"'));
  } else {
    assert.ok(!home.includes("goatcounter"));
  }
});

test("print rules and beforeprint hook ship", () => {
  const css = readFileSync(resolve(ROOT, "src/app/globals.css"), "utf8");
  assert.ok(css.includes("@media print"));
  assert.ok(home.includes("beforeprint"));
});
```

- [ ] **Step 2: Print stylesheet (append to `globals.css`)**

```css
/* Print: light, quiet, everything expanded - the resume PDF stays the primary document */
@media print {
  :root {
    --bg: #ffffff;
    --surface: #ffffff;
    --surface-2: #f2f2f2;
    --line: #d0d0d0;
    --ink: #000000;
    --body: #222222;
    --muted: #555555;
    --accent: #b33d00;
    --accent-contrast: #ffffff;
    --ok: #15803d;
  }
  header,
  .scroll-progress,
  .hero-grid,
  .mobile-menu,
  [popovertarget],
  button {
    display: none !important;
  }
  *,
  *::before,
  *::after {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
    color: var(--muted);
  }
  section,
  article,
  details {
    break-inside: avoid;
  }
  .sr-only {
    display: none !important;
  }
}
```

- [ ] **Step 3: layout.tsx - beforeprint hook and GoatCounter**

Line 36 area, add after `themeInit`:

```ts
const printInit = `window.addEventListener("beforeprint",()=>{document.querySelectorAll("details").forEach(d=>{d.open=true})})`;
const goatcounter = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE;
```

In `<head>` add `<script dangerouslySetInnerHTML={{ __html: printInit }} />` after the theme script.
Vendor the counter script instead of loading it from a third-party CDN (no Subresource Integrity is possible for an unversioned CDN file; GoatCounter's `count.js` is ISC-licensed and documented as self-hostable):

```bash
mkdir -p public/gc && curl -sSL https://gc.zgo.at/count.js -o public/gc/count.js && head -3 public/gc/count.js && shasum -a 256 public/gc/count.js
```
Record the printed version comment and sha256 in the commit body. Only the beacon requests go to `<code>.goatcounter.com`; no external script executes.

Before `</body>` add:

```tsx
        {goatcounter && <script data-goatcounter={`https://${goatcounter}.goatcounter.com/count`} async src="/gc/count.js" />}
```

- [ ] **Step 4: CI env var**

`.github/workflows/deploy.yml`, the `- run: npm run build` step becomes:

```yaml
      - run: npm run build
        env:
          NEXT_PUBLIC_GOATCOUNTER_CODE: ${{ vars.NEXT_PUBLIC_GOATCOUNTER_CODE }}
```
(unset repository variable -> empty string -> no script; Benedict sets the variable in GitHub repo settings when the GoatCounter account exists.)

- [ ] **Step 5: Build both ways, print check, commit**

```bash
npm run build && node scripts/site.test.ts
NEXT_PUBLIC_GOATCOUNTER_CODE=test npm run build && grep -c 'test.goatcounter.com/count' out/index.html && NEXT_PUBLIC_GOATCOUNTER_CODE=test node scripts/site.test.ts
npm run build   # back to the no-analytics build
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf=/private/tmp/claude-501/-Users-macbook-pro-projects-personal-bpabatao-github-io/ac316407-ba30-4be3-8717-b65c0f4491a3/scratchpad/home-print.pdf "file://$PWD/out/index.html" && open /private/tmp/claude-501/-Users-macbook-pro-projects-personal-bpabatao-github-io/ac316407-ba30-4be3-8717-b65c0f4491a3/scratchpad/home-print.pdf
git add src/app/globals.css src/app/layout.tsx .github/workflows/deploy.yml scripts/site.test.ts public/gc/count.js
git commit -m "Site: print stylesheet; GoatCounter gated on NEXT_PUBLIC_GOATCOUNTER_CODE"
```
Expected: tests green in both builds; `grep -c` prints 1 with the variable; the printed PDF is light, headerless, with the project lists expanded (headless Chrome fires `beforeprint`).

---

### Task 7: Verification, Lighthouse, visual QA, PR

**Files:**
- Modify: `package.json` (`verify:site` script)

- [ ] **Step 1: `verify:site` script**

`package.json` scripts: add `"verify:site": "npm run build && NODE_OPTIONS=--disable-warning=MODULE_TYPELESS_PACKAGE_JSON node scripts/site.test.ts"`.
Run `npm run verify:site` -> all site tests pass.

- [ ] **Step 2: Lighthouse floor**

```bash
(npx --yes serve -l 4173 out >/dev/null 2>&1 &) ; sleep 2
npx --yes lighthouse http://localhost:4173/ --output=json --output-path=/private/tmp/claude-501/-Users-macbook-pro-projects-personal-bpabatao-github-io/ac316407-ba30-4be3-8717-b65c0f4491a3/scratchpad/lh-mobile.json --chrome-flags="--headless=new" --quiet
npx --yes lighthouse http://localhost:4173/ --preset=desktop --output=json --output-path=/private/tmp/claude-501/-Users-macbook-pro-projects-personal-bpabatao-github-io/ac316407-ba30-4be3-8717-b65c0f4491a3/scratchpad/lh-desktop.json --chrome-flags="--headless=new" --quiet
for f in lh-mobile lh-desktop; do jq -r '"'$f': perf \(.categories.performance.score*100) a11y \(.categories.accessibility.score*100) bp \(.categories["best-practices"].score*100) seo \(.categories.seo.score*100); label-mismatch \(.audits["label-content-name-mismatch"].score)"' /private/tmp/claude-501/-Users-macbook-pro-projects-personal-bpabatao-github-io/ac316407-ba30-4be3-8717-b65c0f4491a3/scratchpad/$f.json; done
kill $(lsof -t -iTCP:4173 -sTCP:LISTEN)
```
Expected: mobile perf >= 97, desktop 100, a11y 100 on both, `label-mismatch 1` (passing) or `null` (not applicable).

- [ ] **Step 3: Visual QA against the audit baseline**

Use the `/visual-qa` skill (or the playwright MCP directly): serve `out/` on port 4173 again and capture the same set as the audit baseline in `/private/tmp/claude-501/-Users-macbook-pro-projects-personal-bpabatao-github-io/ac316407-ba30-4be3-8717-b65c0f4491a3/scratchpad/audit/` (desktop 1440 above the fold and full page, mobile 390 above the fold and full page, light theme, `/case/core-api/`, and `public/og.png`). Compare side by side and list the concrete deltas: availability line under the summary, two buttons, Selected work directly under the hero, two collapsed disclosures, the toggle label, no layout overflow at 390. Fix anything that regressed (max three iterations), commit as `Site: visual QA fixes`.

- [ ] **Step 4: Idempotency and profile-sync compatibility**

```bash
npm run render && npm run check && git status --short
npm run render && npm run check && git status --short
```
Expected: the second pass changes nothing except the timestamp-only `public/resume.pdf` / `resume/resume.docx` (revert them with `git checkout --`); `og cards up to date` printed on the second render.

- [ ] **Step 5: Push and open the PR**

```bash
git push -u origin site/recruiter-redesign
gh pr create --base main --head site/recruiter-redesign --title "Site: recruiter-appeal redesign - proof first, generated share cards, analytics" --body-file - <<'EOF'
## What

- Home page order: Hero, Selected work, Experience, Operating principles, Capabilities, Contact; nav follows.
- Hero: plain-text availability line (Staff / Lead platform roles, remote from Italy, CET, async-first, US and EU teams), "view resume" + "email me" buttons.
- "Also shipped" and "Earlier work" collapse into disclosures (mobile page roughly halves).
- Share cards generated from `content.ts`: `public/og.png` (Staff title, 7 tenants, stats) and one card per case study; `favicon.ico` added; `check-profile` fails when the cards are stale.
- Case pages own their canonical, OpenGraph and Twitter metadata (were inheriting the home page's).
- Accessibility: theme toggle label-in-name, "(opens in new tab)" hints, sections labelled by their headings, diagram wording derived from the fleet.
- Satoshi shipped as woff2; print stylesheet with a beforeprint hook; GoatCounter analytics, counter script vendored at `public/gc/count.js`, gated on `NEXT_PUBLIC_GOATCOUNTER_CODE` (unset today, so no script ships).
- Wording: "Five engineers, one fleet:"; stack items de-duplicated.

## Verification

- `npm test`, `npm run check`, `npm run verify:site` green; Lighthouse mobile/desktop scores in the PR comments below.
- Before/after screenshots attached in the first comment.
- `npm run render && npm run check` twice: idempotent; the profile-sync skill is untouched.

## To enable analytics

Create the GoatCounter account, then add repository variable `NEXT_PUBLIC_GOATCOUNTER_CODE` (Settings > Secrets and variables > Actions > Variables) and re-run the deploy.
EOF
```
Then `gh pr comment <n> --body-file` with the Lighthouse numbers and the screenshot list. Do not merge.

---

## Self-review notes

- Spec sections 4, 5, 6, 8 map to Tasks 2, 4+5, 3+6, 7 respectively; section 3 findings 1-11 are each addressed (1 T4, 2 T2, 3 T2, 4 T2, 5 T4, 6 T5, 7 T3, 8 T3, 9 T6, 10 T3, 11 T1).
- `profile.availabilityLine` and `profile.markets` are defined in T1 and consumed in T2 and the tests with the same names.
- `cardInputs`, `cardHtml`, `pngSize` are defined in T4 and consumed by `check-profile` and the tests with the same signatures.
- The `sr-only` class is Tailwind's built-in utility; no CSS to add.
- Deviation from the spec recorded inline: `resume/og-source.json` tracked, spec updated in T4.

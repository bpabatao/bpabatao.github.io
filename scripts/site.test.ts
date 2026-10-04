import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cases } from "../src/data/cases.ts";
import { currentJobs, profile } from "../src/data/content.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(resolve(ROOT, "out/index.html"))) throw new Error("out/index.html missing - run npm run build first");
const home = readFileSync(resolve(ROOT, "out/index.html"), "utf8");
const order = (ids: string[]) => ids.map((id) => home.indexOf(`id="${id}"`));
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const hasTag = (html: string, tag: string, attrs: Record<string, string>) =>
  new RegExp(`<${tag}\\b` + Object.entries(attrs).map(([k, v]) => `(?=[^>]*\\b${k}="${escapeRe(v)}")`).join("") + "[^>]*>").test(html);

test("sections appear in the recruiter order", () => {
  const pos = order(["projects", "work", "stack", "contact"]);
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

test("experience shows a short head per role and folds the rest", () => {
  // also shipped / earlier work live in the LinkedIn pack only
  assert.ok(!home.includes("also shipped (") && !home.includes("earlier work ("));
  const tails = currentJobs.map((j) => j.receipts.length - (j.lede ? 1 : 0) - (j.visible ?? 6));
  for (const t of tails) assert.ok(t <= 6, `fold holds at most 6, got ${t}`);
  const folds = tails.filter((t) => t > 0).length;
  assert.equal((home.match(/<details/g) ?? []).length, 1 + folds, "earlier roles + receipt folds");
  assert.equal((home.match(/>show \d+ more</g) ?? []).length, folds, "every current job past the cap folds its tail");
});

test("no ambient status gimmicks ship", () => {
  for (const gone of ["OPERATIONAL", "ACCEPTING", "status-dot", "portal-dot", "status-text"]) assert.ok(!home.includes(gone), gone);
  assert.equal((home.match(/<h1[\s>]/g) ?? []).length, 1, "home has one h1");
});

test("external links announce new tab", () => {
  // Next embeds a serialized RSC payload in <script> tags for hydration; it
  // JSON-encodes target="_blank" differently but repeats the hint phrase
  // verbatim, so scan only the rendered markup, not the payload.
  const rendered = home.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
  const blanks = rendered.match(/target="_blank"/g) ?? [];
  const hints = rendered.match(/\(opens in new tab\)/g) ?? [];
  assert.equal(hints.length, blanks.length, `${blanks.length} target=_blank links, ${hints.length} hints`);
});

test("every case page ends with a next-case link and the resume and email CTAs", () => {
  cases.forEach((c, i) => {
    const html = readFileSync(resolve(ROOT, `out/case/${c.slug}/index.html`), "utf8");
    const next = cases[(i + 1) % cases.length];
    assert.ok(hasTag(html, "a", { href: `/case/${next.slug}/`, rel: "next" }), `${c.slug} -> ${next.slug}`);
    assert.ok(html.includes('data-goatcounter-click="resume-case"') && html.includes('data-goatcounter-click="email-case"'), `${c.slug} CTAs`);
    assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1, `${c.slug} has one h1`);
  });
});

test("theme toggle accessible name is its visible label", () => {
  assert.ok(!home.includes('aria-label="Toggle color theme"'));
  assert.ok(home.includes(">light mode<") && home.includes(">dark mode<"));
});

test("every section is labelled by its heading", () => {
  for (const id of ["projects", "work", "stack", "contact"]) {
    assert.ok(home.includes(`id="${id}" aria-labelledby="${id}-heading"`) || home.includes(`aria-labelledby="${id}-heading" id="${id}"`), id);
    assert.ok(home.includes(`id="${id}-heading"`), `${id}-heading`);
  }
});

test("fonts ship as woff2 only", () => {
  assert.ok(!existsSync(resolve(ROOT, "src/fonts/Satoshi-Variable.ttf")));
  assert.ok(existsSync(resolve(ROOT, "src/fonts/Satoshi-Variable.woff2")));
});

test("each case page owns its canonical and share card", () => {
  for (const c of cases) {
    const html = readFileSync(resolve(ROOT, `out/case/${c.slug}/index.html`), "utf8");
    assert.ok(hasTag(html, "link", { rel: "canonical", href: `${profile.siteUrl}/case/${c.slug}/` }), `${c.slug} canonical`);
    assert.ok(hasTag(html, "meta", { property: "og:image", content: `${profile.siteUrl}/og/${c.slug}.png` }), `${c.slug} og:image`);
    assert.ok(hasTag(html, "meta", { property: "og:url", content: `${profile.siteUrl}/case/${c.slug}/` }), `${c.slug} og:url`);
    assert.ok(hasTag(html, "meta", { name: "twitter:card", content: "summary_large_image" }), `${c.slug} twitter card`);
  }
});

test("analytics script is vendored and absent without the env var", () => {
  assert.ok(!home.includes("gc.zgo.at"), "never load the counter from the CDN");
  if (process.env.NEXT_PUBLIC_GOATCOUNTER_CODE) {
    assert.ok(home.includes(`https://${process.env.NEXT_PUBLIC_GOATCOUNTER_CODE}.goatcounter.com/count`));
    assert.ok(home.includes('src="/gc/count.js"'));
  } else {
    assert.ok(!home.includes("goatcounter.com/count"), "no beacon endpoint without the env var");
    assert.ok(!home.includes('src="/gc/count.js"'), "no counter script without the env var");
  }
});

test("print rules and beforeprint hook ship", () => {
  const css = readFileSync(resolve(ROOT, "src/app/globals.css"), "utf8");
  assert.ok(css.includes("@media print"));
  assert.ok(home.includes("beforeprint"));
});

test("share cards declare their size, alt text and type so unfurlers do not guess", () => {
  const pages = [home, ...cases.map((c) => readFileSync(resolve(ROOT, `out/case/${c.slug}/index.html`), "utf8"))];
  for (const html of pages) {
    assert.ok(hasTag(html, "meta", { property: "og:image:width", content: "1200" }), "og:image:width");
    assert.ok(hasTag(html, "meta", { property: "og:image:height", content: "630" }), "og:image:height");
    assert.ok(hasTag(html, "meta", { property: "og:image:type", content: "image/png" }), "og:image:type");
    assert.match(html, /property="og:image:alt" content="[^"]+"/, "og:image:alt is present and non-empty");
  }
});

test("a skip link precedes the header and targets the main landmark on every page", () => {
  const pages = [home, ...cases.map((c) => readFileSync(resolve(ROOT, `out/case/${c.slug}/index.html`), "utf8"))];
  for (const html of pages) {
    const skip = html.indexOf('class="skip-link"');
    const header = html.indexOf("<header");
    assert.ok(skip > 0 && header > 0 && skip < header, "skip link is the first focusable thing");
    assert.ok(html.includes('href="#main"') && html.includes('id="main"'), "skip link target exists");
  }
});

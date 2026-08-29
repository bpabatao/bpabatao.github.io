import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { cases } from "../src/data/cases.ts";
import { profile } from "../src/data/content.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
if (!existsSync(resolve(ROOT, "out/index.html"))) throw new Error("out/index.html missing - run npm run build first");
const home = readFileSync(resolve(ROOT, "out/index.html"), "utf8");
const order = (ids: string[]) => ids.map((id) => home.indexOf(`id="${id}"`));
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&");
const hasTag = (html: string, tag: string, attrs: Record<string, string>) =>
  new RegExp(`<${tag}\\b` + Object.entries(attrs).map(([k, v]) => `(?=[^>]*\\b${k}="${escapeRe(v)}")`).join("") + "[^>]*>").test(html);

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
  // Next embeds a serialized RSC payload in <script> tags for hydration; it
  // JSON-encodes target="_blank" differently but repeats the hint phrase
  // verbatim, so scan only the rendered markup, not the payload.
  const rendered = home.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
  const blanks = rendered.match(/target="_blank"/g) ?? [];
  const hints = rendered.match(/\(opens in new tab\)/g) ?? [];
  assert.equal(hints.length, blanks.length, `${blanks.length} target=_blank links, ${hints.length} hints`);
});

test("theme toggle accessible name is its visible label", () => {
  assert.ok(!home.includes('aria-label="Toggle color theme"'));
  assert.ok(home.includes(">light mode<") && home.includes(">dark mode<"));
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

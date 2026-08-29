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
  // Next embeds a serialized RSC payload in <script> tags for hydration; it
  // JSON-encodes target="_blank" differently but repeats the hint phrase
  // verbatim, so scan only the rendered markup, not the payload.
  const rendered = home.replace(/<script[^>]*>[\s\S]*?<\/script>/g, "");
  const blanks = rendered.match(/target="_blank"/g) ?? [];
  const hints = rendered.match(/\(opens in new tab\)/g) ?? [];
  assert.equal(hints.length, blanks.length, `${blanks.length} target=_blank links, ${hints.length} hints`);
});

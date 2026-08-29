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

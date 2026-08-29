import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
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
  const next = JSON.stringify(cards, null, 2) + "\n";
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
  if (!existsSync(favicon)) {
    /* Chrome's --screenshot flag rejects a .ico extension outright; render PNG bytes, then commit them under the .ico name. */
    const faviconPng = resolve(ROOT, "public/favicon.ico.png");
    if (screenshot(faviconHtml(), faviconPng, 32, 32)) {
      renameSync(faviconPng, favicon);
      console.log("wrote public/favicon.ico");
    }
  }
  writeFileSync(source, next);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main(process.argv.slice(2));

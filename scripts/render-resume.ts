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
    `<div class="loc"><span class="co">${esc(r.company)}</span>${loc} | <span class="meta">${esc(r.dates)}</span></div>`,
    ...r.previous.map((p) => `<div class="loc">Previously ${esc(p.title)} | <span class="meta">${esc(p.dates)}</span></div>`),
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
    `<div class="loc"><span class="meta">${esc(r.dates)}</span></div>`,
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
${m.education.map((e) => `<h3>${esc(e.title)}</h3>\n<div class="loc">${esc(e.detail)} | <span class="meta">${esc(e.dates)}</span></div>`).join("\n")}

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
  execFileSync(CHROME, ["--headless=new", "--disable-gpu", "--no-pdf-header-footer", `--print-to-pdf=${pdfPath}`, pathToFileURL(htmlPath).href], { stdio: ["ignore", "ignore", "inherit"], timeout: 60_000 });
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

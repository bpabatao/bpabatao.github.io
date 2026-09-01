import { mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { currentJobs, earlierJobs, earlierProjects, flagships, profile, secondaryProjects, stackGroups, type Job, type SecondaryProject } from "../src/data/content.ts";
import { formatPeriod, plainText } from "../src/lib/format.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export const LIMITS = { headline: 220, about: 2600, description: 2000, skills: 100 } as const;

export const header = (section: string) => `# updated ${profile.updated} - paste into LinkedIn > ${section}\n`;
export const bodyOf = (file: string) => file.split("\n").slice(1).join("\n").trim();
export const slugOf = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
const allJobs = () => [...currentJobs, ...earlierJobs];

function about(): string {
  const now = currentJobs.map((j) => `${j.role}, ${j.company}: ${plainText(j.receipts[0])}`);
  return `${profile.summary}\n\nCurrently:\n${now.map((l) => `- ${l}`).join("\n")}`;
}

/* One block per LinkedIn position; bullets belong to the latest position only. */
export function experience(j: Job): string {
  const positions = j.positions?.length ? j.positions : [{ title: j.role, period: j.period }];
  const heads = positions.map((p) =>
    [`## ${p.title}`, j.employmentType ? `${j.company} · ${j.employmentType}` : j.company, formatPeriod(p.period), j.location ?? ""].filter(Boolean).join("\n"),
  );
  /* LinkedIn caps a position description at LIMITS.description. Every header - the latest
     position and each earlier one - is fixed cost; the bullets get whatever is left, in order,
     and the file says plainly what did not fit rather than throwing or dropping it silently. */
  const bullets = j.receipts.map((r) => `- ${plainText(r)}`);
  const fixed = heads.join("\n\n").length + 1; // +1: the blank line before the bullets
  const kept: string[] = [];
  let used = fixed;
  for (const b of bullets) {
    const tail = bullets.length - kept.length - 1;
    const reserve = tail > 0 ? `\n- ${tail} more at ${profile.siteUrl}`.length : 0;
    if (used + 1 + b.length + reserve > LIMITS.description) break;
    kept.push(b);
    used += 1 + b.length;
  }
  const dropped = bullets.length - kept.length;
  if (dropped > 0) kept.push(`- ${dropped} more at ${profile.siteUrl}`);
  return [[heads[0], "", ...kept].join("\n"), ...heads.slice(1)].join("\n\n");
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
    const job = allJobs().find((j) => j.id === f.jobId);
    pack[`projects-${f.slug}.txt`] = header(`Projects > ${f.title}`) + [f.title, f.period ? formatPeriod(f.period) : "", job ? `Associated with: ${job.company}` : "", f.outcome, `Ownership: ${f.ownership}`, `Stack: ${f.stack.join(", ")}`, `${profile.siteUrl}/case/${f.slug}/`].filter(Boolean).join("\n") + "\n";
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

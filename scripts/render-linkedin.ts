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

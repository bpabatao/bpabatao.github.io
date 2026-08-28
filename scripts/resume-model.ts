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
    dates: formatPeriod(job.positions?.[0]?.period ?? job.period),
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

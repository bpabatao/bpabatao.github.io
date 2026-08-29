# profile-sync - design spec

Date: 2026-08-28
Status: draft for review
Owner: Benedict Pabatao

## 1. Goal

A global Claude Code skill, `/profile-sync`, that mines evidence of real work (PRs, commits, Jira, CloudTrail, pipelines, local session digests) and keeps three public-facing artifacts in sync with it:

1. The portfolio site in this repo (`src/data/content.ts`).
2. The resume (`resume/resume.html` -> `public/resume.pdf` + `resume/resume.docx`).
3. A LinkedIn paste-pack (`linkedin/*.txt`).

It runs manually or from cron.
It never publishes on its own: every change arrives as a pull request that Benedict merges.

### In scope

- One canonical profile data file; resume, PDF, docx and LinkedIn pack are rendered from it.
- A deterministic, credential-aware harvester with per-source watermarks and a local evidence ledger.
- LLM drafting of claims in Benedict's voice, gated by a verifier subagent and by static checks.
- A one-time `--init` reconciliation that fixes the current drift between site, resume and LinkedIn.
- Weekly cron invocation via `claude -p`.

### Out of scope (tracked as follow-ups in section 14)

- Recruiter-appeal redesign of the site (separate sub-project, runs after this one).
- Writing LinkedIn directly (no API; browser automation is interactive-only and optional).
- New case studies (`src/data/cases.ts`); the skill only lists candidate themes.
- Mining raw session transcripts (`~/.claude/projects/*/*.jsonl`).

## 2. Decisions already made

| Decision | Choice | Why |
|---|---|---|
| Human gate | Skill opens a PR; nothing reaches `main` without a merge | Keeps the July 2026 rule: public bio claims come from the resume or Benedict's words, never inferred artifacts. The skill proposes, Benedict asserts. |
| Disclosure | Employer named, clients and products anonymised in generated text | Portfolio is public; client repos are under NDA-shaped agreements. |
| Headline | "Staff Software Engineer" everywhere | Benedict's explicit statement on 2026-08-28; matches LinkedIn. Site and resume currently say "Lead Platform Engineer". |
| LinkedIn | Paste-pack committed to the repo | LinkedIn has no profile-write API; automation risks account restriction. |
| Resume format | Keep the existing ATS-safe HTML contract; add `.docx` output | Existing layout is already ATS-clean and has senior-appropriate section order. The checked template (`developer-resume-template.docx`) is structurally equal and content-ordered for graduates. |
| Approach | Single source of truth + renderers (approach A) | Site and resume already disagree (a client, Kubernetes/Python, "Staff"). Rendering from one file makes drift impossible instead of unlikely. |
| Ordering | Sync skill first, recruiter pass second | The skill is built against the content shape; the redesign can change presentation without touching the sync loop. |
| History | Ledger backfills full history for HtH (from 2023-06) and Nmblr (from 2024-03); claims are proposed only from evidence dated after 2026-07-18 | Full record as drafting context; existing bullets are Benedict's words and stay untouched. |
| Existing client names | Resume tenant list becomes "8 utility tenants"; `fleetPortals` keeps its live public URLs | The resume travels to third parties; the site links public facts. |
| Employer string | "ESC Partners / HometownHUB" everywhere | Matches the resume and the LinkedIn About text. |
| Headings | Keep "Professional Experience" + "Earlier Experience" | Parsers key on "Experience"; the two-tier layout reads well. |
| Page size | A4 default; `--page letter` on demand | Based in Italy, targeting US roles too. |
| Overlays | Keep `resumeReceipts` | Resume bullets are longer and keyword-dense; site bullets are tight. |
| Personal repos | `penagent` and `lexi-app` produce always-`needs-word` candidates; `hth-customer-portals` is excluded | Personal projects are curation, not evidence; the monorepo is client-derived. |
| Cron secrets | Keychain items with env fallback | Cron never sources `.zshrc`; Keychain is readable non-interactively (verified 2026-08-28). |
| Notification | GitHub's PR notification only | Zero code; `status.json` and the log are the fallback. |
| Cron model | Default model, `--max-budget-usd 5`, `--max-turns 40` | Harvest is scripted; drafting quality over cost. |
| LinkedIn pack | Also `projects-<slug>.txt` from the three flagships | Same data, LinkedIn has a Projects section. |
| Cadence | Weekly, Monday 08:30 | Quiet weeks are silent; one open PR at a time. |
| docx | `resume/resume.docx`, repo only | The site links the PDF; the docx is for ATS forms. |
| Repo CLAUDE.md | Added, about ten lines | Stops future sessions hand-editing generated files. |
| Length | Two pages; lint fails at three | Today's output is two A4 pages (verified). |
| Tenant count | Derived from `fleetPortals.length` (7 today, was a literal 8) | Verifiable by anyone; bumps when a fleet claim is confirmed. |
| Summary text | LinkedIn About lead sentence + the resume metrics sentence, "Staff" for "Lead" | Most recent words, plus the numbers. |
| Backfill timing | Last step of `--init`, interactive with progress | One-time; the `--init` PR does not wait on it. |
| LinkedIn coverage | Every position (with promotion history and employment type) and every project, not just current roles and flagships | LinkedIn shows 2 positions under ESC Partners, 6 employers, 11 projects, 53 skills; the pack must be able to replace all of it. |
| Conflicts between copies | LinkedIn wins at `--init` (HtH start May 2023, Staff since Sep 2025, BaseMap Inc as its own role, Ordermentum title, Nmblr location) | Most recently maintained copy, in Benedict's own words. |
| LinkedIn source data | Benedict's LinkedIn data export (Positions.csv, Projects.csv, Skills.csv, Profile.csv) in `~/.profile-sync/linkedin-export/` | Exact text for all positions and projects; no browser automation, no ToS risk. |

## 3. Architecture

```
~/.claude/skills/profile-sync/          global skill (any cwd)
  SKILL.md                              orchestration: modes, gates, subagent prompts, allowed-tools
  scripts/harvest.py                    all sources -> ledger; Python 3.9 stdlib only; --selftest
  scripts/redact.py                     shared scrubber; imported by harvest, callable standalone
  reference/sources.md                  per-source recipe, watermark key, evidence grade
  reference/anonymise.md                client denylist + replacement descriptors
  reference/pr-template.md              PR title/body skeleton
  reference/config.example.json         identities, profiles, regions, roots, exclusions

~/.profile-sync/                        local state; never inside any git repo
  config.json                           copied from the example, filled once
  ledger.jsonl                          one redacted evidence line per item
  watermarks.json                       { "<source>:<scope>": <cursor> }
  runs/<YYYY-MM-DD>/dossier.md          claims + evidence refs + skipped sources
  runs/<YYYY-MM-DD>/status.json         { status: ok | nothing-new | failed, reason, pr }
  logs/profile-sync.log                 cron output with start/exit stamps
  lock                                  PID lock

bpabatao.github.io/                     public repo
  src/data/content.ts                   canonical profile; the only file the LLM edits
  scripts/render-resume.ts              content.ts -> resume/resume.html -> public/resume.pdf
  scripts/docx.py                       resume model -> resume/resume.docx (stdlib zipfile writer)
  scripts/render-linkedin.ts            content.ts -> linkedin/*.txt
  scripts/check-profile.ts              invariants + ATS lint + denylist + token-shape scan
  linkedin/                             committed paste-pack
  docs/superpowers/specs/               this spec
```

Renderers run as `node scripts/<name>.ts`.
Node 22.22 strips types natively (verified 2026-08-28), so no new npm dependency.
The PDF is printed by the installed Google Chrome (`--headless=new --print-to-pdf --no-pdf-header-footer`); verified to reproduce the committed PDF byte-for-byte.
The deploy workflow keeps serving the committed `public/resume.pdf`; it gains one check step (section 11).

## 4. Data model

### 4.1 `content.ts` - the canonical profile

Additions and changes to the existing typed exports.
Everything that is hardcoded in components today moves here and the components read it.

```ts
export const profile = {
  name: "Benedict Pabatao",
  role: "Staff Software Engineer",
  headline: "Staff Software Engineer, Platform & Product | Multi-tenant SaaS | AWS · Terraform · TypeScript · agentic tooling",
  summary,                              // exists today; reworded once at --init; shared by hero, resume, LinkedIn About
  statusLine,                           // exists today, unused; Hero.tsx reads it after --init
  thesis,                               // exists today, unused; Hero.tsx reads it after --init
  location: "Italy (Remote)",
  availability: "STAFF/LEAD PLATFORM ROLES · CONSULTING · AWS / TERRAFORM / MULTI-TENANT",
  updated: "2026-08-28",                // ISO date; drives Contact.tsx label, PDF metadata, LinkedIn pack header
  atsKeywords: ["Staff", "REST", "Python", "Kubernetes", "Terraform", "AWS", "TypeScript", "multi-tenant", ...],
  email, github, linkedin, siteUrl,     // unchanged
} as const;

export interface Position { title: string; period: Period }   // promotion history inside one employer

export interface Job {
  id: string;                           // stable key: "hth", "nmblr", "basemap", ...
  company: string;
  role: string;                         // latest title; equals positions[0].title when positions exist
  period: { start: "2023-05", end: "2024-02" | null };   // "YYYY-MM" or "YYYY" when the month is unknown; null = Present
  location?: string;
  employmentType?: "Contract" | "Full-time" | "Freelance";
  positions?: Position[];               // newest first, e.g. Staff (2025-09 - Present), Senior Full-Stack (Cloud) (2023-05 - 2026-01)
  receipts: string[];                   // site + LinkedIn bullets
  resumeReceipts?: string[];            // resume-only overlay; defaults to receipts
  stack?: string[];
}

export interface SecondaryProject {
  title: string;
  description: string;
  url?: string;
  period?: Period;                      // LinkedIn project dates
  jobId?: string;                       // "Associated with" employer
  linkedin?: false;                     // exclude from the paste-pack
}

// stackGroups entries gain an optional flag:
{ title: "Practices", span: 1, items: [...], resumeOnly: true }
```

`fleetPortals` entries gain a short `key` (`"delta"`, `"mvu"`, ...) so `diagrams.tsx` can derive its tenant list from them.
`flagships`, `cases`, `credentials`, `secondaryProjects`, `principles` are unchanged.
`metrics` becomes derived where a number is derivable: `tenant portals` = `fleetPortals.length` (7 today; the literal said 8); the others stay literal.
`profile.statusLine` renders the same derived count: `OPERATIONAL - 7 TENANTS · AWS · REMOTE (ITALY)`.
`currentJobs[hth].company` is `"ESC Partners / HometownHUB"`.
`profile.summary` is rebuilt once at `--init` from the LinkedIn About lead sentence followed by the resume metrics sentence, with "Staff" replacing "Lead".

Component wiring done at `--init`:

| Hardcoded today | Reads after `--init` |
|---|---|
| `Hero.tsx:13` status line | `profile.statusLine` |
| `Hero.tsx:18-21` thesis | `profile.thesis` |
| `Contact.tsx:13-14` availability | `profile.availability` |
| `Contact.tsx:30` "resume.pdf · jul 2026" | `profile.updated` formatted as `mon yyyy` |
| `layout.tsx:12-20` title/description | `profile.role`, `profile.summary` |
| `Footer.tsx:5` year | `new Date().getFullYear()` at build |
| `diagrams.tsx:72` tenant list | `fleetPortals.map(t => t.key)` |

### 4.2 Ledger - `~/.profile-sync/ledger.jsonl`

One JSON object per line, appended by the harvester, already redacted.

```
{
  "id": "bb:pr:esc-partners/myhub-api#812",
  "source": "bitbucket-pr" | "github-pr" | "git" | "jira" | "cloudtrail" | "pipeline" | "remember" | "memory" | "kb-log",
  "company": "hth" | "nmblr" | "personal",
  "repo": "myhub-api",
  "ts": "2026-08-14T09:12:00Z",
  "title": "feat(account): assertAccountOwner on linked accounts",
  "summary": "<= 500 chars, redacted",
  "ref": "https://bitbucket.org/esc-partners/myhub-api/pull-requests/812" | "/Users/.../today-2026-08-14.done.md",
  "grade": "A" | "B" | "C" | "D" | "E" | "F",
  "tags": ["idor", "cognito", "fastify"]
}
```

`ids` are deterministic so re-harvesting is idempotent.

### 4.3 Watermarks - `~/.profile-sync/watermarks.json`

Key is `<source>:<scope>`; value type depends on the source.

| Key example | Cursor |
|---|---|
| `github-pr:bpabatao` | ISO merged_at of newest item |
| `bitbucket-pr:myhub-api` | ISO updated_on |
| `git:hth/base-server` | commit SHA on the default branch |
| `jira:esc-partners` | ISO resolutiondate |
| `cloudtrail:hth:us-east-1` | ISO EventTime |
| `pipeline:bb:myhub-api` | ISO created_on |
| `remember:hth/myhub-api` | filename of newest `today-*.done.md` consumed |
| `memory:-Users-macbook-pro-projects-hth-myhub-api` | mtime |
| `kb-log:hth` | entry date |

A watermark advances only after the run reaches a terminal `ok` or `nothing-new` status.
A source that failed keeps its old watermark.

Two cursors, not one.
Harvest watermarks (above) say how far each source has been *read*.
A single `draft` cursor (`"draft": "2026-07-18T00:00:00Z"` at `--init`) says how far evidence has been *proposed*.
Each run drafts from ledger items with `ts` after the `draft` cursor and advances it on `ok` or `nothing-new`.
Items before the cursor are context for the drafter (it may cite them as supporting refs) but never the primary evidence of a new claim.

Backfill: `--init` ends with an interactive full-history harvest into the ledger, HtH from 2023-06 and Nmblr from 2024-03, with progress per source.
CloudTrail cannot backfill (90-day retention) and simply starts at the first run.
The backfill sets the harvest watermarks to their newest items; the `draft` cursor stays at 2026-07-18.

### 4.4 Evidence grades

| Grade | Source | May support |
|---|---|---|
| A | Merged PR authored by Benedict (author login/uuid verified) | Any claim |
| B | Commits by Benedict on the default branch (author matched against 3 identities) | Any claim |
| C | Jira issue assigned to Benedict, status Done/Closed/Resolved (assignee verified, `/standup` rule) | Any claim |
| D | CloudTrail events under Benedict's IAM identity, aggregated `service:action x count` per month | Operate/own claims only, never feature claims |
| E | Pipeline runs Benedict triggered | Deploy/release claims |
| F | `.remember` digests, memory notes, KB log entries | Context only; never sole support |

### 4.5 Claim - run-local

```
{
  "company": "hth",
  "target": "receipt" | "stack" | "metric" | "fleet" | "candidate-case" | "secondary-project",
  "jobId": "hth",
  "text": "final bullet, anonymised, Benedict's voice",
  "evidence": ["bb:pr:esc-partners/myhub-api#812", "git:hth/myhub-api:ab12cd3"],
  "grade": "A",
  "status": "proposed" | "needs-word" | "rejected",
  "reason": "why needs-word or rejected"
}
```

Rules per target:

- `receipt`: needs at least one A, B or C ref.
  Max 3 new receipts per job per run.
  The drafter prefers replacing a weaker existing bullet over appending; the PR shows the replaced text.
- `stack`: a technology must appear in at least 3 A/B items across at least 2 calendar months.
- `metric`: recomputed from data, not proposed; the only free-text metric changes go through `receipt`.
- `fleet`: a tenant go-live is proposed only with production pipeline success plus a public URL returning 200; it is always flagged "names a client - confirm".
- `candidate-case`: a theme with at least 5 A-grade items over at least 2 months; listed in the PR body only.
- `secondary-project`: items from the personal allow-list (`penagent`, `lexi-app`) become `needs-word` candidates for `secondaryProjects`; never `proposed` on their own.
- Any claim supported only by F evidence is `needs-word`.
- Any claim whose text matches the denylist after anonymisation is `rejected`.

## 5. Harvest sources

All recipes are read-only.
Each source is independently skippable.

| Source | Recipe | Identity check | Grade |
|---|---|---|---|
| GitHub PRs | `gh api "search/issues?q=is:pr+author:bpabatao+is:merged+merged:>WM" --paginate`; skip `bpabatao/*` repos whose name matches an `esc-partners` Bitbucket repo (mirrors) | `author.login == bpabatao` | A |
| Bitbucket PRs | `GET /2.0/repositories/esc-partners?role=member` then per repo `pullrequests?state=MERGED&q=author.uuid="<uuid>" AND updated_on>"WM"` | `author.uuid` from config | A |
| Git | For every repo under `~/projects/{hth,nmblr,personal}` deduped by remote URL; `git log WM..<default> --author=Pabatao --no-merges --format=%H%x09%aI%x09%s --name-only` | author email in identities | B |
| Jira | `GET /rest/api/3/search/jql` with `assignee = currentUser() AND resolved >= "WM" AND status in (Done, Closed, Resolved)` on `esc-partners.atlassian.net` and `hth.atlassian.net` | `assignee.accountId == self` | C |
| CloudTrail | `aws cloudtrail lookup-events --profile <p> --region <r> --lookup-attributes AttributeKey=Username,AttributeValue=<iam-user> --start-time WM`; aggregated per month | Username filter | D |
| Pipelines | Bitbucket `GET .../pipelines/?sort=-created_on` filtered on `creator.uuid`; `gh run list --repo Claroo-Ltd/nmblr-app --user bpabatao --status success --json` | creator/user | E |
| `.remember` | `today-*.done.md` newer than WM in the 16 known dirs plus new `## Week of` paragraphs in `archive.md`; company from path prefix | n/a | F |
| Memory | `~/.claude/projects/*/memory/*.md` with mtime > WM; company from `-hth-` / `-nmblr-` / `-personal-` in the encoded dir name; unmatched dirs skipped | n/a | F |
| KB log | `~/projects/hth/knowledge-base/wiki/log.md` entries with date > WM; company from `wiki/hth` vs `wiki/nmblr` in "Pages touched" | n/a | F |

Config (`~/.profile-sync/config.json`) holds: the three git identities, GitHub login, Bitbucket uuid, Jira account id, AWS `{profile, region[], iamUser}` list (`hth`: us-west-1, us-east-1, us-east-2, us-west-2; `nmblr`: us-east-2 - found in the infra repo and the earlier audit), repo roots, the backfill start per company (`hth: 2023-06`, `nmblr: 2024-03`), the exclusion list (`maya*`, `esc-ai-backend`, `email_delivery_report`, `knowledge-base-ccs`, `myhub-api-microservice-campaigns`, `autoresearch`, `plankton`, `hth-customer-portals`), the personal allow-list (`penagent`, `lexi-app`), and the `.remember` dir list.

Secrets: `harvest.py` reads `BITBUCKET_EMAIL`/`BITBUCKET_TOKEN` and `JIRA_EMAIL`/`JIRA_API_TOKEN` from the environment when present, else from Keychain items `profile-sync-bitbucket-token` and `profile-sync-jira-token` (`security find-generic-password -s <item> -w`).
`--init` writes those two items once with `security add-generic-password -U`.
Cron never sources `~/.zshrc`, so the Keychain path is the one that runs unattended; both `gh` (keyring) and the AWS IAM profiles already work from a cron-like environment (verified 2026-08-28).

`redact.py` removes, before any write: AWS access keys, Atlassian `ATAT*` tokens, GitHub `gh[pos]_*` tokens, JWT shapes, `password|passwd|secret|token` key-value pairs, emails other than Benedict's three, phone numbers, and AWS account ids not already masked.
Replacement text is `[redacted]`.

## 6. Run modes and pipeline

### 6.1 Modes

| Invocation | Behaviour |
|---|---|
| `/profile-sync` | Interactive. Up to 5 `needs-word` claims are asked via AskUserQuestion before the PR; the rest go to the PR block. |
| `/profile-sync --cron` | Unattended. No questions; `needs-word` claims land in the PR body. |
| `/profile-sync --dry-run` | Harvest + draft + verify + dossier. No repo writes, no watermark advance. |
| `/profile-sync --init` | One-time reconciliation PR (section 12), then the interactive full-history backfill. No evidence claims. |
| `/profile-sync --check-linkedin` | Interactive only. Diffs `linkedin/*.txt` against the newest LinkedIn data export in `~/.profile-sync/linkedin-export/` (Positions.csv, Projects.csv, Skills.csv, Profile.csv) and appends a drift list to the dossier; warns when the export is older than 60 days. A live browser read is a follow-up (section 14). |

### 6.2 Pipeline (cron and interactive)

1. Acquire `~/.profile-sync/lock`; exit if held.
2. `harvest.py` - all sources past their watermarks; per-source failures logged and marked skipped.
3. Select ledger items with `ts` after the `draft` cursor; if none is A, B or C: write `status: nothing-new`, advance the harvest watermarks for sources that succeeded and the `draft` cursor, exit 0.
4. Drafting: two subagents, one per company, each given only its company's ledger slice, the current `content.ts` entry for that job, `~/VOICE.md`, `reference/anonymise.md`, and the claim rules.
   Output is a JSON array of claims.
5. Verifier subagent: for every claim, confirm each evidence id exists in the ledger, the grade rule holds, no denylist term survives, no cross-company evidence, the text opens with a verb or a bolded verb-first lead, and a site receipt is under 220 characters (a resume overlay under 360).
   It returns the claim list with statuses.
6. Apply `proposed` claims to `content.ts` and set `profile.updated` to the run date (Edit tool, the only LLM file write in the repo).
7. `node scripts/render-resume.ts && python3 scripts/docx.py && node scripts/render-linkedin.ts`.
8. `node scripts/check-profile.ts && npm run build`.
   Any failure -> `status: failed`, no branch, watermarks untouched.
9. Branch `profile-sync/YYYY-MM-DD`; if a `profile-sync/*` PR is already open, check out that branch first and apply the edits on top of it instead (no rebase, no force).
10. Commit: `Profile sync: <n> receipts, <m> stack items (<from> - <to>)`, repo convention `Area: lowercase imperative`.
11. `git push origin profile-sync/...` and `gh pr create` (or `gh pr edit` when updating an open PR) from `reference/pr-template.md`.
12. Write `dossier.md` and `status: ok` with the PR URL; advance watermarks; release the lock.

### 6.3 PR body

- Summary line: date range, counts per company.
- Per claim: target, job, anonymised text, grade, count of supporting items ("A x2, B x5"), and for replacements the old text.
- `needs-word` block: claims that need Benedict's confirmation, with the question to answer.
- `candidate-case` block: themes worth a case study.
- Skipped sources with reason.
- Local dossier path.
- No private URLs, repo names of client repos, Jira keys, or client names.

## 7. Rendering contract

### 7.1 `render-resume.ts` -> `resume/resume.html`

- Template is today's `resume/resume.html` verbatim: same CSS, `@page A4 14mm 16mm`, section order Summary, Professional Experience, Earlier Experience, Technical Skills, Education.
- Single column, linear DOM equals reading order, no tables, no flex/grid columns, no text boxes, no images, no header/footer regions, system fonts only, real `h1/h2/h3/ul/li`.
- Current roles: `<h3>Title</h3>` then `.loc` with `<span class="co">Company</span> - Location | <span class="meta">dates</span>`.
- Earlier roles: `<h3>Title - Company (Location)</h3>` then `.loc` with `<span class="meta">dates</span>`.
- Dates render as `Mon YYYY - Mon YYYY`, `Mon YYYY - Present`, or `YYYY - YYYY` when a period has year-only precision; the renderer computes "Present" from `end: null`, and dates the latest title from `positions[0].period` when positions exist (the earlier position's range sits on the Previously line).
- Separators render as ASCII ` | ` in the resume; the site keeps `·`.
- Bullets come from `resumeReceipts ?? receipts`.
- Skills render every `stackGroups` entry including `resumeOnly` ones as `<p><b>Title:</b> items</p>`.
- `<title>` is `${name} - ${role}`; `<meta name="author">` is set so PDF metadata is correct.
- Then prints `public/resume.pdf` via Chrome headless and records the page count.

### 7.2 `docx.py` -> `resume/resume.docx`

- Python 3.9 stdlib `zipfile` writer producing `[Content_Types].xml`, `_rels/.rels`, `word/document.xml`, `word/styles.xml`, `word/numbering.xml`.
- Real `Heading1/Heading2/Heading3` paragraph styles and a real bullet numbering definition; bold runs for the lead phrase of a bullet.
- Same section order and text as the HTML; Letter or A4 selected by a `--page` flag, default A4.
- `textutil -convert docx` was evaluated and rejected: it flattens lists to plain paragraphs and emits no heading styles (verified 2026-08-28).

### 7.3 `render-linkedin.ts` -> `linkedin/`

| File | Source | Limit |
|---|---|---|
| `headline.txt` | `profile.headline` | 220 chars |
| `about.txt` | `profile.summary` + first receipts of current jobs | 2600 chars |
| `experience-<jobId>.txt` | one per job, current and earlier: each position (title, company, employment type, dates, location), bullets under the latest position | 2000 chars per description |
| `skills.txt` | flattened `stackGroups` items, deduplicated | 100 entries (LinkedIn's maximum) |
| `projects-<slug>.txt` | one per `flagships` entry (title, outcome, ownership, stack, link to `/case/<slug>/`) and one per `secondaryProjects`/`earlierProjects` entry with `linkedin !== false` (title, dates, "Associated with", description, url) | 2000 chars |

Each file starts with a one-line header `# updated <profile.updated> - paste into LinkedIn > <section>`.

### 7.4 `check-profile.ts`

Fails with a non-zero exit on any of:

- `content.ts` diff, `linkedin/*.txt` or `resume/resume.html` contains a denylist term outside the user-curated `fleetPortals` block, or a token/secret shape.
- Rendered resume contains `<table`, `<img`, `column-count`, `position: absolute`, `@font-face`, or a heading outside the allowed set.
- Any date fails `^([A-Z][a-z]{2} )?\d{4} - (([A-Z][a-z]{2} )?\d{4}|Present)$`.
- A resume bullet exceeds 360 characters (about three printed lines) or a site receipt exceeds 220.
  Verb-first is enforced by the verifier on new claims only, so existing bullets such as "One of 3 core engineers..." are not rejected by the linter.
- PDF page count exceeds 2.
- Any `profile.atsKeywords` entry is missing from the rendered resume text.
- Any LinkedIn file exceeds its limit.
- A `cases[].slug` has no entry in the `diagrams` map, or a `flagships[].slug` has no matching case.
- `profile.updated` is not today's date when run by the skill (skipped in CI).

## 8. Safety

- Public-repo boundary: ledger, dossier and config never leave `~/.profile-sync/`; the PR body is anonymised; `check-profile` scans the diff; `redact.py` runs on ingest; the existing `secrets-guard.sh` PreToolUse hook runs on every write.
- Company isolation: the HtH and Nmblr drafters never see each other's evidence; the verifier rejects any claim citing both.
- Read-only externals: `gh api` GET, `curl` GET, `aws cloudtrail lookup-events`, `git log`, `gh run list` only.
  Writes are limited to `~/.profile-sync/`, the `profile-sync/*` branch, and `gh pr create|edit`.
- `allowed-tools` in SKILL.md whitelists exactly those commands plus `Edit` on `src/data/content.ts`; `git push origin main` is not on the list and the `deploy-guard` hook asks anyway.
- Never force-push; never delete branches; never merge.
- Never write to Jira, Confluence or Bitbucket: no issue create/edit/transition/comment/worklog, no page create/update, no PR create/approve/merge/comment, no pipeline trigger. The Atlassian tokens are full-permission, so the skill reaches them only through GET requests in `harvest.py` and lists the Atlassian MCP servers under `disallowed-tools`.
- Attribution: A requires author match, C requires assignee match, colleague repos are excluded, F-only claims are `needs-word`.
- Cron hygiene: PID lock, `--max-turns 40`, `--max-budget-usd 5`, start and exit stamps in the log, `status.json` per run, and a 14-day staleness warning in interactive runs.

## 9. Error handling

| Failure | Behaviour |
|---|---|
| A source returns 401/403, SSO expired, network error | Log, mark `skipped` in dossier and PR, keep its watermark, continue. |
| No A/B/C items in the delta | `nothing-new`, no PR, watermarks advance for succeeded sources. |
| Verifier rejects every claim | `nothing-new`, rejected claims kept in the dossier, watermarks advance. |
| `check-profile` or `npm run build` fails | `failed`, no branch, watermarks untouched, next run retries the same delta. |
| Chrome PDF print fails | PR opens with HTML and docx; PR body flags "PDF not regenerated". |
| `docx.py` fails | Same as PDF: flag, do not block. |
| Open `profile-sync/*` PR with commits by Benedict | New run checks out that branch and commits on top; if `content.ts` edits cannot apply cleanly -> `failed` with the conflicting section listed. |
| Lock held | Exit 0 with "another run in progress". |
| `claude -p` hits max turns | Cron log shows the exit; `status.json` stays at the last written state; the next run resumes from watermarks. |

## 10. Testing

- `harvest.py --selftest`: fixtures under `scripts/fixtures/` for each parser (GitHub search JSON, Bitbucket PR and pipeline JSON, Jira search JSON, CloudTrail events JSON, a `.remember` day file, an `archive.md` week, a KB `log.md` excerpt, a memory note); expected ledger lines; redaction cases where each token shape must vanish; watermark advance and no-advance cases; identity mismatch produces no A/C item.
  Plain `assert`, same shape as `~/vaults/bin/worklog.py --selftest`.
- `render-resume.ts --golden`: renders from `content.ts` and byte-compares with the committed `resume/resume.html`; a diff means someone hand-edited the output.
- `docx.py --selftest`: unzips its own output and asserts heading styles, numbering, and no tables.
- `render-linkedin.ts --selftest`: limits enforced, header line present.
- `check-profile.ts --selftest`: negative fixtures (table, missing keyword, bad date, client name, oversize LinkedIn file, unmapped slug) each fail; the real repo passes.
- First end-to-end: `/profile-sync --dry-run` on live sources, dossier reviewed by Benedict before the crontab line is installed.
- `npm run check` = `node scripts/check-profile.ts`; `npm run render` = the three renderers in order.

## 11. Scheduling and operations

Crontab entry, mirroring the existing knowledge-base job:

```
# profile-sync - weekly Monday 08:30 local, after the 08:13 KB job.
30 8 * * 1 cd /Users/macbook-pro/projects/personal/bpabatao.github.io && { /bin/date -u +'===== start \%Y-\%m-\%dT\%H:\%M:\%SZ'; /Users/macbook-pro/.local/bin/claude -p "/profile-sync --cron" --max-turns 40 --max-budget-usd 5; echo "===== exit $?"; } >> /Users/macbook-pro/.profile-sync/logs/profile-sync.log 2>&1
```

No `--model` flag: the run uses the account default (Fable 5 today), capped at $5 and 40 turns.

Why not the alternatives: Desktop routines need the app awake; Cloud Routines run on a fresh clone with no local evidence; session `/loop` dies with the session.

`deploy.yml` gains one step before `npm run build`: `node scripts/check-profile.ts --ci`, so a hand edit that drifts the resume fails CI.

Renewals Benedict owns: `aws sso login --profile claude-sso` is not needed (the skill uses the `hth` and `nmblr` IAM profiles); `BITBUCKET_TOKEN` and `JIRA_API_TOKEN` expire per Atlassian policy and surface as `skipped` sources.

## 12. `--init` reconciliation (one PR, no evidence claims)

0. Import Benedict's LinkedIn data export (`~/.profile-sync/linkedin-export/*.csv`): LinkedIn wins for titles, dates, employment types, locations and the project list. Known deltas: HtH starts 2023-05 with positions Staff Software Engineer, Platform & Product (2025-09 - Present) and Senior Full-Stack Engineer (Cloud) (2023-05 - 2026-01); BaseMap Inc becomes its own earlier role (Senior Software Engineer, Full-time, 2022-03 - 2022-09, Washington, USA / Remote) and CoDev keeps the internal-portal work; Ordermentum is "Full Stack Software Engineer" (Contract, New South Wales, Australia / Remote); Nmblr is Contract, "London, UK (Remote)". Projects gain `period` and `jobId` from Projects.csv; site-only projects stay and are listed in the PR body; LinkedIn-only projects are added. The "Tenant Go-Lives" description loses its client names ("Primary engineer on four tenant launches; core contributor on two").
1. Extend `content.ts` per section 4.1; convert `Job.period` to the structured form; add `id` to every job; set `company` to "ESC Partners / HometownHUB" for the HtH role.
2. Apply the Staff headline; rebuild `profile.summary` from the LinkedIn About lead sentence plus the resume metrics sentence (Benedict's own words).
3. Replace the tenant name list in the HtH resume bullet with "8 utility tenants"; `fleetPortals` keeps its entries and gains `key`.
4. Merge resume-only skills into `stackGroups` (Kubernetes, OpenSearch, Python, REST APIs, S3, VPC, ALB, Elastic Beanstalk) and add the `Practices` group as `resumeOnly`.
5. Wire the seven hardcoded component strings (section 4.1 table); tenant count derives from `fleetPortals.length`.
6. Fix `diagrams.tsx` tenant list to derive from `fleetPortals` (removes the stale `ipu`).
7. Add the renderers, `docx.py`, `check-profile.ts`, `npm run render|check`, the CI step, and the repo `CLAUDE.md` (SSOT rule, never hand-edit generated files, `npm run render && npm run check`, changes arrive via `profile-sync/*` PRs).
8. Prove `render-resume` reproduces the current resume structure: the PR shows the diff between the hand-written and rendered `resume.html`, expected to differ only in the Staff headline, the summary, the anonymised tenant list, ASCII separators, month-precision dates, and merged skills.
9. Regenerate `public/resume.pdf` (A4) and add `resume/resume.docx`, `linkedin/` (including the three project files).
10. Fix the stale "+ Motion" line in `README.md`.
11. Write `~/.profile-sync/config.json`, store the two Atlassian tokens in Keychain, set the `draft` cursor to `2026-07-18`.
12. Open the PR, then run the interactive full-history backfill (HtH from 2023-06, Nmblr from 2024-03) with per-source progress; CloudTrail is noted as not backfillable.

Settled in advance, so the PR asks nothing: headings stay two-tier; A4 default; overlays kept; two-page target.

## 13. SKILL.md outline

```yaml
---
name: profile-sync
description: Use when updating the portfolio site, resume, or LinkedIn pack from real work evidence (PRs, commits, Jira, CloudTrail, pipelines, session digests), or when asked to sync the profile, refresh the resume, or run the weekly profile sync. Opens a PR; never pushes to main.
argument-hint: "[--cron | --dry-run | --init | --check-linkedin]"
allowed-tools:
  - Read
  - Edit(src/data/content.ts)
  - Write(/Users/macbook-pro/.profile-sync/**)
  - Bash(python3 /Users/macbook-pro/.claude/skills/profile-sync/scripts/harvest.py *)
  - Bash(security find-generic-password *)
  - Bash(security add-generic-password *)
  - Bash(node scripts/render-resume.ts *)
  - Bash(python3 scripts/docx.py *)
  - Bash(node scripts/render-linkedin.ts *)
  - Bash(node scripts/check-profile.ts *)
  - Bash(npm run build)
  - Bash(git status *)
  - Bash(git checkout -b profile-sync/*)
  - Bash(git checkout profile-sync/*)
  - Bash(git add *)
  - Bash(git commit *)
  - Bash(git push origin profile-sync/*)
  - Bash(gh pr list *)
  - Bash(gh pr view *)
  - Bash(gh pr create *)
  - Bash(gh pr edit *)
---
```

## 13.1 Implementation phases (for the plan)

1. Repo side: `content.ts` extensions, component wiring, renderers, `docx.py`, `check-profile.ts`, npm scripts, CI step, golden and negative tests, the `--init` PR.
2. Skill side: `harvest.py` + `redact.py` with fixtures and `--selftest`, `config.json`, SKILL.md with drafter and verifier prompts, PR template.
3. Operations: `/profile-sync --dry-run` reviewed, first real `/profile-sync` PR merged, then the crontab line.

Phase 1 is independently valuable (no more drift) and can merge before phase 2 exists.

Body sections: purpose and gate; modes; the pipeline as numbered steps with the exact commands; drafter prompt; verifier prompt; PR body rules; what to do on each failure; the "never" list (no push to main, no force-push, no client names, no cross-company bullets, no F-only claims as proposed).

## 14. Follow-ups (not in this spec)

- Recruiter-appeal audit and redesign of the site: own brainstorm and spec after this ships.
- Spike: live LinkedIn read through the chrome-devtools MCP attached to the logged-in Chrome, so `--check-linkedin` no longer needs a fresh data export.
- Transcript mining (`*.jsonl`) once `.remember` proves insufficient; consider raising `cleanupPeriodDays` from 30 first.
- Re-point the Atlassian MCP connector to `https://mcp.atlassian.com/v1/mcp` (SSE endpoint deprecated).
- Fix the GitHub MCP plugin (`GITHUB_PERSONAL_ACCESS_TOKEN` unset); not needed by this skill, which uses `gh`.
- `--backfill` audit of existing bullets against the full ledger (lists bullets with no evidence found); not requested now.

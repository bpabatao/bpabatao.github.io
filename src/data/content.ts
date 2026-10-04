export interface Period {
  /* "YYYY-MM", or "YYYY" when the month is unknown; end null = Present */
  start: string;
  end: string | null;
}

/* Tenant portals live in production on the core API.
   Public production URLs only - internal/test domains never ship here.
   One signed tenant intentionally absent until it launches.
   `key` feeds the case-study diagram; tenant count everywhere derives from this list. */
export const fleetPortals: { key: string; tenant: string; url: string }[] = [
  { key: "delta", tenant: "Delta Utilities", url: "https://mydu.com" },
  { key: "mvu", tenant: "MVU", url: "https://mvumobile.com" },
  { key: "nep", tenant: "NEP", url: "https://mynationwideenergypartners.com" },
  { key: "delco", tenant: "DelCo Water", url: "https://delcowaterportal.com" },
  { key: "alexrenew", tenant: "Alex Renew", url: "https://myalexrenew.com" },
  { key: "carmel", tenant: "Carmel Utilities", url: "https://mycarmelutilities.com" },
  { key: "aruba", tenant: "Web Aruba", url: "https://webcare.webaruba.com" },
];

const MARKETS = "US and EU teams";

export const profile = {
  name: "Benedict Pabatao",
  /* canonical title: <title>, OG, JSON-LD, PDF Title and the current hth position all read this */
  role: "Staff Software Engineer, Platform & Product",
  headline:
    "Staff Software Engineer, Platform & Product | AWS · Terraform · TypeScript",
  thesis: { lead: "I build the platform", tail: "other engineers", accent: "ship on." },
  summary:
    "I build multi-tenant SaaS platforms end to end - the Terraform that provisions them, the API they run on, and the product customers actually use. Staff Software Engineer - 8+ years in software, 5+ hands-on with AWS, and 3+ years building and operating cloud platforms: from AWS infrastructure-as-code to the shared backend services an entire product fleet runs on.",
  resumeSummary:
    `Staff Software Engineer with 8+ years in software (5+ on AWS), the last 3+ on a multi-tenant SaaS platform behind ${fleetPortals.length} live utility client portals, where I am now the most senior hands-on engineer. I am the primary author of its core REST API, both generations, and of the Terraform control-plane the fleet is migrating onto. I also run it: CI/CD, observability, incident response, security remediation and cost.`,
  location: "Italy (Remote, CET)",
  workAuthorization: "EU work authorization",
  availability: "Open to Staff / Lead platform and product engineering roles, and consulting.",
  /* The hero gets one sentence; `summary` is the long form for LinkedIn and the resume block. */
  heroLine: "The Terraform that provisions a multi-tenant utility SaaS, the API it runs on, and the product customers use - built and operated end to end.",
  availabilityLine: `Open to Staff / Lead platform and product engineering roles · Remote from Italy (CET), async-first · EU work authorization · ${MARKETS}`,
  /* LinkedIn About, written in his own plainer voice; renderer uses it verbatim */
  linkedinAbout: "I'm a Staff Software Engineer working remotely from Italy. For the last three years I've been the most senior hands-on engineer on a multi-tenant SaaS platform that runs the customer portals for 7 utility companies.\n\nI wrote most of what it runs on: 58% of the original API, 76% of its second generation, and 93% of the Terraform control-plane the fleet is moving onto. I also keep it running - pipelines, monitoring, incidents, security fixes and the AWS bill.\n\nThe part I care about most is the unglamorous work that lets a small team move fast without breaking things. Decisions get written down (I've authored 17 architecture decision records there). Standards live in the pipeline, not in review comments. Risky fixes ship behind a flag and get switched on one tenant at a time.\n\nI'm also one of three core engineers at Nmblr, an ISO 27001-certified strategy platform for biopharma, where I built the strategy clone engine, the archive/restore system and the observability layer.",
  markets: MARKETS,
  updated: "2026-10-04",
  atsKeywords: ["Staff", "REST", "Python", "IAM", "Terraform", "AWS", "TypeScript", "multi-tenant", "OAuth", "CI/CD", "React", "Node", "GraphQL", "IDOR"],
  email: "jajapabatao@gmail.com",
  github: "https://github.com/bpabatao",
  linkedin: "https://linkedin.com/in/benedict-pabatao",
  siteUrl: "https://bpabatao.github.io",
} as const;

/* Tenants under the platform, launched and in onboarding. `fleetPortals` stays the
   public, nameable subset (the launched ones); this is the fleet the work spans. */
export const fleetSize = 11;

export const metrics = [
  { value: `${fleetPortals.length} live`, label: `${fleetSize}-tenant fleet` },
  { value: "93%", label: "control-plane, primary author" },
  { value: "2", label: "core API generations, primary author" },
  { value: "43x", label: "faster sessions view (102s to 2.4s)" },
] as const;

/* Promotion history inside one employer, newest first. */
export interface Position {
  title: string;
  period: Period;
}

export interface Job {
  id: string;
  company: string;
  /* resume-only descriptor rendered after the company name */
  tagline?: string;
  /* latest title; equals positions[0].title when positions exist */
  role: string;
  period: Period;
  location?: string;
  employmentType?: "Contract" | "Full-time" | "Freelance" | "Internship";
  /* exclude from the resume; the site and the LinkedIn pack still show it */
  resume?: false;
  positions?: Position[];
  /* site + LinkedIn bullets; may open with a **lead** marker */
  receipts: string[];
  /* site: receipts[0] is the role's lede line, rendered above the bullets rather than as one */
  lede?: true;
  /* site: bullets shown before the fold (after the lede); the rest fold behind "show N more" */
  visible?: number;
  /* resume-only overlay; defaults to receipts */
  resumeReceipts?: string[];
  /* LinkedIn-only description: an intro paragraph then bullets; defaults to receipts */
  linkedin?: { intro: string; bullets: string[] };
  stack?: string[];
}

export const currentJobs: Job[] = [
  {
    id: "hth",
    company: "ESC Partners / HometownHUB",
    tagline: "multi-tenant utility customer-portal SaaS",
    role: profile.role,
    period: { start: "2023-05", end: null },
    location: "New York, USA (Remote)",
    employmentType: "Contract",
    positions: [
      { title: profile.role, period: { start: "2025-09", end: null } },
      { title: "Senior Full-Stack Engineer (Cloud)", period: { start: "2023-05", end: "2025-08" } },
    ],
    lede: true,
    visible: 6,
    /* LinkedIn-only copy, plainer voice (Benedict, 2026-10-04); same audited facts as receipts */
    linkedin: {
      intro: "I'm the most senior hands-on engineer on a small team running a multi-tenant platform for utility customer portals. I set the standards, write the decision records, and own our AWS access in Terraform.",
      bullets: [
        "Wrote most of the core API, both generations: 58% of v1, which still serves six of the seven live tenants, and 76% of v2, which has served the seventh since June 2026.",
        "Wrote 93% of our internal developer platform, a Terraform control-plane (9 stacks, about 60 AWS resource types) with a small dashboard on top. The fleet is moving onto it one tenant at a time.",
        "Authored 17 architecture decision records, 13 accepted. Moved standards out of code review and into pre-push and pipeline checks. Approved 135 of my teammates' PRs in 2026.",
        "Fixed an account-takeover gap in SSN verification that matched the wrong person on about 2.4% of one tenant's accounts: attempt lockout plus a ZIP check, behind a flag so each tenant switches it on when ready.",
        "Took the sessions view from 102 seconds to 2.4 with one composite index.",
        "Ran remediation across 6 external pentest rounds: 60 findings triaged and false positives pushed back on, from IDOR to missing rate limits.",
        "Built a duplicate-login reconciler that treats the billing system as the source of truth. It runs read-only every day and refuses to act on stale data, which is how it caught a feed that had been frozen for about two months.",
        "Run the AWS side day to day: CI/CD, CloudWatch and cost tracking.",
      ],
    },
    receipts: [
      "Most senior hands-on engineer on a small product team: set the standards the fleet adopts, own the team's AWS access as Terraform.",
      "Primary author of both generations of the fleet's core API and the auth and Oracle CCS patterns they share - 58% of v1, serving six of the seven launched tenants; 76% of v2, serving the seventh since June 2026.",
      "Primary author (93%) of the internal developer platform: a Terraform control-plane (9 stacks, ~60 AWS resource types) with a Fastify/React dashboard, onto which the fleet's provisioning is migrating tenant by tenant.",
      "Authored 17 architecture decision records (13 accepted); turned standards into gates - pre-push and pipeline verify checks, a lint rule instead of trusting review - and approved 135 PRs from teammates in 2026.",
      "Shipped the fix for an SSN identity-verification gap enabling account takeover - wrong-person matches on ~2.4% of one tenant's accounts - as attempt lockout plus ZIP disambiguation, flag-gated for per-tenant rollout.",
      "Built a billing-authoritative duplicate-login reconciler, dry-run by default, with a daily read-only prod sweep on Fargate in Terraform; it fails closed on a stale login-usage feed, found frozen for about 2 months.",
      "Remediated pentest findings in severity-labelled batches across 6 external test rounds - 60 findings triaged, false positives refuted - from IDOR and unauthenticated endpoints to URL-borne tokens and missing rate limits.",
      "Primary platform engineer for the multi-tenant AWS fleet - production and test - running CI/CD, CloudWatch observability, FinOps tooling, a shared ALB and Fargate Spot on the test fleet.",
      "Built and pruned the team's AI tooling: kept the Claude PR reviewer in CI across the API and portal repos, shelved the Bedrock auto-fix on evidence, shipped the knowledge-base agent.",
      "Built the runtime feature-flag platform: a database-backed reader replacing build-time env vars, SSE push with fail-open, wired into 6 v1 admin consoles and 4 portals, shipped flag-gated per tenant with parity tests.",
      "Deployed CloudWatch Synthetics canaries across tenant portals, admin consoles and APIs - 17 created in June 2026, running every 10 minutes - with failure alarms and canary status on the platform dashboard.",
      "Moved the observability store off a tenant's production database onto a shared cluster with IAM-role auth, no static password - zero-loss copy, go/no-go gate, soak - then dropped the 4.5M-doc original (11.75 GB).",
      "Remediated a tenant's web portal and native app against WCAG 2.1 AA - 32 audit findings on web, 21 native-app violations - labelled controls, live regions, focus states, contrast and keyboard paths on shared components.",
    ],
    resumeReceipts: [
      `**Primary author of the fleet's core REST API, both generations** - 58% of v1, which serves 6 of the ${fleetPortals.length} live tenants, and 76% of v2 (Fastify, TypeScript, Zod, MongoDB on ECS Fargate), in production for the seventh since June 2026; own the shared auth, data-access and Oracle CCS billing integration (OAuth 2.0).`,
      "**Primary author (93%) of the internal developer platform** - a Terraform control-plane (9 stacks, ~60 AWS resource types) with a Fastify/React dashboard that plans, applies and attributes cost; the fleet is moving onto it from per-portal provisioning, tenant by tenant.",
      "**Shipped the fix for an account-takeover gap in SSN verification** - last-four plus street matched the wrong person on ~2.4% of one tenant's accounts; added attempt lockout and ZIP-based disambiguation, flag-gated for per-tenant rollout.",
      "**Took the sessions view from 102s to 2.4s (43x)** with one composite index, as sole author of the audit and observability layer: outbound provider-call capture, tiered audit retention, an account-to-IP anomaly view and a takeover alert.",
      "**Cut CI from ~12 to ~7 min on the core API and ~10 to ~6 min on the admin portal** (esbuild, cache-mounted installs, fail-fast) while adding blocking Snyk gates (newer portals, both APIs) and keyless OIDC deploys on 4 repos.",
      `**Set engineering standards as primary platform engineer** for ${fleetSize} tenants across production and test (${fleetPortals.length} live) - 13 accepted ADRs, shared provisioning modules, pre-push and pipeline gates - and run the fleet: Bitbucket Pipelines, CloudWatch, incident response and cost (Cost Explorer attribution, a shared ALB, Fargate Spot on test).`,
      "**Ran remediation across 6 external pentest rounds** - triaged 60 findings into severity-labelled fix batches: IDOR, unauthenticated endpoints, URL-borne tokens, client-side privilege checks, missing rate limits.",
      "**Built, measured and pruned the team's AI tooling** - kept a Claude PR reviewer in CI across the API and portal repos, shipped a Bedrock knowledge-base agent (curated-first retrieval, flagged SQL fallback), and shelved a Bedrock auto-remediation service after 12 of 13 runs failed.",
      "**Built a runtime feature-flag platform and own the billing-to-payments reconciler** - MongoDB-backed flags replace build-time env vars across 6 admin consoles and 4 portals, per tenant; the reconciler (Oracle CCS vs Invoice Cloud) detects drift by default, repairs only when guarded, and replaced a batch sync I switched off.",
    ],
    stack: ["TypeScript", "Fastify", "React", "Terraform", "AWS", "MongoDB", "Oracle CCS"],
  },
  {
    id: "nmblr",
    company: "Nmblr",
    tagline: "Biopharma Strategy & Collaboration Platform",
    role: "Senior Full-Stack Engineer",
    period: { start: "2024-03", end: null },
    location: "London, UK (Remote)",
    employmentType: "Contract",
    visible: 5,
    /* LinkedIn-only copy, plainer voice (Benedict, 2026-10-04); same audited facts as receipts */
    linkedin: {
      intro: "One of three core engineers on an ISO 27001-certified strategy platform for biopharma, in private beta with enterprise pharma clients.",
      bullets: [
        "Built two subsystems from scratch: the engine that deep-clones an entire strategy, and the archive/restore system for the Edge module.",
        "Built our observability: one structured event per GraphQL operation, sent to CloudWatch and sorted into faults and noise, with dashboards for staging and prod. Then removed New Relic.",
        "Fixed two concurrent-write races: rating upserts now run behind a Postgres advisory lock, and a sync resolver no longer creates duplicate groups.",
        "Added per-strategy controls for the AI assistant that only internal strategy leads can change, and hardened the AI endpoints: per-user rate limits, no prompts in logs, no raw provider errors sent to the browser.",
        "Built the dependency checks that warn before you archive or delete something other records rely on, then carry the archive or restore through to them.",
      ],
    },
    receipts: [
      "One of 3 core engineers on an ISO 27001-certified biopharma strategy SaaS in private beta with enterprise pharma clients.",
      "Originated two subsystems from scratch: a schema-driven strategy clone engine and the Edge archive/restore isolation system.",
      "Built the in-house observability layer - an Apollo plugin emits one structured event per GraphQL operation to CloudWatch, classed as fault or noise, with staging and prod dashboards - then removed New Relic.",
      "Serialized rating upserts behind a Postgres advisory lock, killed a duplicate-groups race in a sync resolver, blocked re-entrant AI generation calls, and added double-press guards plus stale-poll reconciliation.",
      "Built per-strategy, per-user response controls for the AI assistant that only an internal strategy lead can set (clamped on read, refused on write otherwise), plus help-centre retrieval.",
      "Built the registry-driven data-dependency subsystem - GraphQL contract, resolver, modal - that warns before archiving or deleting finalised entities with dependents, then cascades the archive/restore across them.",
      "Hardened the AI endpoints - a per-user LLM rate limit, no prompt text in logs, and raw provider errors (which can quote an API key fragment) no longer returned to the browser.",
      "Contributed to real-time collaboration (GraphQL subscriptions), OpenAI-backed generation features, and platform security (OWASP/IDOR, JWT sessions).",
    ],
    resumeReceipts: [
      "**One of 3 core engineers, reporting to the CEO,** on an ISO 27001-certified biopharma strategy SaaS in private beta with enterprise pharma clients (React, TypeScript, Node, GraphQL, Prisma, AWS Elastic Beanstalk).",
      "**Originated two subsystems from scratch:** a schema-driven engine (Prisma DMMF) that deep-clones entire strategies, and the archive/restore isolation system for the Edge module.",
      "**Fixed two concurrent-write races:** rating upserts now run in a transaction behind a Postgres advisory lock, and a duplicate-row race in a GraphQL sync resolver is gone.",
      "**Built the in-house observability layer, then removed New Relic** - an Apollo plugin logs one structured event per GraphQL operation to CloudWatch, classed as fault, reject or noise; staging and production dashboards; Beanstalk logs in CloudWatch; Sentry hardened (tunnel, sourcemaps, gated replay).",
      "**Built the AI assistant's per-strategy response controls** - a mode only internal strategy leads can set - plus its Notion-backed knowledge base and AI-endpoint hardening.",
    ],
    stack: ["React", "TypeScript", "Node", "GraphQL", "Prisma", "PostgreSQL", "AWS", "Playwright"],
  },
];

export const earlierJobs: Job[] = [
  {
    id: "codev",
    company: "CoDev",
    tagline: "agency, embedded with BaseMap",
    role: "Senior Software Engineer",
    period: { start: "2022-03", end: "2023-05" },
    location: "Utah, USA (Remote)",
    employmentType: "Full-time",
    receipts: ["Agency engineer: built the internal talent-management portal, then embedded with client BaseMap on GIS hunting and fishing map features for a consumer GPS platform."],
    resumeReceipts: ["Built an internal talent-management portal (JavaScript, Docker); improved reliability through rapid, iterative issue resolution."],
    stack: ["JavaScript", "Docker"],
  },
  {
    id: "ordermentum",
    company: "Ordermentum",
    role: "Full-Stack Software Engineer",
    period: { start: "2022-09", end: "2023-03" },
    location: "NSW, Australia (Remote)",
    employmentType: "Contract",
    receipts: ["Built features for a wholesale food and beverage ordering and payments platform."],
    resumeReceipts: ["Built features for a wholesale food and beverage ordering and payments platform (Node.js, PostgreSQL, Docker, Kubernetes)."],
    stack: ["Node.js", "PostgreSQL", "Docker", "Kubernetes"],
  },
  {
    id: "hcl",
    company: "HCL Technologies",
    role: "Senior Software Engineer II",
    period: { start: "2020-02", end: "2022-04" },
    location: "New York, USA (Remote)",
    employmentType: "Full-time",
    receipts: ["Product features at scale on HCL DX; automated test suites; led code reviews."],
    resumeReceipts: ["Shipped product features at scale on HCL Digital Experience (Kubernetes-based); built and maintained automated test suites (Selenium) for unit, integration, and acceptance testing; led code reviews and knowledge transfer."],
    stack: ["Kubernetes", "Selenium"],
  },
  {
    id: "zencomputes",
    company: "Zencomputes",
    role: "Full-Stack Developer",
    period: { start: "2019-03", end: "2020-02" },
    location: "Singapore",
    receipts: ["Full-stack development, Singapore - deployed and ran the client applications on AWS Elastic Beanstalk."],
    resumeReceipts: ["Full-stack web development for studio and commerce clients (React, Node.js), deployed and operated on AWS Elastic Beanstalk."],
    stack: ["React", "Node.js", "AWS Elastic Beanstalk"],
  },
  {
    id: "halcyon",
    company: "Halcyon Digital Media Design",
    role: "Mobile Application Developer",
    period: { start: "2018-03", end: "2019-03" },
    location: "Philippines",
    receipts: ["Mobile applications, Philippines."],
    resumeReceipts: ["Built customer and rider mobile applications (Ionic)."],
    stack: ["Ionic"],
  },
  {
    id: "8layer",
    company: "8Layer Technologies",
    role: "Software Developer Internship",
    period: { start: "2017-11", end: "2018-03" },
    location: "Metro Manila, Philippines",
    employmentType: "Internship",
    resume: false,
    receipts: ["Software development internship."],
  },
];

export const credentials = [
  {
    period: "2014 - 2018",
    title: "BS Information Technology",
    detail: "Polytechnic University of the Philippines",
  },
] as const;

export interface Flagship {
  slug: string;
  /* Which job this shipped under; drives the LinkedIn "Associated with" line. */
  jobId: string;
  /* Only where the start month is known; LinkedIn projects take a date range. */
  period?: Period;
  /* Featured cases get a full card on the home page; the rest sit in the compact index below them. */
  featured?: boolean;
  title: string;
  outcome: string;
  ownership: string;
  stack: string[];
}

export const flagships: Flagship[] = [
  {
    slug: "core-api",
    featured: true,
    jobId: "hth",
    title: "Multi-Tenant Core API",
    outcome:
      "Two generations of the fleet's core API: per-tenant behavior composed from config, OAuth 2.0 into Oracle CCS, and authorization gates on every account endpoint.",
    ownership: "PRIMARY AUTHOR · 58% V1 / 76% V2",
    stack: ["Fastify 5", "TypeScript", "Zod", "MongoDB", "ECS Fargate"],
  },
  {
    slug: "control-plane",
    featured: true,
    jobId: "hth",
    title: "Terraform Control-Plane & IDP",
    outcome:
      "Nine Terraform stacks and a provisioning dashboard that turn tenant onboarding into a templated workflow - Cognito to CloudFront, WAF to KMS.",
    ownership: "PRIMARY AUTHOR · 93%",
    stack: ["Terraform", "Fastify", "React", "~60 AWS resource types"],
  },
  {
    slug: "ai-sdlc",
    jobId: "hth",
    title: "AI-Augmented SDLC",
    outcome:
      "Four AI tools built: a Claude reviewer kept where it earned its place, a Bedrock auto-fix shelved on measured evidence, a knowledge-base agent shipped, and a ticket-to-PR pipeline designed with human gates and not yet run live.",
    ownership: "SOLE AUTHOR",
    stack: ["AWS Bedrock", "Claude", "GitHub", "Jira"],
  },
  {
    slug: "nmblr",
    jobId: "nmblr",
    period: { start: "2024-03", end: null },
    title: "Biopharma Strategy Platform",
    outcome:
      "A schema-driven clone engine and a dependency-aware archive/restore system on an ISO 27001-certified strategy SaaS in private beta with enterprise pharma.",
    ownership: "1 OF 3 CORE ENGINEERS",
    stack: ["React", "TypeScript", "GraphQL", "Prisma", "PostgreSQL"],
  },
  {
    slug: "ccs-kb",
    jobId: "hth",
    title: "Billing-Data Knowledge Agent",
    outcome:
      "A Bedrock retrieval agent over utility billing systems: curated documentation first, generated SQL only behind a flag, and a prompt that refuses to claim something is absent.",
    ownership: "SOLE AUTHOR",
    stack: ["AWS Bedrock", "Fargate", "S3", "Oracle CCS", "TypeScript"],
  },
  {
    slug: "observability",
    jobId: "hth",
    featured: true,
    title: "Observability & Accountability",
    outcome:
      "Universal provider-call capture, deep-redacted on v2, tiered audit retention, account-to-IP anomaly views, and a takeover alert - so a small team can answer who did what.",
    ownership: "SOLE AUTHOR",
    stack: ["MongoDB", "CloudWatch", "WAFv2", "React"],
  },
  {
    slug: "identity",
    jobId: "hth",
    title: "Identity & Access",
    outcome:
      "Shipped a flag-gated fix for a registration takeover path, moved email and password changes off the browser on most portals, and put route permissions behind one declarative guard.",
    ownership: "PRIMARY AUTHOR",
    stack: ["AWS Cognito", "Oracle CCS", "Terraform", "IAM", "Fastify"],
  },
];

export interface SecondaryProject {
  title: string;
  description: string;
  url?: string;
  /* LinkedIn project dates */
  period?: Period;
  /* "Associated with" employer - a Job.id */
  jobId?: string;
  /* exclude from the LinkedIn paste-pack */
  linkedin?: false;
}

export const secondaryProjects: SecondaryProject[] = [
  {
    title: "Campaign Manager",
    description: "Multi-channel notifications - Twilio SMS + IVR voice and AWS SES email with CSV lists and templated messaging.",
    jobId: "hth",
  },
  {
    title: "CCS ↔ Invoice Cloud Reconciler",
    description: "Detection-only reconcile mode between two systems of record - scheduled Lambda, daily (4x for one tenant), per-tenant population queries, reasoned link verdicts.",
    jobId: "hth",
  },
  {
    title: "Bedrock Knowledge Base",
    description: "Built with a colleague. My part was the refresh and the platform side: a scheduled in-VPC Fargate task that re-ingests Oracle CCS product docs, per-client material and service-desk pages across four data sources, with alerts when it fails.",
    jobId: "hth",
  },
  {
    title: "Tenant Go-Lives",
    description: "Production go-live readiness for client launches across the fleet.",
    jobId: "hth",
  },
];

export const earlierProjects: SecondaryProject[] = [
  {
    title: "Ordermentum Wholesale Food and Beverage Online Ordering System",
    description: "Wholesale food and beverage ordering and payments platform (contract).",
    url: "https://ordermentum.com",
    period: { start: "2022-09", end: "2023-03" },
    jobId: "ordermentum",
  },
  {
    title: "HCL Digital Experience Content Composer",
    description: "Content authoring for the enterprise digital-experience platform - product features and test automation at scale.",
    url: "https://www.hcltechsw.com/dx/home",
    period: { start: "2020-02", end: "2022-03" },
    jobId: "hcl",
  },
  {
    title: "HCL Digital Experience Design Studio",
    description: "Page and layout design tooling for the enterprise digital-experience platform - product features and test automation at scale.",
    url: "https://www.hcltechsw.com/wps/portal/products/dx/home",
    period: { start: "2020-02", end: "2022-03" },
    jobId: "hcl",
  },
  {
    title: "Basemap Hunting and Fishing GPS Maps",
    description: "GIS mapping and hunting platform.",
    url: "https://www.basemap.com",
    period: { start: "2022-03", end: "2022-11" },
    jobId: "codev",
  },
  {
    title: "Hope Technik",
    description: "Click-and-collect AGV system - IoT mobile app driving a robotic arm to fetch shop supplies, with a web tracker for job completion (React, React Native, Python).",
    url: "https://www.hopetechnik.com/product/click-and-collect-system/",
    period: { start: "2019-03", end: "2020-02" },
    jobId: "zencomputes",
  },
  {
    title: "Soon Beng Huat Metal and Hardware Trading",
    description: "Web application for buying and selling metal scrap (React, Express).",
    period: { start: "2019-04", end: "2020-02" },
    jobId: "zencomputes",
  },
  {
    title: "Bambini International",
    description: "Photography, franchise and services web platform - portrait studio site and booking (React, Express).",
    url: "https://bambiniphoto.sg",
    period: { start: "2019-06", end: "2020-02" },
    jobId: "zencomputes",
  },
  {
    title: "CoDev Internal Portal",
    description: "Talent recruitment and management portal.",
    jobId: "codev",
  },
  {
    title: "Kickstart Express",
    description: "Package delivery mobile and web app for customers and riders, published on Google Play (Ionic, Adonis, AWS, Socket.io).",
    period: { start: "2018-10", end: "2019-03" },
    jobId: "halcyon",
  },
  {
    title: "Luckyah",
    description: "E-commerce marketplace app with raffles, messaging and a wallet on Android and iOS, published on Google Play (Ionic, Adonis, Socket.io).",
    period: { start: "2018-04", end: "2019-03" },
    jobId: "halcyon",
  },
  {
    title: "Sobida",
    description: "Offline truck-delivery report mobile app (Ionic, SQLite).",
    period: { start: "2018-05", end: "2018-07" },
    jobId: "halcyon",
  },
];

export interface StackGroup {
  title: string;
  span: 1 | 2;
  items: string[];
  /* LinkedIn skills only - the site and the resume omit it */
  linkedinOnly?: boolean;
}

/* One list for the site grid and the resume: each technology once, no sentences. */
export const stackGroups: StackGroup[] = [
  {
    title: "Cloud & IaC",
    span: 2,
    items: [
      "AWS - ECS Fargate, Lambda, CloudFront, Cognito, DynamoDB, EventBridge, ElastiCache, Secrets Manager, WAFv2, SES, S3, Route 53, VPC, ALB, IAM, Elastic Beanstalk",
      "Terraform",
      "Docker",
    ],
  },
  {
    title: "Platform & DevOps",
    span: 2,
    items: [
      "Internal Developer Platform",
      "Multi-tenant provisioning",
      "Bitbucket Pipelines · GitHub Actions",
      "OIDC deploys · Snyk",
      "FinOps - Cost Explorer",
    ],
  },
  {
    title: "Backend & Data",
    span: 2,
    items: [
      "Node.js - Fastify, Express",
      "TypeScript · Python",
      "REST APIs · GraphQL · Prisma",
      "PostgreSQL · MongoDB",
      "Zod · Vitest · Playwright",
      "Oracle Utilities CCS · Invoice Cloud",
    ],
  },
  {
    title: "Observability & Security",
    span: 1,
    items: [
      "CloudWatch · CloudWatch Synthetics",
      "Sentry",
      "Structured logging",
      "OWASP/IDOR · OAuth 2.0 · JWT",
      "Pentest remediation",
    ],
  },
  {
    title: "Frontend & AI",
    span: 1,
    items: [
      "React · Next.js",
      "MUI · Styled Components · Tailwind",
      "React Native (Expo)",
      "Accessibility (WCAG 2.1 AA)",
      "AWS Bedrock (Claude)",
      "AI code review in CI",
      "LLM knowledge bases (RAG)",
    ],
  },
  {
    title: "Practices",
    span: 1,
    linkedinOnly: true,
    items: ["Platform Engineering", "Infrastructure-as-Code (IaC)", "System Design & Architecture", "Security & Compliance", "Incident Response"],
  },
];

export interface Period {
  /* "YYYY-MM", or "YYYY" when the month is unknown; end null = Present */
  start: string;
  end: string | null;
}

/* Tenant portals live in production on the core API + control-plane.
   Public production URLs only - internal/test domains never ship here.
   [client] intentionally absent until it launches.
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

export const profile = {
  name: "Benedict Pabatao",
  role: "Staff Software Engineer",
  headline:
    "Staff Software Engineer, Platform & Product | Multi-tenant SaaS | AWS · Terraform · TypeScript · agentic tooling",
  thesis: { lead: "I build the platform", tail: "other engineers", accent: "ship on." },
  statusLine: `OPERATIONAL - ${fleetPortals.length} TENANTS · AWS · REMOTE (ITALY)`,
  summary:
    "I build multi-tenant SaaS platforms end to end - the Terraform that provisions them, the API they run on, and the product customers actually use. Staff Software Engineer - 8+ years in software, 5+ hands-on with AWS, and ~3 years leading cloud platforms: from AWS infrastructure-as-code to the shared backend services an entire product fleet runs on.",
  resumeSummary:
    `I build multi-tenant SaaS platforms end to end - the Terraform that provisions them, the API they run on, and the product customers actually use. Staff Software Engineer - 8+ years in software, 5+ hands-on with AWS, and ~3 years leading cloud platforms: from AWS infrastructure-as-code to the shared backend services an entire product fleet runs on. Near-sole author of a Terraform control-plane and internal developer platform that ships ${fleetPortals.length} multi-tenant client portals on ECS Fargate, and primary author (78%) of the core REST API those portals are built on. Operates ~$110K/year of multi-tenant portal infrastructure on AWS, turns it into self-service, and builds the products on it - full-stack from React/TypeScript through Node/GraphQL - not just the infrastructure they run on.`,
  location: "Italy (Remote)",
  availability: "STAFF/LEAD PLATFORM ROLES · CONSULTING · AWS / TERRAFORM / MULTI-TENANT",
  updated: "2026-08-28",
  atsKeywords: ["Staff", "REST", "Python", "Kubernetes", "Terraform", "AWS", "TypeScript", "multi-tenant", "OAuth", "CI/CD", "React", "Node", "GraphQL", "IDOR"],
  email: "jajapabatao@gmail.com",
  github: "https://github.com/bpabatao",
  linkedin: "https://linkedin.com/in/benedict-pabatao",
  siteUrl: "https://bpabatao.github.io",
} as const;

export const metrics = [
  { value: "8+", label: "years in software" },
  { value: String(fleetPortals.length), label: "tenant portals" },
  { value: "78%", label: "core API authorship" },
  { value: "$110K/yr", label: "AWS under management" },
] as const;

export const principles = [
  {
    lead: "Boring, proven tech.",
    tail: "Clever is what someone decodes at 3am. Standard library before a dependency, a dependency before a framework.",
  },
  {
    lead: "Root cause, not symptom.",
    tail: "Bugs get reproduced end to end before they get fixed. One guard in the shared path beats a patch in every caller.",
  },
  {
    lead: "Security is the default.",
    tail: "Every endpoint ships with authorization checks. IDOR is assumed possible until proven otherwise.",
  },
  {
    lead: "Smallest change that works.",
    tail: "Tight scope, flagged adjacencies, verified before commit. The best code is the code never written.",
  },
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
  /* resume-only overlay; defaults to receipts */
  resumeReceipts?: string[];
  stack?: string[];
}

export const currentJobs: Job[] = [
  {
    id: "hth",
    company: "ESC Partners / HometownHUB",
    role: "Staff Software Engineer, Platform & Product",
    period: { start: "2023-05", end: null },
    location: "New York, USA (Remote)",
    employmentType: "Contract",
    positions: [
      { title: "Staff Software Engineer, Platform & Product", period: { start: "2025-09", end: null } },
      { title: "Senior Full-Stack Engineer (Cloud)", period: { start: "2023-05", end: "2026-01" } },
    ],
    receipts: [
      `Primary author (78%) of the core API middleware connecting ${fleetPortals.length} utility tenant portals to Oracle CCS via OAuth 2.0 - the auth, data-access, and integration patterns the whole fleet is built on.`,
      "Sole author of the internal developer platform: a Terraform control-plane (9 stacks, ~60 AWS resource types) with a Fastify/React dashboard that self-service provisions every client environment.",
      "De-facto technical lead of a 5-engineer team, reporting to the COO/CEO - set the platform standards the fleet adopts.",
      "Own ~$110K/yr of AWS across the production and test fleet - CI/CD, Datadog/CloudWatch observability, and FinOps tooling driving right-sizing and Fargate-Spot savings.",
      "Built the team's AI tooling: Bedrock auto-remediation that opens fix PRs, a Claude PR reviewer in CI, and an agentic AI-SDLC pipeline with human approval gates.",
      "Owned production go-live readiness for 6 client launches.",
    ],
    resumeReceipts: [
      `**Primary author (78%) of the core REST API middleware** connecting ${fleetPortals.length} utility tenant portals to Oracle CCS via OAuth 2.0 - the multi-tenant auth, data-access, and integration patterns the whole fleet is built on.`,
      "**Sole author of the internal developer platform:** a Terraform control-plane (9 stacks, ~60 AWS resource types) with a Fastify/React dashboard that self-service provisions and ships every client environment - Cognito, ECS Fargate, CloudFront, WAFv2, Secrets Manager, Route 53, ElastiCache, KMS - turning tenant onboarding into a templated, repeatable workflow.",
      "**De-facto technical lead of a 5-engineer team** - most senior hands-on engineer, reporting to the COO/CEO; set the platform standards the fleet adopts (provisioning modules, CI/CD, security guardrails).",
      "**Designed and built a multi-channel campaign manager** integrating Twilio (SMS + IVR voice) and AWS SES (email) with CSV recipient lists and templated messaging, replacing manual notification workflows.",
      "**Built an automated batch pipeline** syncing multi-account customers between Oracle CCS and Invoice Cloud in 5K-record batches - idempotency checks, error tracking, and automated success/failure email reporting.",
      "**Built the team's AI-augmented developer tooling** - an AWS Bedrock auto-remediation service (Claude via bedrock-runtime) that triages alerts and opens fix PRs, an automated Claude PR-reviewer in CI, an agentic AI-SDLC pipeline (Jira + GitHub, with human approval gates), and an LLM-maintained knowledge base built with Python data pipelines.",
      `**Own and operate the multi-tenant portal infrastructure as sole platform engineer** - ~$110K/year of AWS across the ${fleetPortals.length}-tenant production and test fleet - with CI/CD (Bitbucket Pipelines), Datadog / CloudWatch observability, on-call incident response, and cost-attribution tooling (Cost Explorer API) driving right-sizing, shared-ALB, and Fargate-Spot savings.`,
      "**Owned production go-live readiness for 6 client launches** - primary engineer on four, core contributor on two - environment validation, deployment, rollback planning, and stabilization.",
    ],
    stack: ["TypeScript", "Fastify", "React", "Terraform", "AWS", "MongoDB", "Oracle CCS"],
  },
  {
    id: "nmblr",
    company: "Nmblr",
    tagline: "Biopharma Strategy & Collaboration Platform",
    role: "Senior Full Stack Engineer",
    period: { start: "2024-03", end: null },
    location: "London, UK (Remote)",
    employmentType: "Contract",
    receipts: [
      "One of 3 core engineers on an ISO 27001-certified biopharma strategy SaaS in private beta with enterprise pharma clients.",
      "Originated two subsystems from scratch: a DMMF-driven strategy clone engine and the Edge archive/restore isolation system.",
      "Contributed to real-time collaboration (GraphQL subscriptions), OpenAI-backed generation features, and platform security (OWASP/IDOR, JWT sessions).",
    ],
    resumeReceipts: [
      "One of 3 core engineers on an ISO 27001-certified biopharma strategy SaaS (React/TypeScript, Node/GraphQL/Prisma, AWS Elastic Beanstalk), reporting to the CEO; private beta with enterprise pharma clients.",
      "**Originated two subsystems from scratch:** a DMMF-driven strategy clone engine (automated deep-clone of entire strategies) and the Edge archive/restore isolation system.",
      "Contributed to real-time collaboration (GraphQL subscriptions), OpenAI-backed generation features, and platform security (OWASP/IDOR, JWT sessions).",
      "Added production observability - streamed Elastic Beanstalk logs to CloudWatch with enhanced health reporting - and contributed to CI/CD workflow tuning.",
    ],
    stack: ["React", "TypeScript", "Node", "GraphQL", "Prisma", "PostgreSQL", "AWS"],
  },
];

export const earlierJobs: Job[] = [
  {
    id: "codev",
    company: "CoDev",
    role: "Senior Software Engineer",
    period: { start: "2022-03", end: "2023-05" },
    location: "Utah, USA / Remote",
    employmentType: "Full-time",
    receipts: ["Internal talent-management portal; rapid, iterative issue resolution."],
    resumeReceipts: ["Built an internal talent-management portal (JavaScript, Docker); improved reliability through rapid, iterative issue resolution."],
  },
  {
    id: "ordermentum",
    company: "Ordermentum",
    role: "Full Stack Software Engineer",
    period: { start: "2022-09", end: "2023-03" },
    location: "New South Wales, Australia / Remote",
    employmentType: "Contract",
    receipts: ["Restaurant ordering and payment management for hospitality clients."],
    resumeReceipts: ["Designed and deployed a restaurant ordering and payment management system for hospitality clients (Node.js, PostgreSQL, Docker, Kubernetes)."],
  },
  {
    id: "basemap",
    company: "BaseMap Inc",
    role: "Senior Software Engineer",
    period: { start: "2022-03", end: "2022-09" },
    location: "Washington, USA / Remote",
    employmentType: "Full-time",
    receipts: ["GIS-based hunting and fishing mapping platform."],
    resumeReceipts: ["Built GIS-based hunting and fishing mapping features (JavaScript, Docker) on a consumer GPS-maps platform."],
  },
  {
    id: "hcl",
    company: "HCL Technologies",
    role: "Senior Software Engineer II",
    period: { start: "2020-02", end: "2022-04" },
    location: "New York, USA / Remote",
    employmentType: "Full-time",
    receipts: ["Product features at scale on HCL DX; automated test suites; led code reviews."],
    resumeReceipts: ["Shipped product features at scale on HCL Digital Experience (Kubernetes-based); built and maintained automated test suites (Selenium) for unit, integration, and acceptance testing; led code reviews and knowledge transfer."],
  },
  {
    id: "zencomputes",
    company: "Zencomputes",
    role: "Full Stack Developer",
    period: { start: "2019-03", end: "2020-02" },
    location: "Singapore",
    receipts: ["Full-stack development, Singapore."],
    resumeReceipts: ["Full-stack web development for studio and commerce clients (React, Node.js)."],
  },
  {
    id: "halcyon",
    company: "Halcyon Digital Media Design",
    role: "Mobile Application Developer",
    period: { start: "2018-03", end: "2019-03" },
    location: "Philippines",
    receipts: ["Mobile applications, Philippines."],
    resumeReceipts: ["Built customer and rider mobile applications (React Native)."],
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
  title: string;
  outcome: string;
  ownership: string;
  stack: string[];
}

export const flagships: Flagship[] = [
  {
    slug: "core-api",
    title: "Multi-Tenant Core API",
    outcome:
      `One API, ${fleetPortals.length} utility portals. OAuth 2.0 into Oracle CCS, per-tenant behavior composed from config, and authorization gates on every endpoint.`,
    ownership: "PRIMARY AUTHOR · 78%",
    stack: ["Fastify 5", "TypeScript", "Zod", "MongoDB", "ECS Fargate"],
  },
  {
    slug: "control-plane",
    title: "Terraform Control-Plane & IDP",
    outcome:
      "Nine Terraform stacks and a provisioning dashboard that turn tenant onboarding into a templated workflow - Cognito to CloudFront, WAF to KMS.",
    ownership: "SOLE AUTHOR",
    stack: ["Terraform", "Fastify", "React", "~60 AWS resource types"],
  },
  {
    slug: "ai-sdlc",
    title: "AI-Augmented SDLC",
    outcome:
      "Bedrock auto-remediation that opens fix PRs, a Claude reviewer in CI, and an agentic ticket-to-PR pipeline where humans keep every approval gate.",
    ownership: "SOLE AUTHOR",
    stack: ["AWS Bedrock", "Claude", "GitHub", "Jira"],
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
    title: "Nmblr",
    description: "Biopharma strategy and real-time collaboration platform - clone engine, archive/restore, GraphQL subscriptions.",
    url: "https://nmblr.co",
    period: { start: "2024-03", end: null },
    jobId: "nmblr",
  },
  {
    title: "Campaign Manager",
    description: "Multi-channel notifications - Twilio SMS + IVR voice and AWS SES email with CSV lists and templated messaging.",
    jobId: "hth",
  },
  {
    title: "CCS ↔ Invoice Cloud Sync",
    description: "Batch pipeline syncing multi-account customers in 5K-record batches - idempotent, tracked, self-reporting.",
    jobId: "hth",
  },
  {
    title: "Bedrock Knowledge Base",
    description: "Pipeline converting Oracle CCS reference docs into LLM training data - validated JSONL to S3/Bedrock.",
    jobId: "hth",
  },
  {
    title: "Tenant Go-Lives",
    description: "Primary engineer on four tenant launches; core contributor on two.",
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
    jobId: "basemap",
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
  /* rendered in the resume only (site omits it) */
  resumeOnly?: boolean;
}

export const stackGroups: StackGroup[] = [
  {
    title: "Cloud & Infra",
    span: 2,
    items: [
      "AWS - ECS Fargate, CloudFront, Cognito, RDS, ElastiCache, KMS, Secrets Manager, WAFv2, SES, S3, Route 53, VPC, ALB, Elastic Beanstalk, Bedrock",
      "Terraform",
      "Docker · Kubernetes",
      "Linux · OpenSearch",
    ],
  },
  {
    title: "Platform & DevOps",
    span: 1,
    items: [
      "Internal Developer Platform",
      "Multi-tenant provisioning",
      "Bitbucket Pipelines · GitHub Actions",
      "FinOps - Cost Explorer",
    ],
  },
  {
    title: "AI on the Platform",
    span: 1,
    items: [
      "AWS Bedrock (Claude)",
      "AIOps auto-remediation",
      "Agentic SDLC pipelines",
      "AI code review · LLM knowledge bases",
    ],
  },
  {
    title: "Backend & Data",
    span: 2,
    items: [
      "Node.js - Fastify, Express",
      "TypeScript · Python",
      "REST APIs · GraphQL · Prisma",
      "PostgreSQL · MongoDB · Redis/BullMQ",
      "Oracle Utilities CCS · Invoice Cloud",
    ],
  },
  {
    title: "Observability & Security",
    span: 1,
    items: [
      "Datadog RUM/APM · CloudWatch · Sentry",
      "Structured logging",
      "OWASP/IDOR · JWT · WAF · Snyk",
    ],
  },
  {
    title: "Frontend",
    span: 1,
    items: ["React · Redux", "TypeScript", "Styled Components · Tailwind", "Next.js"],
  },
  {
    title: "Practices",
    span: 1,
    resumeOnly: true,
    items: ["Platform Engineering", "Infrastructure-as-Code", "System Design & Architecture", "Security & Compliance", "Incident Response"],
  },
];

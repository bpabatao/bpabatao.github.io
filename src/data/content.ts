export const profile = {
  name: "Benedict Pabatao",
  role: "Lead Platform Engineer",
  statusLine: "OPERATIONAL - 8 TENANTS · AWS · REMOTE (ITALY)",
  thesis: { lead: "I build the platform", accent: "other engineers ship on." },
  summary:
    "Lead Platform Engineer - 8+ years in software, 5+ hands-on with AWS. I own a multi-tenant portal fleet end to end: the Terraform that provisions it, the core API it runs on, and the AI tooling that keeps it moving.",
  email: "jajapabatao@gmail.com",
  github: "https://github.com/bpabatao",
  linkedin: "https://linkedin.com/in/benedict-pabatao",
  siteUrl: "https://bpabatao.github.io",
} as const;

export const metrics = [
  { value: 8, suffix: "+", label: "years in software" },
  { value: 8, suffix: "", label: "tenant portals" },
  { value: 78, suffix: "%", label: "core API authorship" },
  { value: 110, prefix: "$", suffix: "K/yr", label: "AWS under management" },
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

export interface Job {
  company: string;
  role: string;
  period: string;
  location?: string;
  receipts: string[];
  stack?: string[];
}

export const currentJobs: Job[] = [
  {
    company: "ESC Partners / HometownHUB",
    role: "Lead Platform Engineer",
    period: "Jun 2023 - Present",
    location: "New York, USA (Remote)",
    receipts: [
      "Primary author (78%) of the core API middleware connecting 8 utility tenant portals to Oracle CCS via OAuth 2.0 - the auth, data-access, and integration patterns the whole fleet is built on.",
      "Sole author of the internal developer platform: a Terraform control-plane (9 stacks, ~60 AWS resource types) with a Fastify/React dashboard that self-service provisions every client environment.",
      "De-facto technical lead of a 5-engineer team, reporting to the COO/CEO - set the platform standards the fleet adopts.",
      "Own ~$110K/yr of AWS across the production and test fleet - CI/CD, Datadog/CloudWatch observability, and FinOps tooling driving right-sizing and Fargate-Spot savings.",
      "Built the team's AI tooling: Bedrock auto-remediation that opens fix PRs, a Claude PR reviewer in CI, and an agentic AI-SDLC pipeline with human approval gates.",
      "Owned production go-live readiness for 6 client launches.",
    ],
    stack: ["TypeScript", "Fastify", "React", "Terraform", "AWS", "MongoDB", "Oracle CCS"],
  },
  {
    company: "Nmblr",
    role: "Senior Full-Stack Engineer",
    period: "Mar 2024 - Present",
    location: "Remote (freelance)",
    receipts: [
      "One of 3 core engineers on an ISO 27001-certified biopharma strategy SaaS in private beta with enterprise pharma clients.",
      "Originated two subsystems from scratch: a DMMF-driven strategy clone engine and the Edge archive/restore isolation system.",
      "Contributed to real-time collaboration (GraphQL subscriptions), OpenAI-backed generation features, and platform security (OWASP/IDOR, JWT sessions).",
    ],
    stack: ["React", "TypeScript", "Node", "GraphQL", "Prisma", "PostgreSQL", "AWS"],
  },
];

export const earlierJobs: Job[] = [
  {
    company: "Ordermentum",
    role: "Senior Software Engineer (contract)",
    period: "2022 - 2023",
    receipts: ["Restaurant ordering and payment management for hospitality clients."],
  },
  {
    company: "CoDev",
    role: "Senior Software Engineer",
    period: "2022 - 2023",
    receipts: ["GIS-based hunting/mapping systems and an internal talent-management portal."],
  },
  {
    company: "HCL Technologies",
    role: "Senior Software Engineer II",
    period: "2020 - 2022",
    receipts: ["Product features at scale on HCL DX; automated test suites; led code reviews."],
  },
  {
    company: "Zencomputes",
    role: "Software Developer",
    period: "2019 - 2020",
    receipts: ["Full-stack development, Singapore."],
  },
  {
    company: "Halcyon Digital",
    role: "Mobile App Developer",
    period: "2018 - 2019",
    receipts: ["Mobile applications, Philippines."],
  },
];

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
      "One API, eight utility portals. OAuth 2.0 into Oracle CCS, per-tenant behavior composed from config, and authorization gates on every endpoint.",
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
}

export const secondaryProjects: SecondaryProject[] = [
  {
    title: "Nmblr",
    description: "Biopharma strategy and real-time collaboration platform - clone engine, archive/restore, GraphQL subscriptions.",
    url: "https://nmblr.co",
  },
  {
    title: "MyMVU Smart Portal",
    description: "Utility customer portal - usage analytics, bill pay, outage reporting. Primary engineer on launch.",
    url: "https://mvumobile.com",
  },
  {
    title: "Campaign Manager",
    description: "Multi-channel notifications - Twilio SMS + IVR voice and AWS SES email with CSV lists and templated messaging.",
  },
  {
    title: "CCS ↔ Invoice Cloud Sync",
    description: "Batch pipeline syncing multi-account customers in 5K-record batches - idempotent, tracked, self-reporting.",
  },
  {
    title: "Bedrock Knowledge Base",
    description: "Pipeline converting Oracle CCS reference docs into LLM training data - validated JSONL to S3/Bedrock.",
  },
  {
    title: "Tenant Go-Lives",
    description: "Primary engineer on MVU, Web Aruba, NEP, and Carmel launches; core contributor on Alex Renew and DelCo.",
  },
];

export const stackGroups = [
  {
    title: "Cloud & Infra",
    span: 2,
    items: [
      "AWS - ECS Fargate, CloudFront, Cognito, RDS, ElastiCache, KMS, Secrets Manager, WAFv2, SES, Route 53, Bedrock",
      "Terraform",
      "Docker",
      "Linux",
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
      "TypeScript · GraphQL · Prisma",
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
] as const;

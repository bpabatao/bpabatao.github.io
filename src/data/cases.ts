export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  meta: { role: string; period: string; ownership: string; stack: string[] };
  sections: { heading: string; paragraphs: string[] }[];
  /* the case's judgment calls, rendered between Constraints and Architecture; moved here, never repeated in the sections */
  decisions?: string[];
  outcomes: string[];
}

export const cases: CaseStudy[] = [
  {
    slug: "core-api",
    title: "Multi-Tenant Core API",
    subtitle:
      "The middleware every utility-customer portal in the fleet stands on - two generations of it, and the migration from one to the other.",
    meta: {
      role: "Primary author of both generations, architecture and security owner",
      period: "2023 - present",
      ownership: "58% of v1 · 76% of v2",
      stack: ["Fastify 5", "TypeScript (strict)", "Zod", "MongoDB", "AWS SDK v3", "ECS Fargate", "Vitest"],
    },
    sections: [
      {
        heading: "Problem",
        paragraphs: [
          "A fleet of utility companies each needed a customer portal talking to Oracle Utilities CCS, the billing system of record. The v1 server I inherited when I joined in 2023 - an Express codebase that predates me, 58% mine by commit today - had no clean way to vary behavior per tenant. Every new client meant forked code and re-audited security.",
          "The v2 rebuild, started in early 2026, had one mandate: a single API where a new tenant is configuration, not code, and where authorization failure is hard to ship by accident. Six of the seven launched tenants run production on v1 today; the seventh launched directly on v2 in June 2026. The first v1-to-v2 migration runs v2 beside its v1 service, certified, with the cutover held. The fleet moves one tenant at a time.",
        ],
      },
      {
        heading: "Constraints",
        paragraphs: [
          "Utility customers pay bills through this thing - it has to be up and it has to be right. Oracle CCS is reached over OAuth 2.0 with per-tenant credentials. The team is small, so the architecture had to make the secure path the easy path, and the migration cannot pause billing.",
        ],
      },
      {
        heading: "Architecture",
        paragraphs: [
          "Fastify 5 on Node 22, ESM-only, TypeScript strict with no any types. Zod validates every input at the boundary; responses use one fixed envelope so clients never parse ad-hoc shapes.",
          "On v2, admin reads and impersonated sessions are audited as well as writes, attributed to the acting admin, with field-level capture of what a write actually changed and, on the v2 capture path, deep redaction of tokens, passwords and identifiers. Admin writes are kept for a year, admin reads for ninety days.",
          "Where the billing system of record and the payment provider disagree, a reconciler surfaces the drift first; repairs run guarded, in shadow before they write, and the account-linking path guards against duplicate registrations and signup conflicts. Enforcing the ten-digit account number on one tenant's sign-in forms targeted about 215 CCS errors a day that partial or oversized numbers had been generating.",
          "Typecheck, lint, tests and a Snyk gate run in CI; Bitbucket Pipelines builds to ECR and deploys to ECS Fargate behind a shared ALB.",
        ],
      },
    ],
    decisions: [
      "Both generations run side by side: the portals carry interceptors for either backend, and a tenant moves only when its parity checks pass.",
      "Tenant behavior is composed from a base configuration plus per-tenant overrides, assembled by strategy factories - the request path never branches on tenant name.",
      "Authorization is enforced as a route-level gate: every account-scoped endpoint proves the caller owns the account it touches before any data access, which is what closes IDOR at the route layer.",
    ],
    outcomes: [
      "On v2 a tenant is config plus provisioning, not a fork; one launched tenant runs production on v2, the first migration runs v2 beside its v1, certified, with the cutover held, and v1 stays patched and audited until the last one moves.",
      "Authorization is structural, not reviewed-in: the route contract enforces ownership checks on every account-scoped endpoint.",
      "Billing drift surfaces through a reconciler first; repairs run guarded, in shadow before they write.",
    ],
  },
  {
    slug: "control-plane",
    title: "Terraform Control-Plane & Internal Developer Platform",
    subtitle:
      "The internal developer platform that provisions new client environments, cost-tracks the fleet, and is absorbing the rest tenant by tenant.",
    meta: {
      role: "Primary author and operator",
      period: "2026 - present",
      ownership: "93% of commits",
      stack: ["Terraform", "Fastify 5", "React 18", "TypeScript", "MongoDB", "AWS SDK v3", "ECS Fargate"],
    },
    sections: [
      {
        heading: "Problem",
        paragraphs: [
          "Client environments were hand-assembled: per-portal Terraform where it existed, console clicks where it did not, drift nobody could see, and an AWS bill nobody could attribute. Onboarding a tenant took days of a senior engineer's attention and produced an environment subtly unlike the last one.",
        ],
      },
      {
        heading: "Constraints",
        paragraphs: [
          "One platform engineer - me - owning the AWS across production and test fleets, alongside feature work. The platform had to be self-service enough that provisioning doesn't need its author in the room, and observable enough that drift and cost anomalies surface themselves.",
        ],
      },
      {
        heading: "Architecture",
        paragraphs: [
          "Nine Terraform stacks covering ~60 AWS resource types: Cognito user pools, ECS Fargate services, CloudFront distributions, WAFv2, Route 53, ElastiCache, KMS, Secrets Manager. Tenant environments are instantiated from templated modules - the same shape every time. The modules were imported from the fleet's earlier per-portal Terraform in March 2026 and consolidated; colleagues contributed the other 7% of commits - Entra ID SSO for the admin portal, the clients tab and onboarding wizard, the production backend deploy path, and per-client state isolation with a plan-approval gate.",
          "Where it stands: the control-plane state owns one deployed tenant awaiting launch, the shared ALB and WAF, and the first migrating tenant's v2 stack, now running beside its v1. The live fleet still runs on its earlier per-portal Terraform.",
          "On top sits a Fastify + React dashboard that runs Terraform plans and applies, detects drift against live state, enforces tag compliance, and attributes cost per client through the Cost Explorer API. The shared ALB and test-fleet Fargate Spot cut cost; per-client attribution shows it.",
        ],
      },
      {
        heading: "Delivery",
        paragraphs: [
          "Blocking Snyk scans were rolled onto the newer portal pipelines and both API repos, and deploys on four repositories authenticate through keyless OIDC, taking long-lived keys out of their deploy paths.",
          "The admin portal's run went from about ten minutes to six in April 2026 by merging lint into the build and running the security scan in parallel; the core API's went from twelve to seven with esbuild transpile, cache-mounted installs and fail-fast, and the twenty-minute build hangs ended when the stale registry cache was dropped.",
        ],
      },
    ],
    decisions: [
      "The live fleet is being brought under the control-plane tenant by tenant, so the same environment is provisioned the same way whether it is the first or the last.",
      "The supply-chain scan runs beside the build and blocks the deploy.",
      "Keyless OIDC deploys were piloted on one environment, then rolled to test and production.",
    ],
    outcomes: [
      "New tenant onboarding is provisioned through the control-plane's templated modules and a written runbook; existing tenants are migrating onto the same state.",
      "Per-client cost attribution, and drift detection on the stacks the control-plane owns.",
      "The newer portal pipelines and both APIs block on a supply-chain scan before they deploy, and OIDC deploys removed long-lived AWS keys from four repositories.",
      "Pipeline runs dropped from about ten minutes to six on the admin portal (April 2026) and twelve to seven on the core API, and the twenty-minute build hangs are gone.",
    ],
  },
  {
    slug: "observability",
    title: "Observability & Accountability",
    subtitle:
      "The platform that makes a small team's fleet legible: who did what, which accounts look wrong, and what an incident actually cost.",
    meta: {
      role: "Sole author",
      period: "2026",
      ownership: "Sole author",
      stack: ["MongoDB", "CloudWatch", "WAFv2", "Fastify", "React"],
    },
    sections: [
      {
        heading: "Problem",
        paragraphs: [
          "A fleet of tenant portals produced plenty of logs and very little answerable truth. Which admin changed that account? Is this login pattern normal? Is that error rate real or is it the same benign auth failure counted a thousand times? Every question meant someone reading raw streams.",
        ],
      },
      {
        heading: "Constraints",
        paragraphs: [
          "Utility customer data, so retention and access are not free choices. The dashboard had to be usable during an incident by whoever was responding, not only by its author, and it had to run inside the same cost envelope as everything else on the platform.",
        ],
      },
      {
        heading: "Architecture",
        paragraphs: [
          "Capture is universal: a wrapper records calls out to identity, mail, payment and billing providers alike, so an event exists whether the failure was ours or theirs, with payloads deep-redacted on the v2 capture path - tokens, passwords and identifiers. Volume was measured, not estimated: 156,656 events a day at 1.8 KB each, projected to about 35 GB at steady state.",
          "Accountability is tiered. Admin writes record which fields actually changed and are kept for a year; admin reads and impersonated sessions are captured too on the v2 API, attributed to the acting admin, and kept for ninety days.",
          "An account-to-IP fan-out view surfaces anomalies, and an alert fires on the email-reversal pattern that precedes account takeover.",
          "A composite index on tenant, environment, user and timestamp cut the sessions view 43x, and Bedrock spend is attributed to its own client in the cost dashboard so AI cost is visible next to everything else.",
        ],
      },
    ],
    decisions: [
      "The audit tiers are deliberate: the trail that answers 'who changed this' outlives the one that answers 'who looked'.",
      "Benign authentication failures, account lockouts and revoked tokens are folded into an expected class so the error rate means something.",
      "Per-pattern batch analysis replaced per-event analysis so the AI spend tracks patterns, not traffic.",
    ],
    outcomes: [
      "Admin writes are attributable fleet-wide; admin reads and impersonation are attributable on the v2 API.",
      "The error rate reflects real failures, and account anomalies surface as a view instead of a hunch.",
      "One composite index took the sessions view from 102 seconds to 2.4 - 43x, measured live - and AI spend is attributed rather than absorbed.",
    ],
  },
  {
    slug: "nmblr",
    title: "Biopharma Strategy Platform",
    subtitle:
      "An ISO 27001-certified strategy SaaS for enterprise pharma - a schema-driven clone engine, dependency-aware archive/restore, and real-time collaboration.",
    meta: {
      role: "Originating engineer on two subsystems",
      period: "2024 - present",
      ownership: "1 of 3 core engineers",
      stack: ["React", "TypeScript", "Node", "GraphQL", "Prisma", "PostgreSQL", "AWS"],
    },
    sections: [
      {
        heading: "Problem",
        paragraphs: [
          "Brand strategy in pharma is not one document. It is a graph of artefacts that teams finalise, reuse, and revise for years, and the two operations that matter most are the two that are easiest to get wrong: starting a new strategy from a finished one, and removing something other artefacts quietly depend on.",
          "Copying by hand drifts the moment the schema moves. Deleting without knowing the dependents loses work that a regulated client cannot lose.",
        ],
      },
      {
        heading: "Constraints",
        paragraphs: [
          "The platform is ISO 27001 certified and in private beta with enterprise pharma clients, so destructive actions have to be reversible and admin and user actions have to be attributable. Three core engineers cover the whole product, which rules out subsystems that need a specialist to operate.",
        ],
      },
      {
        heading: "Architecture",
        paragraphs: [
          "Clone engine: driven by the schema's metadata, a new field or relation is cloned because the schema says so, not because someone remembered to add it.",
          "Dependency subsystem: a registry describes which entities depend on which, exposed through its own GraphQL contract and resolver and rendered by a registry-driven modal. Finalised entities with dependents warn before an archive or a delete.",
          "Across the product: real-time collaboration over GraphQL subscriptions, OpenAI-backed generation features, and platform security work on OWASP/IDOR exposure and JWT sessions.",
        ],
      },
    ],
    decisions: [
      "The clone walks Prisma's DMMF, the generated data-model metadata, instead of hand-written per-model code.",
      "The archive cascades across the dependents so a restore brings the whole set back together.",
    ],
    outcomes: [
      "Two subsystems originated from scratch and in the product: the clone engine and the Edge archive/restore isolation system.",
      "Destructive actions on finalised work are warned about first, then cascade and reverse as a set instead of one entity at a time.",
      "Cloning survives schema change: the model metadata drives the copy, so new fields travel without new code.",
    ],
  },
];

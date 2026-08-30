export interface CaseStudy {
  slug: string;
  title: string;
  subtitle: string;
  meta: { role: string; period: string; ownership: string; stack: string[] };
  sections: { heading: string; paragraphs: string[] }[];
  outcomes: string[];
}

export const cases: CaseStudy[] = [
  {
    slug: "core-api",
    title: "Multi-Tenant Core API",
    subtitle:
      "The middleware every utility-customer portal in the fleet stands on - auth, data access, and Oracle CCS integration in one codebase.",
    meta: {
      role: "Primary author, architecture and security owner",
      period: "2023 - present",
      ownership: "78% of commits",
      stack: ["Fastify 5", "TypeScript (strict)", "Zod", "MongoDB", "AWS SDK v3", "ECS Fargate", "Vitest"],
    },
    sections: [
      {
        heading: "Problem",
        paragraphs: [
          "A fleet of utility companies each needed a customer portal talking to Oracle Utilities CCS. The legacy server they inherited had authorization gaps and no clean way to vary behavior per tenant. Every new client meant forked code and re-audited security.",
          "The rebuild had one mandate: a single API where a new tenant is configuration, not code, and where authorization failure is impossible to ship by accident.",
        ],
      },
      {
        heading: "Constraints",
        paragraphs: [
          "Utility customers pay bills through this thing - it has to be up and it has to be right. Oracle CCS is the system of record, reached over OAuth 2.0 with per-tenant credentials. The team is small, so the architecture had to make the secure path the easy path.",
        ],
      },
      {
        heading: "Architecture",
        paragraphs: [
          "Fastify 5 on Node 22, ESM-only, TypeScript strict with no `any`. Zod validates every input at the boundary; responses use one fixed envelope so clients never parse ad-hoc shapes.",
          "Tenant behavior is composed from a base configuration plus per-tenant overrides, assembled by strategy factories - the request path never branches on tenant name. Authorization is enforced as a route-level gate: every endpoint proves the caller owns the account it touches before any data access, which is what kills IDOR as a class.",
          "Accountability does not stop at the customer. Admin reads and impersonated sessions are audited as well as writes, attributed to the acting admin, with field-level capture of what a write actually changed and deep redaction so tokens and provider passwords never reach the log. Admin writes are kept for a year, admin reads for ninety days.",
          "Where the billing system of record and the payment provider disagree, a detection-only reconciler surfaces the drift instead of silently writing to either, and the account-linking path guards against duplicate registrations and signup conflicts.",
          "An 80% coverage gate and OWASP checks run in CI; Bitbucket Pipelines builds to ECR and deploys to ECS Fargate behind a shared ALB.",
        ],
      },
    ],
    outcomes: [
      "Every production tenant on one codebase - onboarding a tenant is config plus provisioning, not a fork.",
      "Authorization is structural, not reviewed-in: the route contract enforces ownership checks on every endpoint.",
      "Every admin action, read or write, is attributable to the person who took it.",
      "The integration patterns became the fleet standard other services adopt.",
    ],
  },
  {
    slug: "control-plane",
    title: "Terraform Control-Plane & IDP",
    subtitle:
      "The internal developer platform that provisions, ships, and cost-tracks every client environment in the fleet.",
    meta: {
      role: "Sole author and operator",
      period: "2023 - present",
      ownership: "Sole author",
      stack: ["Terraform", "Fastify 5", "React 18", "TypeScript", "MongoDB", "AWS SDK v3", "ECS Fargate"],
    },
    sections: [
      {
        heading: "Problem",
        paragraphs: [
          "Client environments were hand-assembled: console clicks, tribal knowledge, drift nobody could see, and an AWS bill nobody could attribute. Onboarding a tenant took days of a senior engineer's attention and produced an environment subtly unlike the last one.",
        ],
      },
      {
        heading: "Constraints",
        paragraphs: [
          "One platform engineer - me - operating ~$110K/yr of AWS across production and test fleets, alongside feature work. The platform had to be self-service enough that provisioning doesn't need its author in the room, and observable enough that drift and cost anomalies surface themselves.",
        ],
      },
      {
        heading: "Architecture",
        paragraphs: [
          "Nine Terraform stacks covering ~60 AWS resource types: Cognito user pools, ECS Fargate services, CloudFront distributions, WAFv2, Route 53, ElastiCache, KMS, Secrets Manager. Tenant environments are instantiated from templated modules - the same shape every time.",
          "On top sits a Fastify + React dashboard that runs Terraform plans and applies, detects drift against live state, enforces tag compliance, and attributes cost per client through the Cost Explorer API. Right-sizing, the shared ALB, and Fargate Spot all came out of that same cost data.",
          "Delivery is gated rather than trusted. A blocking Snyk scan runs ahead of build and deploy on every pipeline across 14 repositories, and deploys authenticate through keyless OIDC - piloted on one environment, then rolled through the test fleet and production - so no long-lived AWS credentials sit in CI.",
          "The same pipelines got faster while getting stricter: esbuild transpile for the Docker build, lint and scanning in parallel, cache mounts and fail-fast took a run from about ten minutes to six and ended the twenty-minute build hangs. On the observability side a single composite index on the sessions view - tenant, environment, user, timestamp - cut its query time 43x, and RUM sampling was tuned to keep session replay on every error without paying for it on every session.",
        ],
      },
    ],
    outcomes: [
      "Tenant onboarding went from days of manual assembly to a templated, repeatable workflow.",
      "~$110K/yr of AWS runs with per-client cost attribution and continuous drift detection.",
      "Every pipeline in the fleet blocks on a supply-chain scan, and deploys carry no long-lived AWS credentials.",
      "A pipeline run costs about six minutes instead of ten, with the twenty-minute build hangs gone.",
      "6 client launches shipped through the platform - environment validation, deployment, rollback planning.",
    ],
  },
  {
    slug: "ai-sdlc",
    title: "AI-Augmented SDLC",
    subtitle:
      "Agentic tooling that drains the toil out of a small team running a large fleet - with humans keeping every approval gate.",
    meta: {
      role: "Sole author",
      period: "2024 - present",
      ownership: "Sole author",
      stack: ["AWS Bedrock (Claude)", "GitHub", "Jira", "Claude Code plugins", "Python", "S3/JSONL"],
    },
    sections: [
      {
        heading: "Problem",
        paragraphs: [
          "Five engineers, one fleet: triage, code review, and backlog grooming eat the week if you let them. The interesting question wasn't whether AI could draft a fix - it was how to wire it in so speed goes up while accountability stays exactly where it was.",
        ],
      },
      {
        heading: "Approach",
        paragraphs: [
          "Every pipeline is built around human gates. Agents propose; people approve. State lives in labels on the ticket and PR, so any step is inspectable and reversible, and nothing merges without a named human owning the decision.",
        ],
      },
      {
        heading: "Architecture",
        paragraphs: [
          "Auto-remediation: an AWS Bedrock service (Claude via bedrock-runtime) triages production alerts, correlates them with recent changes, and opens a fix PR for review.",
          "Review: a Claude-based PR reviewer runs in CI on every pull request, ahead of the human pass.",
          "Delivery: an agentic pipeline connects the ticket queue to GitHub - plan, branch, implement in an isolated worktree, open a draft PR - with three human approval gates between intent and merge.",
          "Knowledge: an LLM-maintained knowledge base, including a pipeline that converts Oracle CCS reference documentation into validated training data for Bedrock.",
        ],
      },
    ],
    outcomes: [
      "Alert-to-fix-PR and ticket-to-draft-PR run without an engineer driving - engineers review instead of type.",
      "Every merge still has a named human approver; the state machine makes each step auditable.",
      "Packaged as config-driven tooling the whole team runs, not a personal script.",
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
          "The platform is ISO 27001 certified and in private beta with enterprise pharma clients, so destructive actions have to be reversible and every session has to be attributable. Three core engineers cover the whole product, which rules out subsystems that need a specialist to operate.",
        ],
      },
      {
        heading: "Architecture",
        paragraphs: [
          "Clone engine: the copy walks Prisma's DMMF, the generated data-model metadata, instead of hand-written per-model code. A new field or relation is cloned because the schema says so, not because someone remembered to add it.",
          "Dependency subsystem: a registry describes which entities depend on which, exposed through its own GraphQL contract and resolver and rendered by a registry-driven modal. Finalised entities with dependents warn before an archive or a delete, and the archive then cascades across the dependents so a restore brings the whole set back together.",
          "Edge brand-strategy module: Belief Shift, Narrative and competitive-landscape recap tabs, each with per-group finalise, and LLM-backed prompt generation instrumented with llm_event telemetry so generation is measurable rather than anecdotal.",
          "Across the product: real-time collaboration over GraphQL subscriptions, OpenAI-backed generation features, and platform security work on OWASP/IDOR exposure and JWT sessions.",
        ],
      },
    ],
    outcomes: [
      "Two subsystems originated from scratch and in the product: the clone engine and the Edge archive/restore isolation system.",
      "Destructive actions on finalised work are warned about first, then cascade and reverse as a set instead of one entity at a time.",
      "Cloning survives schema change: the model metadata drives the copy, so new fields travel without new code.",
    ],
  },
];

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
      "The middleware eight utility-customer portals stand on - auth, data access, and Oracle CCS integration in one codebase.",
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
          "Eight utility companies - Delta, MVU, NEP, DelCo, Alex Renew, Carmel, Web Aruba, IPU - each needed a customer portal talking to Oracle Utilities CCS. The legacy server they inherited had authorization gaps and no clean way to vary behavior per tenant. Every new client meant forked code and re-audited security.",
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
          "An 80% coverage gate and OWASP checks run in CI; Bitbucket Pipelines builds to ECR and deploys to ECS Fargate behind a shared ALB.",
        ],
      },
    ],
    outcomes: [
      "8 tenants in production on one codebase - onboarding a tenant is config plus provisioning, not a fork.",
      "Authorization is structural, not reviewed-in: the route contract enforces ownership checks on every endpoint.",
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
        ],
      },
    ],
    outcomes: [
      "Tenant onboarding went from days of manual assembly to a templated, repeatable workflow.",
      "~$110K/yr of AWS runs with per-client cost attribution and continuous drift detection.",
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
          "Five engineers, eight production tenants: triage, code review, and backlog grooming eat the week if you let them. The interesting question wasn't whether AI could draft a fix - it was how to wire it in so speed goes up while accountability stays exactly where it was.",
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
];

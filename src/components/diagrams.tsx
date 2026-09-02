import type { ReactNode } from "react";
import { fleetPortals } from "@/data/content";

/* Animated architecture diagrams. Packets ride CSS offset-path (globals.css);
   they are drawn before the boxes so they visibly enter and leave nodes. */

const mono = "var(--font-jetbrains), ui-monospace, monospace";

function Packet({ d, dur, delay = "0s", approve = false }: { d: string; dur: string; delay?: string; approve?: boolean }) {
  return (
    <circle
      r={3.5}
      fill="var(--accent)"
      className={approve ? "packet packet-approve" : "packet"}
      style={{
        offsetPath: `path("${d}")`,
        animationDuration: approve ? `${dur}, ${dur}` : dur,
        animationDelay: approve ? `${delay}, ${delay}` : delay,
      }}
    />
  );
}

function Box({
  x,
  y,
  w,
  h,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  children?: ReactNode;
}) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill="var(--surface-2)" stroke="var(--line)" />
      {children}
    </g>
  );
}

function Label({
  x,
  y,
  size = 10,
  color = "var(--muted)",
  weight,
  anchor = "middle",
  children,
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
  weight?: number;
  anchor?: "start" | "middle" | "end";
  children: ReactNode;
}) {
  return (
    <text x={x} y={y} fontFamily={mono} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor} dominantBaseline="middle">
      {children}
    </text>
  );
}

function Line({ d }: { d: string }) {
  return <path d={d} fill="none" stroke="var(--line)" strokeWidth={1} />;
}

const TENANTS = fleetPortals.map((t) => t.key);
const LAST_X = 42 + (TENANTS.length - 1) * 78;

/* One sentence per diagram: the SVG's accessible name on every screen, and the visible caption on phones,
   where a 640-unit canvas cannot carry 9px labels. Derived counts stay derived. */
export const captions = {
  "core-api": `${TENANTS.length} tenant portals connect through the core API to Oracle CCS over OAuth 2.0`,
  "control-plane": `The provisioning dashboard drives the Terraform control-plane, which provisions ${TENANTS.length} tenant environments`,
  "ai-sdlc": "Alerts flow through Bedrock triage to fix PRs and human review; tickets flow through planning and two human gates to merge",
  "nmblr": "A DMMF-driven clone engine copies a finalised strategy, and a dependency registry cascades archive and restore across dependent entities",
  "ccs-kb": "A question routes through the knowledge-base agent to a curated corpus first, with generated SQL against tenant-scoped CCS only as a flagged fallback",
  "observability": "Portals, the core API and outbound providers feed one capture layer that redacts payloads, raises anomaly alerts, and writes to retention tiers",
  "identity": "The browser no longer reaches the identity provider directly; every identity call goes through the API, which forwards the real client IP and gates registration on verification with lockout",
} as const;

export function CoreApiDiagram() {
  return (
    <svg viewBox="0 0 640 288" role="img" aria-label={captions["core-api"]} className="block w-full">
      {/* connectors first, packets under boxes */}
      {TENANTS.map((_, i) => (
        <Line key={i} d={`M${42 + i * 78} 40 V64`} />
      ))}
      <Line d={`M42 64 H${LAST_X}`} />
      <Line d="M320 64 V96" />
      <Line d="M320 184 V232" />

      {/* one packet per tenant, evenly staggered - the count is the point */}
      {TENANTS.map((t, i) => (
        <Packet key={t} d={`M${42 + i * 78} 40 V64 H320 V96`} dur="3.2s" delay={`${((i * 3.2) / TENANTS.length).toFixed(2)}s`} />
      ))}
      <Packet d="M320 184 V232" dur="1.8s" delay="0.5s" />
      <circle
        r={3.5}
        fill="var(--ok)"
        className="packet"
        style={{ offsetPath: 'path("M320 232 V184")', animationDuration: "1.8s", animationDelay: "1.4s" }}
      />

      {TENANTS.map((t, i) => (
        <Box key={t} x={8 + i * 78} y={16} w={68} h={24}>
          <Label x={42 + i * 78} y={29} size={9} color="var(--body)">
            {t}
          </Label>
        </Box>
      ))}

      <Box x={200} y={96} w={240} h={88}>
        <Label x={320} y={118} size={12} color="var(--ink)" weight={600}>
          core api
        </Label>
        <Label x={320} y={140} size={9.5}>
          authz on every route
        </Label>
        <Label x={320} y={156} size={9.5}>
          per-tenant config
        </Label>
        <Label x={320} y={172} size={9.5}>
          fixed response shape
        </Label>
      </Box>

      <Label x={334} y={208} size={9} color="var(--accent)" anchor="start">
        oauth 2.0
      </Label>

      <Box x={232} y={232} w={176} h={40}>
        <Label x={320} y={253} size={11} color="var(--ink)" weight={600}>
          oracle ccs
        </Label>
      </Box>
    </svg>
  );
}

const RESOURCES = ["cognito · ecs fargate · cloudfront · wafv2", "route 53 · elasticache · kms · secrets manager"];

export function ControlPlaneDiagram() {
  return (
    <svg
      viewBox="0 0 640 288"
      role="img"
      aria-label={captions["control-plane"]}
      className="block w-full"
    >
      <Line d="M320 68 V100" />
      <Line d="M320 172 V196" />
      <Line d="M80 196 H560" />
      {TENANTS.map((_, i) => (
        <Line key={i} d={`M${80 + i * 80} 196 V220`} />
      ))}

      <Packet d="M320 68 V100" dur="2s" />
      {TENANTS.map((t, i) => (
        <Packet key={t} d={`M320 172 V196 H${80 + i * 80} V220`} dur="2.6s" delay={`${(0.6 + (i * 2.2) / TENANTS.length).toFixed(2)}s`} />
      ))}

      <Box x={140} y={12} w={360} h={56}>
        <Label x={320} y={34} size={11} color="var(--ink)" weight={600}>
          provisioning dashboard · fastify + react
        </Label>
        <Label x={320} y={52} size={9.5}>
          plan · apply · drift · tags · cost
        </Label>
      </Box>

      <Box x={80} y={100} w={480} h={72}>
        <Label x={320} y={122} size={11} color="var(--ink)" weight={600}>
          terraform control-plane · 9 stacks
        </Label>
        <Label x={320} y={142} size={9.5}>
          {RESOURCES[0]}
        </Label>
        <Label x={320} y={158} size={9.5}>
          {RESOURCES[1]}
        </Label>
      </Box>

      {TENANTS.map((t, i) => (
        <Box key={t} x={44 + i * 80} y={220} w={72} h={28}>
          <Label x={80 + i * 80} y={235} size={8.5} color="var(--body)">
            {t}
          </Label>
        </Box>
      ))}

      <Label x={320} y={272} size={9}>
        7 production tenants · templated, repeatable, cost-attributed
      </Label>
    </svg>
  );
}

function Gate({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect
        x={-11}
        y={-11}
        width={22}
        height={22}
        transform={`translate(${x} ${y}) rotate(45)`}
        fill="var(--surface-2)"
        stroke="var(--accent)"
      />
      <Label x={x} y={y + 28} size={8.5} color="var(--accent)">
        gate
      </Label>
    </g>
  );
}

export function AiSdlcDiagram() {
  return (
    <svg viewBox="0 0 640 240" role="img" aria-label={captions["ai-sdlc"]} className="block w-full">
      <Label x={8} y={26} size={9} anchor="start">
        AUTO-REMEDIATION
      </Label>
      <Label x={8} y={106} size={9} anchor="start">
        TICKET → MERGE
      </Label>

      <Line d="M68 60 H124" />
      <Line d="M244 60 H292" />
      <Line d="M372 60 H420" />
      <Line d="M76 140 H124" />
      <Line d="M192 140 H252" />
      <Line d="M284 140 H344" />
      <Line d="M432 140 H492" />
      <Line d="M524 140 H564" />

      <Packet d="M8 60 H540" dur="5s" />
      <Packet d="M8 140 H632" dur="6.5s" delay="1s" approve />

      <Box x={8} y={44} w={60} h={32}>
        <Label x={38} y={61} size={9.5} color="var(--body)">
          alert
        </Label>
      </Box>
      <Box x={124} y={44} w={120} h={32}>
        <Label x={184} y={61} size={9.5} color="var(--body)">
          bedrock triage
        </Label>
      </Box>
      <Box x={292} y={44} w={80} h={32}>
        <Label x={332} y={61} size={9.5} color="var(--body)">
          fix pr
        </Label>
      </Box>
      <Box x={420} y={44} w={120} h={32}>
        <Label x={480} y={61} size={9.5} color="var(--body)">
          human review
        </Label>
      </Box>

      <Box x={8} y={124} w={68} h={32}>
        <Label x={42} y={141} size={9.5} color="var(--body)">
          ticket
        </Label>
      </Box>
      <Box x={124} y={124} w={68} h={32}>
        <Label x={158} y={141} size={9.5} color="var(--body)">
          plan
        </Label>
      </Box>
      <Gate x={268} y={140} />
      <Box x={344} y={124} w={88} h={32}>
        <Label x={388} y={141} size={9.5} color="var(--body)">
          draft pr
        </Label>
      </Box>
      <Gate x={508} y={140} />
      <Box x={564} y={124} w={68} h={32}>
        <Label x={598} y={141} size={9.5} color="var(--ok)">
          merge
        </Label>
      </Box>

      <Label x={320} y={210} size={9.5}>
        label-driven state machine · every step reversible · humans own every gate
      </Label>
    </svg>
  );
}

export function NmblrDiagram() {
  return (
    <svg
      viewBox="0 0 640 288"
      role="img"
      aria-label={captions["nmblr"]}
      className="block w-full"
    >
      {/* clone row */}
      <Line d="M174 36 H245" />
      <Line d="M395 36 H466" />
      <Line d="M320 56 V100" />
      {/* cascade bus */}
      <Line d="M320 156 V190" />
      <Line d="M100 190 H540" />
      <Line d="M100 190 V224" />
      <Line d="M320 190 V224" />
      <Line d="M540 190 V224" />

      <Packet d="M174 36 H245" dur="1.6s" />
      <Packet d="M395 36 H466" dur="1.6s" delay="0.8s" />
      <Packet d="M320 56 V100" dur="1.4s" delay="1.6s" />
      <Packet d="M320 156 V190 H100 V224" dur="2.4s" delay="0.2s" />
      <Packet d="M320 156 V190 H320 V224" dur="2.4s" delay="0.9s" />
      <Packet d="M320 156 V190 H540 V224" dur="2.4s" delay="1.6s" />
      <circle
        r={3.5}
        fill="var(--ok)"
        className="packet"
        style={{ offsetPath: 'path("M100 224 V190 H320 V156")', animationDuration: "2.4s", animationDelay: "2.3s" }}
      />

      <Box x={24} y={16} w={150} h={40}>
        <Label x={99} y={31} size={10.5} color="var(--ink)" weight={600}>
          finalised strategy
        </Label>
        <Label x={99} y={45} size={9}>
          the source of truth
        </Label>
      </Box>

      <Box x={245} y={16} w={150} h={40}>
        <Label x={320} y={31} size={10.5} color="var(--ink)" weight={600}>
          clone engine
        </Label>
        <Label x={320} y={45} size={9} color="var(--accent)">
          walks prisma dmmf
        </Label>
      </Box>

      <Box x={466} y={16} w={150} h={40}>
        <Label x={541} y={31} size={10.5} color="var(--ink)" weight={600}>
          new strategy
        </Label>
        <Label x={541} y={45} size={9}>
          schema-complete copy
        </Label>
      </Box>

      <Box x={220} y={100} w={200} h={56}>
        <Label x={320} y={118} size={12} color="var(--ink)" weight={600}>
          dependency registry
        </Label>
        <Label x={320} y={136} size={9.5}>
          warns before archive or delete
        </Label>
        <Label x={320} y={148} size={9.5}>
          graphql contract + resolver
        </Label>
      </Box>

      <Label x={334} y={176} size={9} color="var(--accent)" anchor="start">
        archive cascades
      </Label>
      <Label x={306} y={176} size={9} color="var(--ok)" anchor="end">
        restore returns
      </Label>

      {[
        { x: 30, cx: 100, label: "belief shift" },
        { x: 250, cx: 320, label: "narrative" },
        { x: 470, cx: 540, label: "landscape recap" },
      ].map((e) => (
        <Box key={e.label} x={e.x} y={224} w={140} h={40}>
          <Label x={e.cx} y={239} size={10.5} color="var(--ink)" weight={600}>
            {e.label}
          </Label>
          <Label x={e.cx} y={253} size={9}>
            per-group finalise
          </Label>
        </Box>
      ))}
    </svg>
  );
}

export function CcsKbDiagram() {
  return (
    <svg
      viewBox="0 0 640 288"
      role="img"
      aria-label={captions["ccs-kb"]}
      className="block w-full"
    >
      <Line d="M150 34 H230" />
      <Line d="M410 34 H490" />
      <Line d="M320 52 V80" />
      <Line d="M180 80 H460" />
      <Line d="M180 80 V112" />
      <Line d="M460 80 V112" />
      <Line d="M180 168 V214" />
      <Line d="M460 168 V214" />

      <Packet d="M150 34 H230" dur="1.4s" />
      <Packet d="M320 52 V80 H180 V112" dur="2.2s" delay="0.5s" />
      <Packet d="M320 52 V80 H460 V112" dur="2.2s" delay="2.6s" />
      <Packet d="M460 168 V214" dur="1.4s" delay="1.2s" />
      <Packet d="M180 214 V168" dur="1.8s" delay="2.2s" />
      <circle
        r={3.5}
        fill="var(--ok)"
        className="packet"
        style={{ offsetPath: 'path("M410 34 H490")', animationDuration: "1.4s", animationDelay: "1.6s" }}
      />

      <Box x={20} y={16} w={130} h={36}>
        <Label x={85} y={34} size={10.5} color="var(--ink)" weight={600}>
          question
        </Label>
      </Box>

      <Box x={230} y={16} w={180} h={36}>
        <Label x={320} y={34} size={11} color="var(--ink)" weight={600}>
          kb agent
        </Label>
      </Box>

      <Box x={490} y={16} w={130} h={36}>
        <Label x={555} y={28} size={10.5} color="var(--ink)" weight={600}>
          answer
        </Label>
        <Label x={555} y={42} size={8.5} color="var(--ok)">
          cited + badged
        </Label>
      </Box>

      <Box x={110} y={112} w={140} h={56}>
        <Label x={180} y={130} size={10.5} color="var(--ink)" weight={600}>
          curated corpus
        </Label>
        <Label x={180} y={146} size={8.5}>
          retrieve + generate
        </Label>
        <Label x={180} y={158} size={8.5} color="var(--ok)">
          default path
        </Label>
      </Box>

      <Box x={390} y={112} w={140} h={56}>
        <Label x={460} y={130} size={10.5} color="var(--ink)" weight={600}>
          generated sql
        </Label>
        <Label x={460} y={146} size={8.5} color="var(--accent)">
          flag + permission
        </Label>
        <Label x={460} y={158} size={8.5}>
          kill-switch to curated-only
        </Label>
      </Box>

      <Box x={110} y={214} w={140} h={44}>
        <Label x={180} y={230} size={10} color="var(--ink)" weight={600}>
          s3 corpus
        </Label>
        <Label x={180} y={245} size={8.5}>
          scheduled refresh
        </Label>
      </Box>

      <Box x={390} y={214} w={140} h={44}>
        <Label x={460} y={230} size={10} color="var(--ink)" weight={600}>
          oracle ccs
        </Label>
        <Label x={460} y={245} size={8.5}>
          tenant-scoped
        </Label>
      </Box>

      <Label x={320} y={196} size={9} color="var(--muted)">
        never claims absence
      </Label>
    </svg>
  );
}

export function ObservabilityDiagram() {
  const TIERS = [
    { x: 30, cx: 115, name: "admin writes", keep: "365 days" },
    { x: 235, cx: 320, name: "admin reads", keep: "90 days" },
    { x: 440, cx: 525, name: "telemetry", keep: "90 days" },
  ];
  return (
    <svg
      viewBox="0 0 640 288"
      role="img"
      aria-label={captions["observability"]}
      className="block w-full"
    >
      <Line d="M90 48 V72" />
      <Line d="M320 48 V72" />
      <Line d="M550 48 V72" />
      <Line d="M90 72 H550" />
      <Line d="M280 72 V96" />
      <Line d="M370 122 H420" />
      <Line d="M280 148 V172" />
      <Line d="M115 172 H525" />
      {TIERS.map((t) => (
        <Line key={t.name} d={`M${t.cx} 172 V196`} />
      ))}

      <Packet d="M90 48 V72 H280 V96" dur="2.4s" />
      <Packet d="M320 48 V72 H280 V96" dur="2.4s" delay="0.8s" />
      <Packet d="M550 48 V72 H280 V96" dur="2.4s" delay="1.6s" />
      {TIERS.map((t, i) => (
        <Packet key={t.name} d={`M280 148 V172 H${t.cx} V196`} dur="2.2s" delay={`${0.4 + i * 0.6}s`} />
      ))}
      <circle
        r={3.5}
        fill="var(--ok)"
        className="packet"
        style={{ offsetPath: 'path("M370 122 H420")', animationDuration: "1.6s", animationDelay: "1.2s" }}
      />

      {[
        { x: 30, cx: 90, label: "tenant portals" },
        { x: 260, cx: 320, label: "core api" },
        { x: 490, cx: 550, label: "providers" },
      ].map((n) => (
        <Box key={n.label} x={n.x} y={16} w={120} h={32}>
          <Label x={n.cx} y={33} size={10} color="var(--body)">
            {n.label}
          </Label>
        </Box>
      ))}

      <Box x={190} y={96} w={180} h={52}>
        <Label x={280} y={114} size={11} color="var(--ink)" weight={600}>
          capture layer
        </Label>
        <Label x={280} y={131} size={9}>
          deep-redacted payloads
        </Label>
      </Box>

      <Box x={420} y={96} w={170} h={52}>
        <Label x={505} y={114} size={10.5} color="var(--ink)" weight={600}>
          account to ip fan-out
        </Label>
        <Label x={505} y={131} size={9} color="var(--ok)">
          takeover alert
        </Label>
      </Box>

      {TIERS.map((t) => (
        <Box key={t.name} x={t.x} y={196} w={170} h={44}>
          <Label x={t.cx} y={212} size={10} color="var(--ink)" weight={600}>
            {t.name}
          </Label>
          <Label x={t.cx} y={227} size={9} color="var(--accent)">
            kept {t.keep}
          </Label>
        </Box>
      ))}

      <Label x={320} y={262} size={9}>
        benign auth failures folded out, so the error rate means something
      </Label>
    </svg>
  );
}

export function IdentityDiagram() {
  return (
    <svg
      viewBox="0 0 640 288"
      role="img"
      aria-label={captions["identity"]}
      className="block w-full"
    >
      {/* the path that was removed */}
      <path d="M84 130 L470 96" fill="none" stroke="var(--line)" strokeWidth={1} strokeDasharray="4 4" />
      <Line d="M144 152 H250" />
      <Line d="M390 145 L470 96" />
      <Line d="M390 160 L470 200" />

      <Packet d="M144 152 H250" dur="1.6s" />
      <Packet d="M390 145 L470 96" dur="1.6s" delay="0.8s" />
      <Packet d="M390 160 L470 200" dur="1.6s" delay="1.4s" />

      <g>
        <line x1={271} y1={107} x2={283} y2={119} stroke="var(--muted)" strokeWidth={1.5} />
        <line x1={283} y1={107} x2={271} y2={119} stroke="var(--muted)" strokeWidth={1.5} />
      </g>
      <Label x={293} y={113} size={9} anchor="start">
        no direct access
      </Label>

      <Box x={24} y={130} w={120} h={44}>
        <Label x={84} y={146} size={10.5} color="var(--ink)" weight={600}>
          browser
        </Label>
        <Label x={84} y={161} size={8.5}>
          holds no credentials
        </Label>
      </Box>

      <Box x={250} y={130} w={140} h={44}>
        <Label x={320} y={146} size={11} color="var(--ink)" weight={600}>
          core api
        </Label>
        <Label x={320} y={161} size={8.5} color="var(--accent)">
          permissions declared once
        </Label>
      </Box>

      <Box x={470} y={74} w={146} h={44}>
        <Label x={543} y={90} size={10.5} color="var(--ink)" weight={600}>
          cognito
        </Label>
        <Label x={543} y={105} size={8.5}>
          real client ip forwarded
        </Label>
      </Box>

      <Box x={470} y={178} w={146} h={44}>
        <Label x={543} y={194} size={10.5} color="var(--ink)" weight={600}>
          oracle ccs
        </Label>
        <Label x={543} y={209} size={8.5}>
          identity verification
        </Label>
      </Box>

      <Label x={320} y={244} size={9}>
        registration: lockout on repeat attempts, zip disambiguation on the last-four space
      </Label>
    </svg>
  );
}

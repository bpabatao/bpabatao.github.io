import type { ReactNode } from "react";

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

const TENANTS = ["delta", "mvu", "nep", "delco", "alexrenew", "carmel", "aruba", "ipu"];

export function CoreApiDiagram() {
  return (
    <svg viewBox="0 0 640 288" role="img" aria-label="Eight tenant portals connect through the core API to Oracle CCS over OAuth 2.0" className="block w-full">
      {/* connectors first, packets under boxes */}
      {TENANTS.map((_, i) => (
        <Line key={i} d={`M${42 + i * 78} 40 V64`} />
      ))}
      <Line d="M42 64 H588" />
      <Line d="M320 64 V96" />
      <Line d="M320 184 V232" />

      <Packet d="M42 40 V64 H320 V96" dur="3.2s" />
      <Packet d="M432 40 V64 H320 V96" dur="3.2s" delay="1.1s" />
      <Packet d="M588 40 V64 H320 V96" dur="3.2s" delay="2.2s" />
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
const FLEET = ["delta", "mvu", "nep", "delco", "alexrenew", "carmel", "aruba"];

export function ControlPlaneDiagram() {
  return (
    <svg viewBox="0 0 640 288" role="img" aria-label="The provisioning dashboard drives the Terraform control-plane, which provisions seven tenant environments" className="block w-full">
      <Line d="M320 68 V100" />
      <Line d="M320 172 V196" />
      <Line d="M80 196 H560" />
      {FLEET.map((_, i) => (
        <Line key={i} d={`M${80 + i * 80} 196 V220`} />
      ))}

      <Packet d="M320 68 V100" dur="2s" />
      <Packet d="M320 172 V196 H80 V220" dur="2.6s" delay="0.9s" />
      <Packet d="M320 172 V220" dur="2.6s" delay="1.5s" />
      <Packet d="M320 172 V196 H560 V220" dur="2.6s" delay="2.1s" />

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

      {FLEET.map((t, i) => (
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
    <svg viewBox="0 0 640 240" role="img" aria-label="Alerts flow through Bedrock triage to fix PRs and human review; tickets flow through planning and two human gates to merge" className="block w-full">
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

import { Box, Label, Line, Packet, RESOURCES, TENANTS, captions } from "./diagrams";

/* The landscape Gate puts its label underneath; in a vertical chain the next box covers it. */
function GateBeside({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={-11} y={-11} width={22} height={22} transform={`translate(${x} ${y}) rotate(45)`} fill="var(--surface-2)" stroke="var(--accent)" />
      <Label x={x + 22} y={y} size={8.5} color="var(--accent)" anchor="start">
        human gate
      </Label>
    </g>
  );
}

/* Portrait variants for phones: a 320-unit canvas rendered near 1:1 on a 390px screen, so 9-unit
   labels stay legible. Same nodes, same packets, same captions as the landscape diagrams - only the
   flow runs top to bottom. */

const COL = { l: 12, r: 168, w: 140 } as const; // two-column grid inside a 320 canvas

export function CoreApiPortrait() {
  const rows = TENANTS.map((_, i) => 12 + i * 28);
  const last = rows[rows.length - 1] + 11;
  return (
    <svg viewBox="0 0 320 420" role="img" aria-label={captions["core-api"]} className="block w-full">
      {rows.map((y, i) => (
        <Line key={i} d={`M132 ${y + 11} H160`} />
      ))}
      <Line d={`M160 23 V232`} />
      <Line d="M160 316 V360" />

      {rows.map((y, i) => (
        <Packet key={i} d={`M132 ${y + 11} H160 V232`} dur="3.2s" delay={`${((i * 3.2) / TENANTS.length).toFixed(2)}s`} />
      ))}
      <Packet d="M160 316 V360" dur="1.8s" delay="0.5s" />
      <circle
        r={3.5}
        fill="var(--ok)"
        className="packet"
        style={{ offsetPath: 'path("M160 360 V316")', animationDuration: "1.8s", animationDelay: "1.4s" }}
      />

      {TENANTS.map((t, i) => (
        <Box key={t} x={12} y={rows[i]} w={120} h={22}>
          <Label x={72} y={rows[i] + 12} size={9} color="var(--body)">
            {t}
          </Label>
        </Box>
      ))}
      <Label x={172} y={last} size={8.5} anchor="start">
        {TENANTS.length} portals
      </Label>

      <Box x={40} y={232} w={240} h={84}>
        <Label x={160} y={252} size={12} color="var(--ink)" weight={600}>
          core api
        </Label>
        <Label x={160} y={272} size={9.5}>
          authz on every route
        </Label>
        <Label x={160} y={287} size={9.5}>
          per-tenant config
        </Label>
        <Label x={160} y={302} size={9.5}>
          fixed response shape
        </Label>
      </Box>

      <Label x={172} y={338} size={9} color="var(--accent)" anchor="start">
        oauth 2.0
      </Label>

      <Box x={72} y={360} w={176} h={40}>
        <Label x={160} y={381} size={11} color="var(--ink)" weight={600}>
          oracle ccs
        </Label>
      </Box>
    </svg>
  );
}

export function ControlPlanePortrait() {
  const rows = TENANTS.map((_, i) => 196 + i * 28);
  const lastCy = rows[rows.length - 1] + 11;
  return (
    <svg viewBox="0 0 320 424" role="img" aria-label={captions["control-plane"]} className="block w-full">
      <Line d="M160 56 V88" />
      <Line d={`M160 152 V${lastCy}`} />
      {rows.map((y, i) => (
        <Line key={i} d={`M160 ${y + 11} H180`} />
      ))}

      <Packet d="M160 56 V88" dur="2s" />
      {rows.map((y, i) => (
        <Packet key={i} d={`M160 152 V${y + 11} H180`} dur="2.6s" delay={`${(0.6 + (i * 2.2) / TENANTS.length).toFixed(2)}s`} />
      ))}

      <Box x={40} y={12} w={240} h={44}>
        <Label x={160} y={28} size={10.5} color="var(--ink)" weight={600}>
          provisioning dashboard
        </Label>
        <Label x={160} y={44} size={9}>
          plan · apply · drift · tags · cost
        </Label>
      </Box>

      <Box x={24} y={88} w={272} h={64}>
        <Label x={160} y={106} size={11} color="var(--ink)" weight={600}>
          terraform control-plane · 9 stacks
        </Label>
        <Label x={160} y={124} size={8.5}>
          {RESOURCES[0]}
        </Label>
        <Label x={160} y={138} size={8.5}>
          {RESOURCES[1]}
        </Label>
      </Box>

      {TENANTS.map((t, i) => (
        <Box key={t} x={180} y={rows[i]} w={120} h={22}>
          <Label x={240} y={rows[i] + 12} size={9} color="var(--body)">
            {t}
          </Label>
        </Box>
      ))}
      <Label x={148} y={rows[3] + 11} size={8.5} anchor="end">
        {TENANTS.length} production
      </Label>
      <Label x={148} y={rows[3] + 24} size={8.5} anchor="end">
        tenants
      </Label>
      <Label x={160} y={412} size={8.5}>
        templated · repeatable · cost-attributed
      </Label>
    </svg>
  );
}

export function AiSdlcPortrait() {
  const stage = (y: number, text: string, color = "var(--body)") => (
    <Box x={90} y={y} w={140} h={28}>
      <Label x={160} y={y + 15} size={9.5} color={color}>
        {text}
      </Label>
    </Box>
  );
  return (
    <svg viewBox="0 0 320 484" role="img" aria-label={captions["ai-sdlc"]} className="block w-full">
      <Label x={12} y={20} size={9} anchor="start">
        AUTO-REMEDIATION · shelved aug 2026
      </Label>
      <Line d="M160 60 V76" />
      <Line d="M160 104 V120" />
      <Line d="M160 148 V164" />
      <Packet d="M160 32 V192" dur="5s" />
      {stage(32, "alert")}
      {stage(76, "bedrock triage")}
      {stage(120, "fix pr")}
      {stage(164, "human review")}

      <Label x={12} y={226} size={9} anchor="start">
        TICKET → MERGE
      </Label>
      <Line d="M160 266 V282" />
      <Line d="M160 310 V318" />
      <Line d="M160 340 V348" />
      <Line d="M160 376 V384" />
      <Line d="M160 406 V414" />
      <Packet d="M160 238 V442" dur="6.5s" delay="1s" approve />
      {stage(238, "ticket")}
      {stage(282, "plan")}
      <GateBeside x={160} y={329} />
      {stage(348, "draft pr")}
      <GateBeside x={160} y={395} />
      {stage(414, "merge", "var(--ok)")}

      <Label x={160} y={466} size={8.5}>
        every step reversible · humans own every gate
      </Label>
    </svg>
  );
}

export function NmblrPortrait() {
  const entities = [
    { x: 12, cx: 58, label: "belief shift" },
    { x: 114, cx: 160, label: "narrative" },
    { x: 216, cx: 262, label: "landscape" },
  ];
  return (
    <svg viewBox="0 0 320 372" role="img" aria-label={captions["nmblr"]} className="block w-full">
      <Line d="M160 48 V72" />
      <Line d="M160 108 V132" />
      <Line d="M160 168 V196" />
      <Line d="M160 248 V272" />
      <Line d="M58 272 H262" />
      {entities.map((e) => (
        <Line key={e.label} d={`M${e.cx} 272 V296`} />
      ))}

      <Packet d="M160 48 V72" dur="1.6s" />
      <Packet d="M160 108 V132" dur="1.6s" delay="0.8s" />
      <Packet d="M160 168 V196" dur="1.4s" delay="1.6s" />
      {entities.map((e, i) => (
        <Packet key={e.label} d={`M160 248 V272 H${e.cx} V296`} dur="2.4s" delay={`${0.2 + i * 0.7}s`} />
      ))}
      <circle
        r={3.5}
        fill="var(--ok)"
        className="packet"
        style={{ offsetPath: 'path("M58 296 V272 H160 V248")', animationDuration: "2.4s", animationDelay: "2.3s" }}
      />

      <Box x={60} y={12} w={200} h={36}>
        <Label x={160} y={26} size={10.5} color="var(--ink)" weight={600}>
          finalised strategy
        </Label>
        <Label x={160} y={40} size={8.5}>
          the source of truth
        </Label>
      </Box>
      <Box x={60} y={72} w={200} h={36}>
        <Label x={160} y={86} size={10.5} color="var(--ink)" weight={600}>
          clone engine
        </Label>
        <Label x={160} y={100} size={8.5} color="var(--accent)">
          walks prisma dmmf
        </Label>
      </Box>
      <Box x={60} y={132} w={200} h={36}>
        <Label x={160} y={146} size={10.5} color="var(--ink)" weight={600}>
          new strategy
        </Label>
        <Label x={160} y={160} size={8.5}>
          schema-complete copy
        </Label>
      </Box>

      <Box x={40} y={196} w={240} h={52}>
        <Label x={160} y={214} size={11} color="var(--ink)" weight={600}>
          dependency registry
        </Label>
        <Label x={160} y={230} size={8.5}>
          warns before archive or delete
        </Label>
        <Label x={160} y={242} size={8.5}>
          graphql contract + resolver
        </Label>
      </Box>

      <Label x={168} y={260} size={8.5} color="var(--accent)" anchor="start">
        archive cascades
      </Label>
      <Label x={152} y={260} size={8.5} color="var(--ok)" anchor="end">
        restore returns
      </Label>

      {entities.map((e) => (
        <Box key={e.label} x={e.x} y={296} w={92} h={40}>
          <Label x={e.cx} y={311} size={9.5} color="var(--ink)" weight={600}>
            {e.label}
          </Label>
          <Label x={e.cx} y={325} size={8}>
            per-group finalise
          </Label>
        </Box>
      ))}
    </svg>
  );
}

export function CcsKbPortrait() {
  return (
    <svg viewBox="0 0 320 364" role="img" aria-label={captions["ccs-kb"]} className="block w-full">
      <Line d="M160 44 V68" />
      <Line d="M160 100 V312" />
      <Line d="M82 124 H238" />
      <Line d="M82 124 V140" />
      <Line d="M238 124 V140" />
      <Line d="M82 196 V228" />
      <Line d="M238 196 V228" />

      <Packet d="M160 44 V68" dur="1.4s" />
      <Packet d="M160 100 V124 H82 V140" dur="2.2s" delay="0.5s" />
      <Packet d="M160 100 V124 H238 V140" dur="2.2s" delay="2.6s" />
      <Packet d="M238 196 V228" dur="1.4s" delay="1.2s" />
      <Packet d="M82 228 V196" dur="1.8s" delay="2.2s" />
      <circle
        r={3.5}
        fill="var(--ok)"
        className="packet"
        style={{ offsetPath: 'path("M160 124 V312")', animationDuration: "2.4s", animationDelay: "1.6s" }}
      />

      <Box x={90} y={12} w={140} h={32}>
        <Label x={160} y={29} size={10.5} color="var(--ink)" weight={600}>
          question
        </Label>
      </Box>
      <Box x={70} y={68} w={180} h={32}>
        <Label x={160} y={85} size={11} color="var(--ink)" weight={600}>
          kb agent
        </Label>
      </Box>

      <Box x={COL.l} y={140} w={COL.w} h={56}>
        <Label x={82} y={157} size={10} color="var(--ink)" weight={600}>
          curated corpus
        </Label>
        <Label x={82} y={172} size={8.5}>
          retrieve + generate
        </Label>
        <Label x={82} y={185} size={8.5} color="var(--ok)">
          default path
        </Label>
      </Box>
      <Box x={COL.r} y={140} w={COL.w} h={56}>
        <Label x={238} y={157} size={10} color="var(--ink)" weight={600}>
          generated sql
        </Label>
        <Label x={238} y={172} size={8.5} color="var(--accent)">
          flag + permission
        </Label>
        <Label x={238} y={185} size={8.5}>
          kill-switch to curated-only
        </Label>
      </Box>

      <Box x={COL.l} y={228} w={COL.w} h={44}>
        <Label x={82} y={244} size={10} color="var(--ink)" weight={600}>
          s3 corpus
        </Label>
        <Label x={82} y={259} size={8.5}>
          scheduled refresh
        </Label>
      </Box>
      <Box x={COL.r} y={228} w={COL.w} h={44}>
        <Label x={238} y={244} size={10} color="var(--ink)" weight={600}>
          oracle ccs
        </Label>
        <Label x={238} y={259} size={8.5}>
          tenant-scoped
        </Label>
      </Box>

      <Label x={160} y={292} size={8.5}>
        never claims absence
      </Label>

      <Box x={90} y={312} w={140} h={40}>
        <Label x={160} y={327} size={10.5} color="var(--ink)" weight={600}>
          answer
        </Label>
        <Label x={160} y={342} size={8.5} color="var(--ok)">
          cited + badged
        </Label>
      </Box>
    </svg>
  );
}

export function ObservabilityPortrait() {
  const cols = [
    { x: 12, cx: 58 },
    { x: 114, cx: 160 },
    { x: 216, cx: 262 },
  ];
  const sources = ["tenant portals", "core api", "providers"];
  const tiers = [
    { name: "admin writes", keep: "365 days" },
    { name: "admin reads", keep: "90 days" },
    { name: "telemetry", keep: "90 days" },
  ];
  return (
    <svg viewBox="0 0 320 356" role="img" aria-label={captions["observability"]} className="block w-full">
      {cols.map((c) => (
        <Line key={c.cx} d={`M${c.cx} 40 V64`} />
      ))}
      <Line d="M58 64 H262" />
      <Line d="M160 64 V96" />
      <Line d="M160 144 V168" />
      <Line d="M160 212 V240" />
      <Line d="M58 240 H262" />
      {cols.map((c) => (
        <Line key={`t${c.cx}`} d={`M${c.cx} 240 V264`} />
      ))}

      {cols.map((c, i) => (
        <Packet key={c.cx} d={`M${c.cx} 40 V64 H160 V96`} dur="2.4s" delay={`${i * 0.8}s`} />
      ))}
      <circle
        r={3.5}
        fill="var(--ok)"
        className="packet"
        style={{ offsetPath: 'path("M160 144 V168")', animationDuration: "1.6s", animationDelay: "1.2s" }}
      />
      {cols.map((c, i) => (
        <Packet key={`p${c.cx}`} d={`M160 212 V240 H${c.cx} V264`} dur="2.2s" delay={`${0.4 + i * 0.6}s`} />
      ))}

      {sources.map((s, i) => (
        <Box key={s} x={cols[i].x} y={12} w={92} h={28}>
          <Label x={cols[i].cx} y={27} size={9} color="var(--body)">
            {s}
          </Label>
        </Box>
      ))}

      <Box x={40} y={96} w={240} h={48}>
        <Label x={160} y={113} size={11} color="var(--ink)" weight={600}>
          capture layer
        </Label>
        <Label x={160} y={130} size={9}>
          deep-redacted payloads · 156,656 events/day
        </Label>
      </Box>
      <Box x={40} y={168} w={240} h={44}>
        <Label x={160} y={184} size={10} color="var(--ink)" weight={600}>
          account to ip fan-out
        </Label>
        <Label x={160} y={200} size={9} color="var(--ok)">
          takeover alert
        </Label>
      </Box>

      {tiers.map((t, i) => (
        <Box key={t.name} x={cols[i].x} y={264} w={92} h={44}>
          <Label x={cols[i].cx} y={280} size={9} color="var(--ink)" weight={600}>
            {t.name}
          </Label>
          <Label x={cols[i].cx} y={295} size={8.5} color="var(--accent)">
            kept {t.keep}
          </Label>
        </Box>
      ))}
      <Label x={160} y={336} size={8.5}>
        benign auth failures folded out of the error rate
      </Label>
    </svg>
  );
}

export function IdentityPortrait() {
  return (
    <svg viewBox="0 0 320 300" role="img" aria-label={captions["identity"]} className="block w-full">
      {/* the path that was removed: browser straight to the identity provider */}
      <path d="M230 32 H300 V220 H308" fill="none" stroke="var(--line)" strokeWidth={1} strokeDasharray="4 4" />
      <Line d="M160 52 V100" />
      <Line d="M160 140 V172" />
      <Line d="M82 172 H238" />
      <Line d="M82 172 V200" />
      <Line d="M238 172 V200" />

      <Packet d="M160 52 V100" dur="1.6s" />
      <Packet d="M160 140 V172 H82 V200" dur="1.8s" delay="0.8s" />
      <Packet d="M160 140 V172 H238 V200" dur="1.8s" delay="1.4s" />

      <g>
        <line x1={294} y1={114} x2={306} y2={126} stroke="var(--muted)" strokeWidth={1.5} />
        <line x1={306} y1={114} x2={294} y2={126} stroke="var(--muted)" strokeWidth={1.5} />
      </g>
      <Label x={288} y={96} size={8.5} anchor="end">
        no direct access
      </Label>

      <Box x={90} y={12} w={140} h={40}>
        <Label x={160} y={27} size={10.5} color="var(--ink)" weight={600}>
          browser
        </Label>
        <Label x={160} y={42} size={8.5}>
          holds no credentials
        </Label>
      </Box>
      <Box x={80} y={100} w={160} h={40}>
        <Label x={160} y={115} size={11} color="var(--ink)" weight={600}>
          core api
        </Label>
        <Label x={160} y={130} size={8.5} color="var(--accent)">
          permissions declared once
        </Label>
      </Box>
      <Box x={COL.l} y={200} w={COL.w} h={40}>
        <Label x={82} y={215} size={10.5} color="var(--ink)" weight={600}>
          oracle ccs
        </Label>
        <Label x={82} y={230} size={8.5}>
          identity verification
        </Label>
      </Box>
      <Box x={COL.r} y={200} w={COL.w} h={40}>
        <Label x={238} y={215} size={10.5} color="var(--ink)" weight={600}>
          cognito
        </Label>
        <Label x={238} y={230} size={8.5}>
          real client ip forwarded
        </Label>
      </Box>

      <Label x={160} y={268} size={8.5}>
        registration: lockout on repeat attempts,
      </Label>
      <Label x={160} y={282} size={8.5}>
        zip disambiguation on the last-four space
      </Label>
    </svg>
  );
}

export const portraits = {
  "core-api": CoreApiPortrait,
  "control-plane": ControlPlanePortrait,
  "ai-sdlc": AiSdlcPortrait,
  nmblr: NmblrPortrait,
  "ccs-kb": CcsKbPortrait,
  observability: ObservabilityPortrait,
  identity: IdentityPortrait,
} as const;

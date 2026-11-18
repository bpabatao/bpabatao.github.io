import { Box, Label, Line, Packet, RESOURCES, TENANTS, captions } from "./diagrams";

/* Portrait variants for phones: a 320-unit canvas rendered near 1:1 on a 390px screen, so 9-unit
   labels stay legible. Same nodes, same packets, same captions as the landscape diagrams - only the
   flow runs top to bottom. */

const COL = { l: 12, r: 168, w: 140 } as const; // two-column grid inside a 320 canvas

const GENS = [
  { x: COL.l, cx: COL.l + COL.w / 2, name: "core api v1", lines: ["6 of 7 launched", "express", "patched + audited"] },
  { x: COL.r, cx: COL.r + COL.w / 2, name: "core api v2", lines: ["7th + 1st migration", "account-route authz", "per-tenant config"] },
] as const;

export function CoreApiPortrait() {
  const rows = TENANTS.map((_, i) => 12 + i * 28);
  const last = rows[rows.length - 1] + 11;
  const [v1, v2] = GENS;
  return (
    <svg viewBox="0 0 320 420" role="img" aria-label={captions["core-api"]} className="block w-full">
      {rows.map((y, i) => (
        <Line key={i} d={`M132 ${y + 11} H160`} />
      ))}
      <Line d={`M160 23 V216 M${v1.cx} 216 H${v2.cx} M${v1.cx} 216 V232 M${v2.cx} 216 V232`} />
      <Line d={`M${v1.cx} 316 V332 M${v2.cx} 316 V332 M${v1.cx} 332 H${v2.cx} M160 332 V360`} />
      <path d={`M${COL.l + COL.w} 274 H${COL.r}`} fill="none" stroke="var(--accent)" strokeWidth={1} strokeDasharray="4 4" />

      {rows.map((y, i) => (
        <Packet key={i} d={`M132 ${y + 11} H160 V216 H${v1.cx} V232`} dur="3.2s" delay={`${((i * 3.2) / TENANTS.length).toFixed(2)}s`} />
      ))}
      <Packet d={`M160 216 H${v2.cx} V232`} dur="1.4s" delay="1.2s" />
      <Packet d="M160 332 V360" dur="1.2s" delay="0.5s" />
      <circle
        r={3.5}
        fill="var(--ok)"
        className="packet"
        style={{ offsetPath: 'path("M160 360 V332")', animationDuration: "1.2s", animationDelay: "1.4s" }}
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
      <Label x={172} y={last + 15} size={8.5} color="var(--accent)" anchor="start">
        v1 → v2 on parity
      </Label>

      {GENS.map((g) => (
        <Box key={g.name} x={g.x} y={232} w={COL.w} h={84}>
          <Label x={g.cx} y={252} size={11} color="var(--ink)" weight={600}>
            {g.name}
          </Label>
          {g.lines.map((l, i) => (
            <Label key={l} x={g.cx} y={272 + i * 15} size={9}>
              {l}
            </Label>
          ))}
        </Box>
      ))}

      <Label x={172} y={346} size={9} color="var(--accent)" anchor="start">
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
      <Line dashed d={`M160 152 V${lastCy}`} />
      {rows.map((y, i) => (
        <Line dashed key={i} d={`M160 ${y + 11} H180`} />
      ))}

      {/* no packets to the tenants: the live fleet still runs on its earlier per-portal Terraform */}
      <Packet d="M160 56 V88" dur="2s" />

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
        {TENANTS.length} live
      </Label>
      <Label x={148} y={rows[3] + 24} size={8.5} anchor="end">
        tenants
      </Label>
      <Label x={160} y={412} size={8.5}>
        dashed: migrating onto it, tenant by tenant
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
    <svg viewBox="0 0 320 316" role="img" aria-label={captions["observability"]} className="block w-full">
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
        <Label x={160} y={121} size={11} color="var(--ink)" weight={600}>
          capture layer
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
    </svg>
  );
}

export const portraits = {
  "core-api": CoreApiPortrait,
  "control-plane": ControlPlanePortrait,
  nmblr: NmblrPortrait,
  observability: ObservabilityPortrait,
} as const;

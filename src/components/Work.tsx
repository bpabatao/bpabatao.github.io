import { credentials, currentJobs, earlierJobs } from "@/data/content";
import { formatPeriod, splitLead } from "@/lib/format";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

/* The head of the list carries the case; the tail is evidence for the reader who wants it. */
const DEFAULT_VISIBLE = 6;

function Bullet({ text }: { text: string }) {
  const { lead, rest } = splitLead(text);
  return lead ? (
    <span>
      <b className="font-semibold text-ink">{lead}</b> {rest}
    </span>
  ) : (
    <span>{rest}</span>
  );
}

function Receipts({ items, className }: { items: string[]; className: string }) {
  return (
    <ul className={`space-y-2.5 ${className}`}>
      {items.map((r) => (
        <li key={r} className="flex gap-3 leading-relaxed">
          <span className="mt-2.5 h-px w-3 shrink-0 bg-accent" aria-hidden />
          <Bullet text={r} />
        </li>
      ))}
    </ul>
  );
}

export function Work() {
  return (
    <section id="work" aria-labelledby="work-heading" className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <SectionHeading
          id="work"
          title="Experience"
          annotation={`${earlierJobs[earlierJobs.length - 1].period.start.slice(0, 4)} - present`}
        />
        <div className="space-y-14">
          {currentJobs.map((job, i) => {
            const lede = job.lede ? job.receipts[0] : null;
            const bullets = job.lede ? job.receipts.slice(1) : job.receipts;
            const visible = job.visible ?? DEFAULT_VISIBLE;
            return (
            <Reveal key={job.id} delay={i * 0.05} className="grid gap-4 md:grid-cols-[190px_1fr] md:gap-8">
              <div className="font-mono text-xs leading-relaxed text-muted">
                <div>{formatPeriod(job.period)}</div>
                {job.location && <div className="mt-1">{job.location}</div>}
              </div>
              <div>
                {/* company heads the block; the titles held there follow, so neither repeats */}
                <h3 className="text-xl font-semibold text-ink">
                  {job.company}
                  {job.employmentType && (
                    <span className="font-mono text-xs font-normal text-muted"> · {job.employmentType.toLowerCase()}</span>
                  )}
                </h3>
                <ul className="mt-1 space-y-0.5 text-sm text-body">
                  {(job.positions ?? [{ title: job.role, period: job.period }]).map((p) => (
                    <li key={p.title}>
                      <span className="font-medium text-ink">{p.title}</span>
                      {job.positions && job.positions.length > 1 && (
                        <span className="font-mono text-xs text-muted"> · {formatPeriod(p.period)}</span>
                      )}
                    </li>
                  ))}
                </ul>
                {lede && <p className="mt-4 leading-relaxed text-ink">{lede}</p>}
                <Receipts items={bullets.slice(0, visible)} className="mt-4" />
                {bullets.length > visible && (
                  <details className="group mt-2.5">
                    <summary className="cursor-pointer list-none font-mono text-xs text-muted transition-colors hover:text-accent print:hidden">
                      <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
                        ▸
                      </span>{" "}
                      <span className="group-open:hidden">
                        {`show ${bullets.length - visible} more`}
                        <span className="sr-only"> for this role</span>
                      </span>
                      <span className="hidden group-open:inline">show fewer</span>
                    </summary>
                    <Receipts items={bullets.slice(visible)} className="mt-2.5" />
                  </details>
                )}
                {job.stack && (
                  <div className="mt-4 font-mono text-[11px] text-muted">{job.stack.join(" · ")}</div>
                )}
              </div>
            </Reveal>
            );
          })}
        </div>

        <Reveal className="mt-14">
          <details className="group">
            <summary className="cursor-pointer list-none font-mono text-sm text-muted transition-colors hover:text-accent">
              <span className="inline-block transition-transform group-open:rotate-90" aria-hidden>
                ▸
              </span>{" "}
              earlier roles ({earlierJobs.length})
            </summary>
            <div className="mt-6 space-y-5 border-l border-line pl-5">
              {earlierJobs.map((job) => (
                <div key={job.id} className="grid gap-1 md:grid-cols-[170px_1fr] md:gap-8">
                  <div className="font-mono text-xs text-muted md:pt-0.5">{formatPeriod(job.period)}</div>
                  <div>
                    <span className="font-medium text-ink">{job.role}</span>
                    <span className="text-muted">
                      {" - "}
                      {job.company}
                      {job.employmentType ? ` (${job.employmentType.toLowerCase()})` : ""}.{" "}
                    </span>
                    <span className="text-muted">{job.receipts[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </Reveal>

        <Reveal className="mt-10 border-t border-line pt-8">
          {credentials.map((c) => (
            <div key={c.title} className="grid gap-1 md:grid-cols-[190px_1fr] md:gap-8">
              <div className="font-mono text-xs text-muted">{c.period}</div>
              <div>
                <span className="font-medium text-ink">{c.title}</span>
                <span className="text-muted"> - {c.detail}</span>
              </div>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

import { currentJobs, earlierJobs } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function Work() {
  return (
    <section id="work" className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <SectionHeading title="Experience" annotation="2018 - present" />
        <div className="space-y-14">
          {currentJobs.map((job, i) => (
            <Reveal key={job.company} delay={i * 0.05} className="grid gap-4 md:grid-cols-[190px_1fr] md:gap-8">
              <div className="font-mono text-xs leading-relaxed text-muted">
                <div>{job.period}</div>
                {job.location && <div className="mt-1">{job.location}</div>}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-ink">{job.role}</h3>
                <div className="mt-0.5 font-mono text-sm text-accent">{job.company}</div>
                <ul className="mt-4 space-y-2.5">
                  {job.receipts.map((r) => (
                    <li key={r} className="flex gap-3 leading-relaxed">
                      <span className="mt-2.5 h-px w-3 shrink-0 bg-accent" aria-hidden />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
                {job.stack && (
                  <div className="mt-4 font-mono text-[11px] text-muted">{job.stack.join(" · ")}</div>
                )}
              </div>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-14">
          <details className="group">
            <summary className="cursor-pointer list-none font-mono text-sm text-muted transition-colors hover:text-accent">
              <span className="inline-block transition-transform group-open:rotate-90">▸</span> earlier roles ({earlierJobs.length})
            </summary>
            <div className="mt-6 space-y-5 border-l border-line pl-5">
              {earlierJobs.map((job) => (
                <div key={job.company} className="grid gap-1 md:grid-cols-[170px_1fr] md:gap-8">
                  <div className="font-mono text-xs text-muted md:pt-0.5">{job.period}</div>
                  <div>
                    <span className="font-medium text-ink">{job.role}</span>
                    <span className="text-muted"> - {job.company}. </span>
                    <span className="text-muted">{job.receipts[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </Reveal>
      </div>
    </section>
  );
}

import Link from "next/link";
import { earlierProjects, flagships, fleetPortals, secondaryProjects, type SecondaryProject } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

function ProjectList({ label, projects }: { label: string; projects: SecondaryProject[] }) {
  return (
    <Reveal className="mt-12">
      <details className="group">
        <summary className="cursor-pointer list-none font-mono text-sm text-muted transition-colors hover:text-accent">
          <span className="inline-block transition-transform group-open:rotate-90">▸</span> {`${label.toLowerCase()} (${projects.length})`}
        </summary>
        <div className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2">
          {projects.map((p) => (
            <div key={p.title}>
              {p.url ? (
                <a href={p.url} target="_blank" rel="noopener" className="font-medium text-ink transition-colors hover:text-accent">
                  {p.title}<span className="whitespace-nowrap"> ↗</span><span className="sr-only"> (opens in new tab)</span>
                </a>
              ) : (
                <span className="font-medium text-ink">{p.title}</span>
              )}
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.description}</p>
            </div>
          ))}
        </div>
      </details>
    </Reveal>
  );
}

export function Projects() {
  return (
    <section id="projects" aria-labelledby="projects-heading" className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <SectionHeading
          id="projects"
          title="Selected work"
          annotation={`${flagships.length} case studies · ${fleetPortals.length} portals · ${secondaryProjects.length + earlierProjects.length} more`}
        />

        <div>
          {flagships.filter((p) => p.featured).map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.05} className="border-t border-line first:border-t-0">
              <Link
                href={`/case/${p.slug}/`}
                data-goatcounter-click={`case-${p.slug}`}
                className="group grid gap-4 py-9 transition-colors md:grid-cols-[1fr_auto] md:items-start"
              >
                <div>
                  <h3 className="font-display text-2xl font-semibold tracking-tight text-ink transition-colors group-hover:text-accent">
                    {p.title}
                  </h3>
                  <p className="mt-3 max-w-2xl leading-relaxed">{p.outcome}</p>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px]">
                    <span className="text-accent">{p.ownership}</span>
                    <span className="text-muted">{p.stack.join(" · ")}</span>
                  </div>
                </div>
                <span className="font-mono text-sm text-muted transition-all group-hover:translate-x-1 group-hover:text-accent md:pt-2">
                  case study →
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-12 border-t border-line pt-8">
          <h3 className="font-mono text-xs tracking-wide text-muted uppercase">More case studies</h3>
          <div className="mt-5 grid gap-x-10 gap-y-5 sm:grid-cols-2">
            {flagships
              .filter((p) => !p.featured)
              .map((p) => (
                <Link
                  key={p.slug}
                  href={`/case/${p.slug}/`}
                  data-goatcounter-click={`case-${p.slug}`}
                  className="group block"
                >
                  <span className="font-medium text-ink transition-colors group-hover:text-accent">
                    {p.title}
                  </span>
                  <span className="font-mono text-sm text-muted transition-colors group-hover:text-accent"> →</span>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{p.outcome}</p>
                </Link>
              ))}
          </div>
        </Reveal>

        <Reveal className="mt-16">
          <h3 className="font-mono text-xs tracking-wide text-muted uppercase">Fleet portals</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {fleetPortals.length} tenant portals in production on the core API and control-plane.
          </p>
          <div className="mt-5 grid gap-x-8 gap-y-4 grid-cols-2 md:grid-cols-4">
            {fleetPortals.map((p, i) => (
              <div key={p.tenant}>
                <div className="flex items-center gap-2 text-sm font-medium text-ink">
                  <span
                    className="portal-dot size-1.5 shrink-0 rounded-full bg-ok"
                    style={{ animationDelay: `${i * 0.3}s` }}
                    aria-hidden
                  />
                  {p.tenant}
                </div>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener"
                  className="no-print-url font-mono text-xs break-words text-muted transition-colors hover:text-accent"
                >
                  {p.url.replace("https://", "")}<span className="whitespace-nowrap"> ↗</span><span className="sr-only"> (opens in new tab)</span>
                </a>
              </div>
            ))}
          </div>
        </Reveal>

        <ProjectList label="Also shipped" projects={secondaryProjects} />
        <ProjectList label="Earlier work" projects={earlierProjects} />
      </div>
    </section>
  );
}

import Link from "next/link";
import { flagships, secondaryProjects } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function Projects() {
  return (
    <section id="projects" className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <SectionHeading title="Selected work" annotation="3 case studies · 6 more shipped" />

        <div>
          {flagships.map((p, i) => (
            <Reveal key={p.slug} delay={i * 0.05}>
              <Link
                href={`/case/${p.slug}/`}
                className="group grid gap-4 border-t border-line py-9 transition-colors md:grid-cols-[1fr_auto] md:items-start first:border-t-0"
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

        <Reveal className="mt-16">
          <h3 className="font-mono text-xs tracking-wide text-muted uppercase">Also shipped</h3>
          <div className="mt-6 grid gap-x-10 gap-y-7 sm:grid-cols-2">
            {secondaryProjects.map((p) => (
              <div key={p.title}>
                {p.url ? (
                  <a href={p.url} target="_blank" rel="noopener" className="font-medium text-ink transition-colors hover:text-accent">
                    {p.title} ↗
                  </a>
                ) : (
                  <span className="font-medium text-ink">{p.title}</span>
                )}
                <p className="mt-1 text-sm leading-relaxed text-muted">{p.description}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cases } from "@/data/cases";
import { ogImage } from "@/lib/og";
import { profile } from "@/data/content";
import { AiSdlcDiagram, CcsKbDiagram, ControlPlaneDiagram, CoreApiDiagram, IdentityDiagram, NmblrDiagram, ObservabilityDiagram, captions } from "@/components/diagrams";
import { portraits } from "@/components/diagrams-portrait";
import { Unbroken } from "@/components/Projects";

const diagrams = {
  "core-api": CoreApiDiagram,
  "control-plane": ControlPlaneDiagram,
  "ai-sdlc": AiSdlcDiagram,
  "nmblr": NmblrDiagram,
  "ccs-kb": CcsKbDiagram,
  "observability": ObservabilityDiagram,
  "identity": IdentityDiagram,
} as const;

const headingId = (heading: string) => `${heading.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-heading`;

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cs = cases.find((c) => c.slug === slug);
  if (!cs) return {};
  const url = `/case/${cs.slug}/`;
  const image = ogImage(`/og/${cs.slug}.png`, cs.title);
  return {
    title: cs.title,
    description: cs.subtitle,
    alternates: { canonical: url },
    openGraph: { url, title: cs.title, description: cs.subtitle, images: [image], type: "article", siteName: profile.name },
    twitter: { card: "summary_large_image", title: cs.title, description: cs.subtitle, images: [image] },
  };
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const cs = cases.find((c) => c.slug === slug);
  if (!cs) notFound();

  const next = cases[(cases.indexOf(cs) + 1) % cases.length];
  const Diagram = diagrams[cs.slug as keyof typeof diagrams];
  const Portrait = portraits[cs.slug as keyof typeof portraits];
  /* Problem and Constraints, then the judgment calls, then how it is built */
  const split = cs.sections.findIndex((s) => s.heading === "Architecture");
  const head = cs.sections.slice(0, split);
  const tail = cs.sections.slice(split);
  const renderSection = (section: (typeof cs.sections)[number]) => (
    <section key={section.heading} aria-labelledby={headingId(section.heading)} className="mt-12">
      <h2 id={headingId(section.heading)} className="font-display text-2xl font-semibold tracking-normal text-ink">{section.heading}</h2>
      {section.paragraphs.map((p) => (
        <p key={p.slice(0, 32)} className="mt-4 leading-relaxed">
          {p}
        </p>
      ))}
    </section>
  );

  return (
    <main id="main" className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link href="/#projects" className="font-mono text-xs text-muted transition-colors hover:text-accent">
        ← back to index
      </Link>

      <h1 className="mt-8 font-display text-4xl font-semibold tracking-normal text-ink sm:text-5xl">
        <Unbroken text={cs.title} />
      </h1>
      <p className="mt-4 text-lg leading-relaxed">{cs.subtitle}</p>

      <dl className="mt-10 grid gap-x-8 gap-y-4 border border-line bg-surface p-6 sm:grid-cols-2">
        {[
          ["Role", cs.meta.role],
          ["Period", cs.meta.period],
          ["Ownership", cs.meta.ownership],
          ["Stack", cs.meta.stack.join(" · ")],
        ].filter(([k, v]) => k !== "Ownership" || v !== cs.meta.role).map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-[11px] tracking-wide text-muted uppercase">{k}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-body">{v}</dd>
          </div>
        ))}
      </dl>

      {/* Landscape needs ~560px for legible labels; phones get the portrait layout of the same diagram. */}
      {/* phones get less padding so the 320-unit portrait renders near 1:1 */}
      <figure className="mt-10 border border-line bg-surface p-3 sm:p-6">
        <div className="hidden sm:block">
          <Diagram />
        </div>
        <div className="mx-auto max-w-xs sm:hidden">
          <Portrait />
        </div>
        <figcaption className="mt-4 font-mono text-xs leading-relaxed text-muted sm:hidden">{captions[cs.slug as keyof typeof captions]}</figcaption>
      </figure>

      {head.map(renderSection)}

      {cs.decisions && (
        <section aria-labelledby="decisions-heading" className="mt-12">
          <h2 id="decisions-heading" className="font-display text-2xl font-semibold tracking-normal text-ink">Decisions</h2>
          <ul className="mt-4 space-y-2.5">
            {cs.decisions.map((d) => (
              <li key={d} className="flex gap-3 leading-relaxed">
                <span className="mt-2.5 h-px w-3 shrink-0 bg-accent" aria-hidden />
                <span>{d}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {tail.map(renderSection)}

      <section aria-labelledby="outcome-heading" className="mt-12">
        <h2 id="outcome-heading" className="font-display text-2xl font-semibold tracking-normal text-ink">Outcome</h2>
        <ul className="mt-4 space-y-2.5">
          {cs.outcomes.map((o) => (
            <li key={o} className="flex gap-3 leading-relaxed">
              <span className="mt-2.5 h-px w-3 shrink-0 bg-accent" aria-hidden />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* The reader is most convinced at the end of a case: give them somewhere to go. */}
      <nav aria-label="Case studies" className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-8 font-mono text-sm">
        <Link href="/#projects" className="text-muted transition-colors hover:text-accent">
          ← all projects
        </Link>
        <Link href={`/case/${next.slug}/`} rel="next" data-goatcounter-click={`next-${next.slug}`} className="text-ink transition-colors hover:text-accent">
          next case: {next.title} →
        </Link>
      </nav>
      <div className="mt-8 flex flex-wrap items-center gap-4">
        <a
          href="/resume.pdf"
          target="_blank"
          rel="noopener"
          data-goatcounter-click="resume-case"
          className="rounded-sm bg-accent px-5 py-2.5 font-mono text-sm font-medium text-accent-contrast transition-opacity hover:opacity-85"
        >
          view resume ↗<span className="sr-only"> (opens in new tab)</span>
        </a>
        <a
          href={`mailto:${profile.email}`}
          data-goatcounter-click="email-case"
          className="rounded-sm border border-line px-5 py-2.5 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
        >
          email me
        </a>
      </div>
    </main>
  );
}

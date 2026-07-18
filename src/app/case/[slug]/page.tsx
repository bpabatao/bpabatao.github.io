import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cases } from "@/data/cases";

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cs = cases.find((c) => c.slug === slug);
  return cs ? { title: cs.title, description: cs.subtitle } : {};
}

export default async function CasePage({ params }: Props) {
  const { slug } = await params;
  const cs = cases.find((c) => c.slug === slug);
  if (!cs) notFound();

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link href="/#projects" className="font-mono text-xs text-muted transition-colors hover:text-accent">
        ← back to index
      </Link>

      <div className="mt-8 font-mono text-xs tracking-wide text-accent uppercase">Case study</div>
      <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">{cs.title}</h1>
      <p className="mt-4 text-lg leading-relaxed">{cs.subtitle}</p>

      <dl className="mt-10 grid gap-x-8 gap-y-4 rounded-xl border border-line bg-surface p-6 sm:grid-cols-2">
        {[
          ["Role", cs.meta.role],
          ["Period", cs.meta.period],
          ["Ownership", cs.meta.ownership],
          ["Stack", cs.meta.stack.join(" · ")],
        ].map(([k, v]) => (
          <div key={k}>
            <dt className="font-mono text-[11px] tracking-wide text-muted uppercase">{k}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-body">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-10 overflow-x-auto rounded-xl border border-line bg-surface p-6">
        <pre className="font-mono text-xs leading-relaxed text-muted">{cs.diagram}</pre>
      </div>

      {cs.sections.map((section) => (
        <section key={section.heading} className="mt-12">
          <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">{section.heading}</h2>
          {section.paragraphs.map((p) => (
            <p key={p.slice(0, 32)} className="mt-4 leading-relaxed">
              {p}
            </p>
          ))}
        </section>
      ))}

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink">Outcome</h2>
        <ul className="mt-4 space-y-2.5">
          {cs.outcomes.map((o) => (
            <li key={o} className="flex gap-3 leading-relaxed">
              <span className="mt-2.5 h-px w-3 shrink-0 bg-accent" aria-hidden />
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-16 border-t border-line pt-8">
        <Link href="/#projects" className="font-mono text-sm text-muted transition-colors hover:text-accent">
          ← all projects
        </Link>
      </div>
    </main>
  );
}

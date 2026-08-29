import { profile } from "@/data/content";
import { shortMonthYear } from "@/lib/format";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function Contact() {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <SectionHeading id="contact" title="Contact" annotation="async-first · CET" />
        <Reveal>
          <p className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted">
            <span className="status-dot size-2 shrink-0 rounded-full bg-ok" aria-hidden />
            <span className="text-ok">ACCEPTING</span>
            <span>- {profile.availability}</span>
          </p>
          <a
            href={`mailto:${profile.email}`}
            data-goatcounter-click="email"
            className="mt-6 inline-block font-display text-3xl font-semibold tracking-tight text-ink underline decoration-accent decoration-2 underline-offset-8 transition-colors hover:text-accent sm:text-4xl"
          >
            {profile.email}
          </a>
          <div className="mt-8 flex gap-5 font-mono text-sm">
            <a className="link-sweep text-muted transition-colors hover:text-accent" href={profile.github} target="_blank" rel="noopener">
              github ↗<span className="sr-only"> (opens in new tab)</span>
            </a>
            <a
              className="link-sweep text-muted transition-colors hover:text-accent"
              href={profile.linkedin}
              target="_blank"
              rel="noopener"
              data-goatcounter-click="linkedin"
            >
              linkedin ↗<span className="sr-only"> (opens in new tab)</span>
            </a>
            <a
              className="link-sweep text-muted transition-colors hover:text-accent"
              href="/resume.pdf"
              target="_blank"
              rel="noopener"
              data-goatcounter-click="resume"
            >
              resume.pdf · {shortMonthYear(profile.updated)} ↗<span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

import { profile } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function Contact() {
  return (
    <section id="contact" className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <SectionHeading title="Contact" annotation="async-first · CET" />
        <Reveal>
          <p className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted">
            <span className="status-dot size-2 shrink-0 rounded-full bg-ok" aria-hidden />
            <span className="text-ok">ACCEPTING</span>
            <span>- STAFF/LEAD PLATFORM ROLES · CONSULTING · AWS / TERRAFORM / MULTI-TENANT</span>
          </p>
          <a
            href={`mailto:${profile.email}`}
            className="mt-6 inline-block font-display text-3xl font-semibold tracking-tight text-ink underline decoration-accent decoration-2 underline-offset-8 transition-colors hover:text-accent sm:text-4xl"
          >
            {profile.email}
          </a>
          <div className="mt-8 flex gap-5 font-mono text-sm">
            <a className="link-sweep text-muted transition-colors hover:text-accent" href={profile.github} target="_blank" rel="noopener">
              github ↗
            </a>
            <a className="link-sweep text-muted transition-colors hover:text-accent" href={profile.linkedin} target="_blank" rel="noopener">
              linkedin ↗
            </a>
            <a className="link-sweep text-muted transition-colors hover:text-accent" href="/resume.pdf" target="_blank" rel="noopener">
              resume.pdf · jul 2026 ↗
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

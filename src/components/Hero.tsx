import { metrics, profile } from "@/data/content";

/* Entrance is pure CSS (globals.css): the h1 animates transform-only so the
   largest paint lands at first paint - no hydration dependency. */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto w-full max-w-5xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20">
        <p className="flex items-center gap-2 font-mono text-[11px] tracking-wide text-muted sm:text-xs">
          <span className="status-dot size-2 shrink-0 rounded-full bg-ok" aria-hidden />
          <span className="status-text">
            <span className="text-ok">{profile.statusLine.split(" - ")[0]}</span> - {profile.statusLine.split(" - ").slice(1).join(" - ")}
          </span>
        </p>

        <h1 className="mt-7 max-w-4xl font-display text-5xl leading-[1.04] font-semibold tracking-tight text-ink sm:text-6xl md:text-7xl">
          <span className="hero-rise block">{profile.thesis.lead}</span>
          <span className="hero-rise block" style={{ animationDelay: "0.12s" }}>
            {profile.thesis.tail} <span className="text-accent">{profile.thesis.accent}</span>
          </span>
        </h1>

        <p className="hero-fade mt-6 max-w-2xl text-lg leading-relaxed" style={{ animationDelay: "0.2s" }}>
          {profile.heroLine}
        </p>

        <p className="hero-fade mt-4 max-w-2xl leading-relaxed text-ink" style={{ animationDelay: "0.28s" }}>
          {profile.availabilityLine}
        </p>

        <div className="hero-fade mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "0.35s" }}>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener"
            data-goatcounter-click="resume"
            className="rounded-sm bg-accent px-5 py-2.5 font-mono text-sm font-medium text-accent-contrast transition-opacity hover:opacity-85"
          >
            view resume ↗<span className="sr-only"> (opens in new tab)</span>
          </a>
          <a
            href={`mailto:${profile.email}`}
            data-goatcounter-click="email"
            className="rounded-sm border border-line px-5 py-2.5 font-mono text-sm font-medium text-ink transition-colors hover:border-accent hover:text-accent"
          >
            email me
          </a>
          <div className="flex gap-4 font-mono text-sm">
            <a className="link-sweep text-muted transition-colors hover:text-accent" href={profile.github} target="_blank" rel="noopener">
              github ↗<span className="sr-only"> (opens in new tab)</span>
            </a>
            <a className="link-sweep text-muted transition-colors hover:text-accent" href={profile.linkedin} target="_blank" rel="noopener" data-goatcounter-click="linkedin">
              linkedin ↗<span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>
        </div>

        <div
          className="hero-fade mt-16 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-line pt-8 sm:grid-cols-4"
          style={{ animationDelay: "0.5s" }}
        >
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="font-mono text-2xl text-ink sm:text-3xl">{m.value}</div>
              <div className="mt-1 font-mono text-[11px] tracking-wide text-muted uppercase">{m.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

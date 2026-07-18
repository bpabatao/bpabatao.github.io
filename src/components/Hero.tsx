import { metrics, profile } from "@/data/content";

/* Entrance is pure CSS (globals.css): the h1 animates transform-only so the
   largest paint lands at first paint - no hydration dependency. */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative mx-auto w-full max-w-5xl px-6 pt-24 pb-16 sm:pt-32 sm:pb-20">
        <p className="hero-status flex items-center gap-2 font-mono text-xs tracking-wide text-muted">
          <span className="status-dot size-2 shrink-0 rounded-full bg-ok" aria-hidden />
          <span className="text-ok">OPERATIONAL</span>
          <span>- 8 TENANTS · AWS · REMOTE (ITALY)</span>
        </p>

        <h1 className="hero-rise mt-7 max-w-4xl font-display text-5xl leading-[1.04] font-semibold tracking-tight text-ink sm:text-6xl md:text-7xl">
          I build the platform other engineers <span className="text-accent">ship on.</span>
        </h1>

        <p className="hero-fade mt-6 max-w-2xl text-lg leading-relaxed" style={{ animationDelay: "0.2s" }}>
          {profile.summary}
        </p>

        <div className="hero-fade mt-9 flex flex-wrap items-center gap-4" style={{ animationDelay: "0.35s" }}>
          <a
            href="/resume.pdf"
            target="_blank"
            rel="noopener"
            className="rounded-sm bg-accent px-5 py-2.5 font-mono text-sm font-medium text-accent-contrast transition-opacity hover:opacity-85"
          >
            view resume ↗
          </a>
          <div className="flex gap-4 font-mono text-sm">
            <a className="text-muted transition-colors hover:text-accent" href={profile.github} target="_blank" rel="noopener">
              github ↗
            </a>
            <a className="text-muted transition-colors hover:text-accent" href={profile.linkedin} target="_blank" rel="noopener">
              linkedin ↗
            </a>
            <a className="text-muted transition-colors hover:text-accent" href={`mailto:${profile.email}`}>
              email
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

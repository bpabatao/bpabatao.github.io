import { stackGroups } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function StackGrid() {
  return (
    <section id="stack" className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <SectionHeading title="Capabilities" annotation="cloud → frontend" />
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {stackGroups.map((group, i) => (
            <Reveal
              key={group.title}
              delay={i * 0.05}
              className={group.span === 2 ? "md:col-span-2" : ""}
            >
              <div className="h-full rounded-xl border border-line bg-surface p-5">
                <h3 className={`font-semibold ${group.title.startsWith("AI") ? "text-accent" : "text-ink"}`}>
                  {group.title}
                </h3>
                <ul className="mt-3 space-y-1.5">
                  {group.items.map((item) => (
                    <li key={item} className="font-mono text-xs leading-relaxed text-muted">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

import { principles } from "@/data/content";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

export function Approach() {
  return (
    <section id="approach" className="border-t border-line">
      <div className="mx-auto w-full max-w-5xl px-6 py-20">
        <SectionHeading title="Operating principles" annotation="how the work gets done" />
        <div className="grid gap-x-12 gap-y-10 md:grid-cols-2">
          {principles.map((p, i) => (
            <Reveal key={p.lead} delay={i * 0.06}>
              <h3 className="text-lg font-semibold text-ink">{p.lead}</h3>
              <p className="mt-2 max-w-prose leading-relaxed text-muted">{p.tail}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

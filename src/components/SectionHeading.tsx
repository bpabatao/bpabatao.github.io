import { Reveal } from "./Reveal";

export function SectionHeading({ title, annotation }: { title: string; annotation: string }) {
  return (
    <Reveal className="mb-10 flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{title}</h2>
      <span className="font-mono text-xs text-muted">{annotation}</span>
    </Reveal>
  );
}

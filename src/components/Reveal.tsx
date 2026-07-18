import type { ReactNode } from "react";

/* Scroll reveal via CSS view-timeline (globals.css): content is visible by
   default; browsers without support simply skip the animation. */
export function Reveal({
  children,
  delay: _delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return <div className={`reveal ${className}`}>{children}</div>;
}

import type { Period } from "@/data/content";

/* Shared by React components and the Node scripts in scripts/.
   Keep this file free of runtime imports - Node runs it with type stripping,
   so only the top-level `import type` above is allowed (it is erased). */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function monthLabel(ym: string): string {
  const m = /^(\d{4})(?:-(\d{2}))?$/.exec(ym);
  const month = m?.[2] ? Number(m[2]) : 0;
  if (!m || month > 12) throw new Error(`bad period value: ${ym}`);
  return month ? `${MONTHS[month - 1]} ${m[1]}` : m[1];
}

export function formatPeriod(p: Period): string {
  return `${monthLabel(p.start)} - ${p.end ? monthLabel(p.end) : "Present"}`;
}

/* Bullets may open with a bolded lead phrase written as **lead** rest. */
export function splitLead(text: string): { lead: string | null; rest: string } {
  const m = /^\*\*(.+?)\*\*\s*([\s\S]*)$/.exec(text);
  return m ? { lead: m[1], rest: m[2] } : { lead: null, rest: text };
}

export function plainText(text: string): string {
  const { lead, rest } = splitLead(text);
  return lead ? `${lead} ${rest}`.trim() : rest;
}

/* "2026-08-28" -> "aug 2026" (Contact.tsx label style) */
export function shortMonthYear(iso: string): string {
  return monthLabel(iso.slice(0, 7)).toLowerCase();
}

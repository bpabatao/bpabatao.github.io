/* The share cards render at this size; the metadata must agree or unfurlers guess. */
export const OG_SIZE = { width: 1200, height: 630 } as const;

export function ogImage(url: string, alt: string) {
  return { url, ...OG_SIZE, alt, type: "image/png" };
}

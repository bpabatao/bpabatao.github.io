import type { MetadataRoute } from "next";
import { cases } from "@/data/cases";
import { profile } from "@/data/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${profile.siteUrl}/`, priority: 1 },
    ...cases.map((c) => ({ url: `${profile.siteUrl}/case/${c.slug}/`, priority: 0.8 })),
  ];
}

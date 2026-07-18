import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { clash, satoshi, jetbrains } from "@/lib/fonts";
import { profile } from "@/data/content";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(profile.siteUrl),
  title: {
    default: "Benedict Pabatao - Lead Platform Engineer",
    template: "%s - Benedict Pabatao",
  },
  description:
    "Lead Platform Engineer. 8+ years in software, 5+ on AWS. Terraform control-plane, multi-tenant APIs, and AI-augmented tooling - owned end to end.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Benedict Pabatao - Lead Platform Engineer",
    description: "I build the platform other engineers ship on.",
    url: profile.siteUrl,
    siteName: "Benedict Pabatao",
    images: ["/og.png"],
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0b0c0e" },
    { media: "(prefers-color-scheme: light)", color: "#f5f6f8" },
  ],
};

/* Dark-first by design - light is an explicit opt-in via the toggle */
const themeInit = `try{if(localStorage.getItem("theme")==="light")document.documentElement.classList.add("light")}catch(e){}`;

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: profile.name,
  jobTitle: profile.role,
  email: `mailto:${profile.email}`,
  url: profile.siteUrl,
  sameAs: [profile.github, profile.linkedin],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${clash.variable} ${satoshi.variable} ${jetbrains.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}

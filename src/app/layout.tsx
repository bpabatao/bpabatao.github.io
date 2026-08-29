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
    default: `${profile.name} - ${profile.role}`,
    template: `%s - ${profile.name}`,
  },
  description: profile.summary.split(". ")[0] + ".",
  alternates: { canonical: "/" },
  openGraph: {
    title: `${profile.name} - ${profile.role}`,
    description: `${profile.thesis.lead} ${profile.thesis.tail} ${profile.thesis.accent}`,
    url: profile.siteUrl,
    siteName: profile.name,
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
const printInit = `(()=>{let o=[];window.addEventListener("beforeprint",()=>{o=[...document.querySelectorAll("details:not([open])")];o.forEach(d=>{d.open=true})});window.addEventListener("afterprint",()=>{o.forEach(d=>{d.open=false});o=[]})})()`;
const goatcounter = process.env.NEXT_PUBLIC_GOATCOUNTER_CODE;

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
        <script dangerouslySetInnerHTML={{ __html: printInit }} />
      </head>
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
        <div className="scroll-progress" aria-hidden />
        <Header />
        {children}
        <Footer />
        {goatcounter && <script data-goatcounter={`https://${goatcounter}.goatcounter.com/count`} async src="/gc/count.js" />}
      </body>
    </html>
  );
}

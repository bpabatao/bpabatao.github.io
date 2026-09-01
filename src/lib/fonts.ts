import localFont from "next/font/local";

export const clash = localFont({
  src: "../fonts/ClashDisplay-Variable.woff2",
  variable: "--font-clash",
  weight: "200 700",
  display: "swap",
});

export const satoshi = localFont({
  src: "../fonts/Satoshi-Variable.woff2",
  variable: "--font-satoshi",
  weight: "300 900",
  display: "swap",
});

/* Subset to the glyphs the labels use (ASCII, Latin-1, arrows, ▸): 45 KB instead of 114 on the
   critical path. Regenerate from the full face with:
   python3 -m fontTools.subset JetBrainsMono-Variable.woff2 --unicodes="U+0020-007E,U+00A0-00FF,U+2013,U+2014,U+2018-201D,U+2026,U+2190-2199,U+25B8,U+2713,U+2717" --flavor=woff2 --layout-features='*' */
export const jetbrains = localFont({
  src: "../fonts/JetBrainsMono-Variable.woff2",
  variable: "--font-jetbrains",
  weight: "100 800",
  display: "swap",
});

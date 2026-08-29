# Recruiter-appeal redesign - design spec

Date: 2026-08-29
Status: draft for review
Owner: Benedict Pabatao

## 1. Goal

Make bpabatao.github.io land better on an in-house technical recruiter and a hiring manager at a US or EU product company screening for Staff platform/backend roles, remote.
Keep the visual identity (dark-first, orange accent, monospace labels, CSS-only motion, animated SVG case diagrams) and sharpen the message: title and seniority, proof with numbers second, one clear contact path, no drift between the site, the resume and the share card.
`src/data/content.ts` stays the single source of truth so the `/profile-sync` skill keeps working without changes.

### In scope

- Section reorder and hero changes (section 4).
- Generated share cards for the home page and every case study; correct per-page metadata (section 5).
- Accessibility, font, favicon and print fixes plus the wording nits left by the profile-sync reviews (section 6).
- GoatCounter analytics, cookie-free, gated on an environment variable (section 6).
- Verification with before/after screenshots and the existing gates (section 8).

### Out of scope

- A fresh visual direction (rejected in favour of keeping the identity).
- Analytics beyond page views and five click events.
- Any change to the resume renderers, the LinkedIn pack, or the profile-sync skill.
- New case studies or new claims about Benedict's work (profile-sync owns those).

## 2. Decisions

| Decision | Choice | Why |
|---|---|---|
| Audience | In-house recruiters and hiring managers, US/EU product companies, Staff platform/backend, remote | Benedict's target roles; a 10-second recruiter scan followed by a 3-minute manager read. |
| Identity | Keep palette, type, motion and diagrams; restructure the message | Lighthouse is 97-100 and the audit found the identity distinctive; the problems are ordering and drift. |
| Approach | A: restructure for proof + generated cards | Proof moves to second position; og cards can never drift again; one PR, same tooling as phase 1. |
| Analytics | GoatCounter, cookie-free, env-gated | Free, EU-hosted, no consent banner; measures resume/contact clicks and case-study reads. |
| profile-sync contract | The skill edits only `content.ts` and runs `npm run render`; nothing here changes that | Cron keeps working the Monday after this merges. |

## 3. Audit findings this spec answers (2026-08-29)

Recruiter-eye (live site, desktop 1440 and mobile 390, light and dark):
1. `public/og.png` still reads "Lead Platform Engineer" and "8 tenants" while the site and resume say Staff and 7.
2. The three quantified case studies sit below the dense Experience bullets, at scroll depth three.
3. "Earlier work" lists ten early gigs at full visibility right after Staff-level work.
4. Remote/location appears only in a low-contrast eyebrow; the CET/async clarifier is a full scroll away in Contact.
5. `/favicon.ico` returns 404 (only `icon.svg` is declared).

Technical (Lighthouse mobile 97, desktop 100, accessibility 100, best practices 100, SEO 100):
6. Case-study pages inherit the home page canonical and OpenGraph tags (`src/app/case/[slug]/page.tsx` `generateMetadata`), so Google may treat them as duplicates and shares show the generic card.
7. `ThemeToggle` fails WCAG 2.5.3 (visible label not in the accessible name).
8. `Satoshi-Variable.ttf` ships as a 127 KB TrueType file; the other two fonts are woff2.
9. No print stylesheet.
10. `diagrams.tsx:138` hardcodes "seven tenant environments".
11. Wording nits: "Five engineers, every production tenant:" on the ai-sdlc case page; `skills.txt` lists both "Bedrock" and "AWS Bedrock (Claude)", and both "WAF" and "WAFv2".

Keep as is: the hero one-liner, the stat strip, Operating principles, quantified bullets, the terminal motif, the theme toggle persistence, mobile layout (no overflow), the fleet-portal strip.

## 4. Structure and hero

Section order on the home page becomes: Hero, Selected work, Experience, Operating principles, Capabilities, Contact.
Header and mobile nav follow the same order.

Hero, top to bottom:
1. Status line (unchanged, derived: `OPERATIONAL - 7 TENANTS · AWS · REMOTE (ITALY)`).
2. Thesis h1 (unchanged).
3. `profile.summary` (unchanged).
4. New availability line in body text, not an eyebrow: `profile.availabilityLine` = "Open to Staff / Lead platform roles · Remote from Italy (CET), async-first · US and EU teams".
5. Two buttons, "view resume ↗" and "email me", followed by "github ↗" and "linkedin ↗" links.
6. Stat strip (unchanged).

Selected work:
- The three flagship cards and the fleet-portals strip stay as they are.
- "Also shipped" and "Earlier work" collapse into native `<details>` disclosures with counts, the same pattern `Work.tsx` uses for "earlier roles".

Data model additions in `content.ts` (typed, additive):

```ts
profile.availabilityLine: string;   // the hero sentence above
profile.markets: string;            // "US and EU teams"
```

`profile.availability` (the uppercase Contact chip) is unchanged.
No field the profile-sync skill writes changes shape.

Mobile: with both project lists collapsed the home page drops from about eleven viewport heights to about six.

## 5. Generated share cards and metadata

`scripts/render-og.ts` joins `npm run render` after `render-linkedin`.
It renders HTML cards from `content.ts` and screenshots them with the installed Google Chrome (`--headless=new --window-size=1200,630 --screenshot`, verified to produce a 1200x630 PNG).

- `public/og.png` - home: name, `profile.role`, thesis, `statusLine`, the three stat values, in the site palette using the three local fonts loaded from `src/fonts/` over `file://`.
- `public/og/<slug>.png` - one per `cases` entry: title, subtitle, ownership, stack; a new case gets a card automatically.
- `resume/.og-source.json` (gitignored) records the card inputs; `check-profile` fails with `og cards stale - run npm run render` when the inputs derived from `content.ts` differ from that file. PNG bytes are not compared (Chrome stamps them), and the PNGs are committed only when the inputs changed.
- `PDF_SKIPPED`-style behaviour when Chrome is missing: print `OG_SKIPPED` and continue.

`src/app/case/[slug]/page.tsx` `generateMetadata` returns, per slug: `title`, `description`, `alternates.canonical: /case/<slug>/`, `openGraph.{url, title, description, images: ["/og/<slug>.png"], type: "article"}`, `twitter.{card: "summary_large_image", title, description, images}`.

`public/favicon.ico`: a 32x32 PNG rendered once from `src/app/icon.svg` by the same Chrome path and committed under the `.ico` name (unfurl bots accept PNG data at that path).

## 6. Quick wins, analytics, print

Accessibility:
- `ThemeToggle` `aria-label` becomes "Switch to light mode" / "Switch to dark mode" (matches the visible word).
- Every `target="_blank"` link gets a visually hidden "(opens in new tab)".
- Each `<section>` gets `aria-labelledby` pointing at its `h2` id.
- `diagrams.tsx` derives its tenant-count wording from `fleetPortals.length`.

Fonts:
- `Satoshi-Variable.ttf` converts to `Satoshi-Variable.woff2` with `python3 -m fontTools.ttLib.woff2 compress` (fonttools and brotli are installed); `src/lib/fonts.ts` points at the new file; the TTF is deleted.

Print:
- `@media print` in `globals.css`: light palette, header/nav/theme toggle/scroll progress/hero grid/motion hidden, every `<details>` open, external link URLs printed after the link text, `break-inside: avoid` on cards.
- The resume PDF remains the primary document; this only makes a printed home page readable.

Analytics (GoatCounter):
- `layout.tsx` renders `<script data-goatcounter="https://<code>.goatcounter.com/count" async src="//gc.zgo.at/count.js">` only when `NEXT_PUBLIC_GOATCOUNTER_CODE` is set at build time; local builds and CI builds without the variable ship no script.
- Click events via `data-goatcounter-click`: `resume` (hero and Contact resume links), `email` (hero button and Contact email), `linkedin` (hero and Contact), `case-<slug>` on each case-study link.
- No cookies, no personal data, no consent banner.
- Prerequisite Benedict owns: create the free GoatCounter account, choose the code, add it as a repository variable for the deploy workflow (`NEXT_PUBLIC_GOATCOUNTER_CODE`) and locally when wanted.

Wording:
- ai-sdlc case, Problem paragraph: "Five engineers, every production tenant:" becomes "Five engineers, one fleet:".
- `stackGroups`: merge "Bedrock" into "AWS Bedrock (Claude)" and "WAF" into "WAFv2" so `skills.txt` lists each once.

## 7. Files

| File | Change |
|---|---|
| `src/data/content.ts` | `profile.availabilityLine`, `profile.markets`; stack de-duplication |
| `src/data/cases.ts` | one sentence on the ai-sdlc case |
| `src/app/page.tsx` | section order |
| `src/components/Header.tsx`, `MobileMenu.tsx` | nav order |
| `src/components/Hero.tsx` | availability line, second button, click attributes |
| `src/components/Projects.tsx` | two `<details>` disclosures, click attributes on case links |
| `src/components/Contact.tsx` | click attributes |
| `src/components/ThemeToggle.tsx` | accessible name |
| `src/components/diagrams.tsx` | derived tenant wording |
| `src/components/*.tsx` | `aria-labelledby` on sections; "(opens in new tab)" on external links |
| `src/app/layout.tsx` | GoatCounter script (env-gated); og image path unchanged |
| `src/app/case/[slug]/page.tsx` | full per-page metadata |
| `src/app/globals.css` | print stylesheet; `.sr-only` utility if Tailwind's is not used |
| `src/lib/fonts.ts`, `src/fonts/` | Satoshi woff2 |
| `scripts/render-og.ts`, `scripts/render-og.test.ts` | card renderer and tests |
| `scripts/check-profile.ts` | og staleness check |
| `package.json` | `render` includes `render-og`; `test` includes its test |
| `public/og.png`, `public/og/*.png`, `public/favicon.ico` | generated assets |
| `.gitignore` | `resume/.og-source.json` |
| `.github/workflows/deploy.yml` | pass `NEXT_PUBLIC_GOATCOUNTER_CODE` from repository variables into the build |
| `CLAUDE.md` | og cards are generated; never hand-edit |

## 8. Verification

- Before/after visual QA with the `/visual-qa` skill: the "before" set exists in the session scratchpad (desktop 1440 above the fold and full page, mobile 390, light theme, `/case/core-api/`, `og.png`); the "after" set is shot from the branch and the deltas listed; at most three iterations.
- Existing gates: `npm test`, `npm run check -- --ci`, `npm run build` (CI).
- New tests: `render-og.test.ts` (card HTML carries `profile.role`, the derived tenant count and every case slug; PNG header parses to 1200x630), `content.test.ts` extended for the two new fields, a metadata test rendering `generateMetadata` per slug asserting canonical and `og:image`.
- Lighthouse floor on the built `out/` served locally: mobile >= 97, desktop 100, accessibility 100, `label-content-name-mismatch` absent.
- After deploy: `/og.png` and `/og/<slug>.png` return 200 at 1200x630; each case page's HTML carries its own canonical and `og:image`.
- Analytics: `grep gc.zgo.at out/index.html` empty without the variable and present with it; the click attributes present exactly where section 6 lists them.
- Print: Chrome `--print-to-pdf` of the built home page, one PDF for Benedict to eyeball.
- profile-sync regression: `npm run render && npm run check` twice in a row leaves the tree clean.

## 9. Follow-ups (not in this spec)

- A live LinkedIn read for `--check-linkedin` (profile-sync follow-up).
- Docx determinism (fixed zip timestamps) so `resume.docx` stops changing on every render.
- A `section` landmark naming pass beyond `aria-labelledby` if a screen-reader test finds gaps.

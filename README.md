# bpabatao.github.io

Personal portfolio of Benedict Pabatao - Staff Software Engineer.

Next.js 15 (static export) + React 19 + Tailwind CSS v4, CSS-only motion, deployed to GitHub Pages via Actions.

## Develop

```
npm install
npm run dev
```

## Build

```
npm run build   # static export to out/
npm start       # serve out/ locally
```

Content lives in `src/data/` (typed). Deploys automatically on push to `main`.

Resume (`resume/`, `public/resume.pdf`), the LinkedIn paste-pack (`linkedin/`), the share cards (`public/og.png`, `public/og/`) and `public/favicon.ico` are generated from it: `npm run render && npm run check`.

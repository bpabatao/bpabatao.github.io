# bpabatao.github.io

Personal portfolio and resume.
`src/data/content.ts` is the single source of truth for every profile fact.

- Never hand-edit `resume/resume.html`, `resume/resume.docx`, `public/resume.pdf`, `linkedin/*.txt`, `public/og.png`, `public/og/*.png`, `public/favicon.ico` or `resume/og-source.json`; they are generated.
- After changing `content.ts`: `npm run render && npm run check && npm run build`.
- `npm test` runs the script tests; `npm run check -- --ci` is what CI runs.
- Profile updates from work evidence arrive as `profile-sync/*` pull requests from the global `/profile-sync` skill; merge them, never push profile changes straight to `main`.
- Client and tenant names never appear in generated text; `fleetPortals` is the only place tenant names are allowed.
- Commit style: `Area: lowercase imperative summary`. Plain dash "-", never an em dash.

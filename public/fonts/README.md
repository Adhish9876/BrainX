# Self-hosted fonts

Served locally from `/fonts`; there are **no third-party font requests at runtime**.

- **Fraunces** — display serif, variable woff2 subsets, weight range 400–600.
- **Source Sans 3** — body sans, variable woff2 subsets, weight range 300–700.

Files were downloaded once from the Google Fonts CSS API (modern UA → woff2) and
committed here. The `@font-face` declarations live in `app/globals.css`, and the
Latin subsets are preloaded in `app/layout.tsx`.

## Licenses

Both families are licensed under the SIL Open Font License 1.1 (OFL-1.1):

- `OFL-fraunces.txt` — Copyright 2018 The Fraunces Project Authors.
- `OFL-sourcesans3.txt` — Copyright 2010-2020 Adobe, with Reserved Font Name "Source".

## Regenerating

To refresh the files, request
`https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400..600&family=Source+Sans+3:wght@300..700&display=swap`
with a modern browser User-Agent, download each `fonts.gstatic.com` woff2 URL, and
update the matching `@font-face` blocks in `app/globals.css`.

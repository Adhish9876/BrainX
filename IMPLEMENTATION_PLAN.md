# BrainX Lab implementation plan

## Direction and acceptance criteria
- Next.js App Router, TypeScript, Tailwind CSS, shadcn-style Radix primitives. Light-only academic editorial design, navy #2C4A87, restrained typography and no decorative motion.
- Reuse the reference's information architecture, not its branding or prose. All public content statically built from data/. Home: lab information and right news/publication rail (stacked on mobile). Dedicated timeline, grouped team, research/project cards, events/news tabs and accessible gallery.
- Preserve supplied publication records, including the repeated 2018/2019 entry, and supplied team identities. Do not invent contact details, exact publication dates, achievements or events. Research is explicitly placeholder content.
- Hidden /admin with secure environment credentials, persistent signed HttpOnly session, intuitive existing-item edit/new/delete/reorder, free-form tag entry, native date picker, session-scoped browser drafts and server-staged image uploads.
- A single redeploy action creates one atomic GitHub commit with JSON and images through Git Database APIs. Optimistic concurrency prevents overwriting a newer remote revision. No PAT in browser or commits.
- Pictures compiled from data/pictures/<id>/meta.json plus directory images; thumbnail metadata selects any image. Uploads validated and normalized server-side before committing.
- VPS production Next server handles authenticated APIs while public pages remain build-time generated. GitHub Actions triggers VPS rebuild; releases built before switching and old releases retained.

## Work sequence
1. Document reference research in REFERENCE_WEBSITE.md.
2. Establish shared content contract and source data; implement public pages, backend CMS/auth, and admin UI in non-overlapping work streams.
3. Integrate; type-check/build; unit-test validation/auth/commit logic and browser-test responsive navigation, editing, tags, reorder, gallery keyboard controls, uploads and authentication.
4. Initialize private GitHub repository without secrets; configure deployment and verify a real admin commit leads to a rebuilt public page.
5. Record operating instructions, credentials setup, deployment details, tests and any blockers.

## Risks and safeguards
- Reference browser may challenge automated visitors: document HTTP evidence and avoid claiming unobserved visual behavior.
- PAT may lack Actions/administration permissions; test permissions and report external setup blockers.
- Drafts cleared only after successful commit. Uploads expire and are session-bound.
- Distinguish committed from live. Never report successful deploy based on commit alone.
- VPS shared services and DNS must not be disrupted. Confirm hostname brainx.zapdos.me and inspect infrastructure before editing.

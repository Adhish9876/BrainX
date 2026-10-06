# BrainX Lab — acceptance verification

Verified on 7 October 2026 at **https://brainx.zapdos.me**.

## Checks passed

- 90 unit tests across 15 files, production build and TypeScript check.
- Nine routine browser tests on local production and the live HTTPS site: all
  public sections, responsive navigation/layout, publication timeline, supplied
  team, core WCAG checks, events/news tab URLs, gallery keyboard navigation and
  focus restoration, persistent drafts/reset, authentication boundaries and
  add/edit/reorder/delete across all seven collections. Routine tests do not publish.
- Two isolated populated-fixture browser tests: latest ten news and full archive,
  featured event details/images and historical accordions, project links and
  single-image galleries. Fixture news/events/projects were never published.
- One explicitly authorized real CMS publish: staged a placeholder logo and three
  gallery photos, selected/reordered the thumbnail, removed one photo, and
  published exactly two photos plus the logo in one POST and one GitHub commit.
- Commit `cd71a084f4806e2a0c455898becab06c9f6bbbd7` has exactly one parent,
  `2f349de76b86f882131e87312d02cede642bac6e`, matching the editor's starting SHA.
  Exactly three image files were committed. Existing publications, research,
  team, news, events and projects were preserved without semantic changes.
- GitHub Actions run [37522694211](https://github.com/zapds/brainx-lab/actions/runs/37522694211)
  passed unit tests/build/typecheck before triggering and confirming the CMS rebuild.
- The rebuilt public HTML references the uploaded logo and demonstration group.
  Public assets returned `image/webp`: logo 64 × 64; both photos 1600 × 1000.
- Public HTTPS and direct-origin HTTPS returned 200; HTTP redirected to HTTPS.
  `/.env.local`, `/.git/config`, `/.uploads/test.json` and `/data/site.json` returned 404.
- Project PM2 app/hook were online, app restart count was zero, Caddy and PM2
  startup units were enabled, and existing VPS services remained online.
- Credential-value scan passed for all 150 tracked application/content files.
  Local checkout fast-forwarded to the CMS commit without overwriting changes.

## Content still to supply

Research themes, monogram and gallery demonstrations remain explicitly identified
as placeholders. The real CMS upload test intentionally leaves the removable
**Admin upload demonstration — placeholder** group. News/events/projects are
empty rather than invented; email and phone await actual lab details.

## Operations

Admin: **https://brainx.zapdos.me/admin**. Credentials are in the ignored local
`.env.local` and the private VPS `/home/ubuntu/brainx-lab/shared/.env.local`, not
in this document or the repository.

VPS project `/home/ubuntu/brainx-lab`; PM2 `brainx-lab` on loopback `3101`,
`brainx-lab-hook` on `3102`; selected Caddy route in `/etc/caddy/Caddyfile`.
Push to `main` or use admin **Redeploy** to validate/build/release. See
`DEPLOYMENT.md` for status checks and retained-release rollback instructions.

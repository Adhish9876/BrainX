# BrainX Lab, IIITDM Kancheepuram

An academic lab website and single-admin GitHub-backed CMS. Public pages are compiled from `data/`; authenticated administration lives at `/admin` and is not linked publicly.

## Local development

```sh
npm ci
cp .env.example .env.local # populate credentials; never commit this file
npm run dev
```

Set a strong `ADMIN_PASSWORD`, a random `SESSION_SECRET` (at least 32 characters), and a fine-grained `GITHUB_PAT` with repository Contents read/write access. The admin reads the current remote repository, not uncommitted local data. Public data requires `npm run build` to refresh in production. See `DEPLOYMENT.md` for automatic rebuild setup.

```sh
npm run typecheck
npm test
npm run build
```

## Content and media

Editable content is JSON under `data/`. Free-form tags have no fixed vocabulary. Research placeholder content and demonstration gallery images are explicitly identified; replace them through the admin. Missing contact details are intentionally not invented. `initial_data.md` preserves the supplied source, including its duplicate publication across two years.

Picture groups use `data/pictures/<group-id>/meta.json` and raster image files in the same directory. Metadata names the group, date, description, and thumbnail. The build scans images and copies media to public assets. Uploaded images are staged privately on the server before a single atomic GitHub commit publishes all pending changes.

## Admin workflow

1. Sign in at `/admin` with the credentials in the server environment.
2. Edit existing records, add items, move them up/down, and manage photos. Dates use calendar inputs; press Enter to create any text tag.
   In the publication editor, **Paste BibTeX** and choose **Fill from BibTeX** to
   extract a single citation's title, authors, year, venue, URL/DOI and keywords.
   Review/edit the filled fields, then **Add** or **Save changes**. Importing does
   not publish; missing fields stay unchanged, and invalid or multiple citations
   are rejected without changing the form.
3. Changes remain browser drafts until **Redeploy**. Uploaded files are temporarily staged on the server.
4. Redeploy creates one commit for the entire draft. A concurrent edit causes a conflict rather than overwriting newer remote content.
5. A commit is not yet a live deployment: the production rebuild must finish. Keep the previous release for rollback.

Do not expose `.env.local`, server uploads, or GitHub credentials to the browser. Credentials are not stored in the repository.

## Browser verification

Run against a running local production server or the public site:

```sh
TEST_BASE_URL=https://brainx.zapdos.me npx playwright test
```

The routine suite does not commit. Fixture and publishing tests are opt-in. To check populated events/news/projects without publishing invented lab activity:

```sh
FIXTURE=$(node scripts/prepare-test-fixtures.mjs)
npm --prefix "$FIXTURE" run build
npm --prefix "$FIXTURE" run start -- --port 3004
# In another terminal:
RUN_FIXTURE_TESTS=1 TEST_BASE_URL=http://127.0.0.1:3004 npx playwright test tests/e2e/fixtures.spec.ts
```

`RUN_CMS_PUBLISH=1` enables the deliberately destructive, one-time publishing test in `tests/e2e/publish.spec.ts`: it creates a clearly labeled demo group and uploads a placeholder logo in one real commit. Do not enable it for routine testing. Browser credentials are read from the ignored `.env.local`; authenticated tests disable tracing.

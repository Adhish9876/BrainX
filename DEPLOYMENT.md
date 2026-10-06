# BrainX Lab — Deployment

Production deployment for **brainx.zapdos.me** on the shared Oracle VPS.

The site is a Next.js App Router app, served with `next start` from a complete release. It is built on the
VPS and served by PM2 behind Caddy. GitHub Actions runs unit tests, a production
build and type checking before pinging the VPS webhook, which builds the release
again with the production environment.

> No secrets live in tracked files. All credentials are read at runtime from
> `/home/ubuntu/brainx-lab/shared/.env.local` (mode `600`).

---

## 1. Topology

| Item | Value |
| --- | --- |
| Public URL | `https://brainx.zapdos.me` (Cloudflare proxied) |
| Project root (VPS) | `/home/ubuntu/brainx-lab` |
| Releases | `/home/ubuntu/brainx-lab/releases/<sha>` |
| Active release | `/home/ubuntu/brainx-lab/current` → `releases/<sha>` |
| Shared env | `/home/ubuntu/brainx-lab/shared/.env.local` (mode `600`) |
| Persistent uploads | `/home/ubuntu/brainx-lab/shared/.uploads` |
| Deploy log | `/home/ubuntu/brainx-lab/shared/deploy.log` |
| App process | PM2 `brainx-lab` — `next start` on `127.0.0.1:3101` |
| Hook process | PM2 `brainx-lab-hook` — `127.0.0.1:3102` |
| Caddy | `brainx.zapdos.me` → `127.0.0.1:3101`; `/__deploy*` → `127.0.0.1:3102` |
| Node/PM2 | via NVM at `/home/ubuntu/.nvm/nvm.sh` (user `ubuntu`, not root) |

Tracked deployment files:

```
scripts/deploy-vps.sh        # the release script (tarball -> build -> switch -> health/rollback)
scripts/deploy-hook.mjs      # loopback HTTP trigger/status server (no dependencies)
ecosystem.config.cjs         # PM2 definitions for brainx-lab + brainx-lab-hook
.github/workflows/deploy.yml # CI: POST the trigger, then poll until live
DEPLOYMENT.md                # this file
tests/deploy-hook.test.ts    # unit tests for the hook's pure helpers
```

### Flow

1. A push to `main` runs `.github/workflows/deploy.yml`.
2. After the reusable validation job passes, CI `POST`s `{"sha": <github.sha>, "repository": "zapds/brainx-lab", "branch": "main"}`
   to `https://brainx.zapdos.me/__deploy` with `Authorization: Bearer <DEPLOY_SECRET>`.
3. Caddy routes `/__deploy*` to the hook on `127.0.0.1:3102`.
4. The hook validates the bearer token (timing-safe) and the SHA, coalesces concurrent
   requests, and spawns `deploy-vps.sh <sha>` (one at a time).
5. `deploy-vps.sh` verifies the SHA is the current head of `main` on GitHub, downloads
   the commit tarball with the PAT, builds it in `releases/<sha>`, flips `current`,
   `pm2 delete`+`pm2 start`s the app, and health-checks `127.0.0.1:3101`.
6. On failure it rolls back to the previous release. On success it prunes old releases.
7. CI polls `GET /__deploy` until `liveSha` equals the pushed SHA (bounded to 5 minutes).

---

## 2. One-time VPS bootstrap

Run as `ubuntu`. Adjust `BASE` if you use a different root.

```bash
BASE=/home/ubuntu/brainx-lab
mkdir -p "$BASE/releases" "$BASE/shared/.uploads"
chmod 700 "$BASE/releases"
```

Copy the **stable** deployment files (hook, deploy script, PM2 config) from a local
checkout of the repo into the project root. These live outside `releases/` so they
survive every deploy:

```bash
# from the local repo checkout
scp scripts/deploy-hook.mjs scripts/deploy-vps.sh ecosystem.config.cjs \
    ubuntu@<vps>:/home/ubuntu/brainx-lab/
ssh ubuntu@<vps> 'chmod +x /home/ubuntu/brainx-lab/deploy-vps.sh'
```

### 2.1 Shared environment

Create `shared/.env.local` (mode `600`) with the runtime secrets. `DEPLOY_SECRET`
must be identical to the GitHub Actions repository secret of the same name.

```bash
BASE=/home/ubuntu/brainx-lab
umask 077
cat > "$BASE/shared/.env.local" <<'ENV'
GITHUB_PAT=<fine-grained PAT with contents:read on zapds/brainx-lab>
GITHUB_OWNER=zapds
GITHUB_REPO=brainx-lab
GITHUB_BRANCH=main
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<strong password>
SESSION_SECRET=<openssl rand -hex 32>
UPLOAD_DIR=.uploads
DEPLOY_SECRET=<openssl rand -hex 32>
ENV
chmod 600 "$BASE/shared/.env.local"
```

`DEPLOY_SECRET` is consumed by the hook; `GITHUB_PAT` by `deploy-vps.sh`;
the remaining keys are read by the app (server-side only, never inlined into
client bundles). The hook re-reads this file on every request, so rotating
`DEPLOY_SECRET` needs no hook restart.

> The primary orchestrator has **already installed the `DEPLOY_SECRET` repository
> secret** and the local `.env.local` already contains a `DEPLOY_SECRET`. Make the
> VPS `shared/.env.local` value match the repository secret exactly.

### 2.2 Start the hook and app under PM2

```bash
ssh ubuntu@<vps> 'bash -lc "source /home/ubuntu/.nvm/nvm.sh && cd /home/ubuntu/brainx-lab && pm2 start ecosystem.config.cjs --only brainx-lab-hook && pm2 save"'
```

Start `brainx-lab` after the first release exists (section 3), since it runs from
`current`.

### 2.3 Caddy route

Add a site block to the Caddyfile (keep the existing file/import structure and take
a timestamped backup first, as in the deploy skill):

```caddyfile
brainx.zapdos.me {
    encode zstd gzip

    # Deploy webhook + status (loopback only, never public directly)
    handle /__deploy* {
        reverse_proxy 127.0.0.1:3102
    }

    # The Next.js app
    handle {
        reverse_proxy 127.0.0.1:3101
    }
}
```

Validate and reload gracefully:

```bash
ssh ubuntu@<vps> 'sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && sudo systemctl reload caddy'
```

Cloudflare proxy is fine: Caddy still obtains/renews certificates via normal HTTP
ACME validation, provided the zone SSL mode is **Full** or **Full (strict)**.

---

## 3. Initial deploy (first release)

`deploy-vps.sh` builds from a GitHub commit, so the very first release must exist on
GitHub:

1. From the local repo (orchestrator), create the initial commit and push `main` to
   `https://github.com/zapds/brainx-lab.git`. Note the pushed commit SHA.
2. Trigger the first release manually on the VPS (this is also what CI does):

   ```bash
   ssh ubuntu@<vps> 'bash -lc "source /home/ubuntu/.nvm/nvm.sh && /home/ubuntu/brainx-lab/deploy-vps.sh <SHA>"'
   ```

3. Start the app:

   ```bash
   ssh ubuntu@<vps> 'bash -lc "source /home/ubuntu/.nvm/nvm.sh && cd /home/ubuntu/brainx-lab && pm2 start ecosystem.config.cjs --only brainx-lab && pm2 save"'
   ```

4. Verify `curl -fsS http://127.0.0.1:3101/` and then `https://brainx.zapdos.me/`.

The first `POST /__deploy` may also be sent by GitHub Actions directly if the workflow
is active and the secret is set — the manual invocation above is the reliable bootstrap.

### Adding the Actions secret via API

If you ever need to (re)set it — the primary already did this — the cleanest path is
the GitHub CLI, which encrypts with the repository public key for you:

```bash
# requires a PAT with `repo` + `workflow` scopes, exported as GH_TOKEN
gh secret set DEPLOY_SECRET --repo zapds/brainx-lab --body "$DEPLOY_SECRET"
```

Raw API alternative (sealed-box encryption with libsodium):

```bash
OWNER=zapds REPO=brainx-lab
# 1) fetch the repo public key
curl -sS -H "Authorization: Bearer $GH_TOKEN" \
  "https://api.github.com/repos/$OWNER/$REPO/actions/secrets/public-key"
# 2) encrypt the value with the returned key_id/key and PUT it:
#    PUT https://api.github.com/repos/$OWNER/$REPO/actions/secrets/DEPLOY_SECRET
#        {"encrypted_value":"<base64 sealed box>","key_id":"<key_id>"}
#    (encrypt using libsodium-wrappers in Node or PyNaCl in Python)
```

The value must equal `DEPLOY_SECRET` in the VPS `shared/.env.local`.

---

## 4. Routine deploys

Just push to `main`. After validation passes, the workflow triggers the hook and waits (up to 5 minutes,
matching a typical <2-minute VPS build) until the pushed SHA is live.

To narrow CI to build-affecting paths later, add a `paths:` filter to the `push`
trigger in `.github/workflows/deploy.yml` (a commented template is included there).

---

## 5. Manual operations

All commands assume `source /home/ubuntu/.nvm/nvm.sh` on the VPS.

```bash
# Deploy a specific commit (must be the current head of main)
/home/ubuntu/brainx-lab/deploy-vps.sh <40-char-sha>

# Check what is live
readlink -f /home/ubuntu/brainx-lab/current
curl -fsS http://127.0.0.1:3101/

# Hook status (same endpoint CI polls)
curl -fsS -H "Authorization: Bearer <DEPLOY_SECRET>" https://brainx.zapdos.me/__deploy
# -> {"ok":true,"liveSha":"<sha>","deploying":false,"error":null,...}

# Trigger via the hook by hand
curl -fsS -X POST https://brainx.zapdos.me/__deploy \
  -H "Authorization: Bearer <DEPLOY_SECRET>" -H "Content-Type: application/json" \
  --data '{"sha":"<sha>","repository":"zapds/brainx-lab","branch":"main"}'

# App logs / restart
pm2 logs brainx-lab --lines 100
pm2 logs brainx-lab-hook --lines 100

# Rollback manually: point current at a retained release and restart
ln -sfn /home/ubuntu/brainx-lab/releases/<previous-sha> /home/ubuntu/brainx-lab/current
pm2 delete brainx-lab
pm2 start /home/ubuntu/brainx-lab/ecosystem.config.cjs --only brainx-lab --update-env
pm2 save
```

Automatic rollback: if the post-switch health check fails, `deploy-vps.sh` restores
`current` to the previous release and restarts the app automatically. The previous
5 releases are retained (override with `BRAINX_KEEP_RELEASES`).

---

## 6. Security notes

- **No secrets in tracked config.** `ecosystem.config.cjs`, the workflow, and the
  scripts contain no credentials. The PAT/`DEPLOY_SECRET` are read from
  `shared/.env.local` (mode `600`) at runtime.
- **Timing-safe auth.** The hook compares the bearer token with
  `crypto.timingSafeEqual` and rejects mismatched lengths.
- **No command injection.** The SHA must match `^[0-9a-f]{40}$`; owner/repo/branch
  are validated against strict regexes; the deploy script is spawned with an argument
  array (no shell); the env file is parsed, never `eval`'d.
- **No git on the VPS.** Releases are GitHub tarballs fetched with the PAT; the token
  is passed via an `Authorization` header and never printed.
- **Bound to loopback.** Both the app (3101) and hook (3102) bind `127.0.0.1`; only
  Caddy is public. The hook is reachable only through `/__deploy*`.
- **Serialized deploys.** The hook coalesces concurrent requests to the latest SHA and
  runs one deploy at a time; `deploy-vps.sh` additionally holds an `flock` on the
  releases directory so manual runs cannot overlap.
- **Sanitized errors.** The status endpoint redacts `DEPLOY_SECRET`/`GITHUB_PAT` and
  the base path, and truncates error strings.
- **CMS commits** go through the GitHub Git Database API (elsewhere in this project),
  not through this deployment tooling.

---

## 7. Tests

```bash
npx vitest run tests/deploy-hook.test.ts
```

Covers SHA validation, dotenv parsing (including non-execution of values), timing-safe
comparison, bearer parsing, and error sanitization/redaction. `bash -n scripts/deploy-vps.sh`
verifies shell syntax.

---

## 8. Assumptions & blockers to confirm

- **PAT permissions.** The workflow needs a repository secret only; the VPS PAT needs
  `contents:read` on `zapds/brainx-lab`. Setting Actions secrets via the raw API
  requires the acting PAT to have `repo` + `workflow` scopes — **if the repo PAT lacks
  the `workflow` scope, secret management must be done via the GitHub UI or a
  sufficiently-scoped token.** (The primary already installed `DEPLOY_SECRET`, so this
  is only relevant for future rotations.)
- **DNS.** `brainx.zapdos.me` is Cloudflare proxied. Caddy obtains origin certificates
  normally as long as the Cloudflare SSL mode is Full/Full (strict).
- **VPS tools.** `deploy-vps.sh` assumes GNU `flock`, `curl`, `tar`, and `node`/`npm`/`pm2`
  from NVM on the VPS. All were used successfully in local hook smoke tests; confirm on
  the VPS during bootstrap.
- **First run.** `brainx-lab` cannot start until the first release exists (section 3).
- **No remote execution was performed** while building these files; the orchestrator
  performs the actual VPS setup and initial deploy.

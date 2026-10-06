#!/usr/bin/env bash
#
# BrainX Lab production deploy script.
#
# Invoked by deploy-hook.mjs (and usable manually) as:
#     bash /home/ubuntu/brainx-lab/deploy-vps.sh <40-char-git-sha>
#
# What it does
#   1. Validates the requested SHA and that it is the current head of the
#      configured branch on the configured GitHub repository (via the API).
#   2. Downloads the commit tarball with the PAT header (never printed) and
#      extracts it into releases/<sha>. No `git` commands are used.
#   3. Installs dependencies (npm ci) and builds (`npm run build`) inside the
#      staged release.
#   4. Atomically flips the `current` symlink and (re)starts the PM2 app with
#      `pm2 delete` + `pm2 start` so the fresh release path is resolved.
#   5. Health-checks 127.0.0.1:$PORT, and rolls back to the previous release on
#      failure. Old releases are pruned while retaining the most recent ones.
#
# Safety
#   * `set -Eeuo pipefail`, explicit `flock` on the releases directory.
#   * All external input is validated against strict regexes and only ever
#     passed as quoted arguments (no eval, no shell interpolation of data).
#   * Secrets are read from shared/.env.local without executing the file and
#     are never echoed to stdout/stderr.
#
set -Eeuo pipefail
IFS=$'\n\t'

# ---------------------------------------------------------------------------
# Configuration (overridable through the environment for testing)
# ---------------------------------------------------------------------------
BASE_DIR="${BRAINX_BASE_DIR:-/home/ubuntu/brainx-lab}"
APP_NAME="${BRAINX_APP_NAME:-brainx-lab}"
PORT="${BRAINX_PORT:-3101}"
HOST="${BRAINX_HOST:-127.0.0.1}"
KEEP_RELEASES="${BRAINX_KEEP_RELEASES:-5}"
NVM_SH="${NVM_SH:-/home/ubuntu/.nvm/nvm.sh}"

ECOSYSTEM="${BASE_DIR}/ecosystem.config.cjs"
ENV_FILE="${BASE_DIR}/shared/.env.local"
UPLOADS_DIR="${BASE_DIR}/shared/.uploads"
RELEASES_DIR="${BASE_DIR}/releases"
SHARED_DIR="${BASE_DIR}/shared"
DEPLOY_LOG="${SHARED_DIR}/deploy.log"
LIVE_SHA_FILE="${SHARED_DIR}/live-sha"
LOCK_FILE="${RELEASES_DIR}/.deploy.lock"
CURRENT_LINK="${BASE_DIR}/current"
HEALTH_URL="http://${HOST}:${PORT}/"

umask 027

TMP_TAR=""
cleanup() {
  local rc=$?
  if [ -n "${TMP_TAR}" ] && [ -f "${TMP_TAR}" ]; then
    rm -f -- "${TMP_TAR}"
  fi
  return "${rc}"
}
trap cleanup EXIT

log() { printf '%s [deploy] %s\n' "$(date -u +%FT%TZ)" "$*"; }
log_err() { printf '%s [deploy] %s\n' "$(date -u +%FT%TZ)" "$*" >&2; }
die() { log_err "ERROR: $*"; exit 1; }

# Read a single key from a dotenv-style file WITHOUT sourcing/executing it.
# Prints the last assignment's value with optional surrounding quotes removed.
env_get() {
  local key="$1"
  [ -f "${ENV_FILE}" ] || return 0
  sed -n "s/^[[:space:]]*export[[:space:]]*//; s/^[[:space:]]*${key}[[:space:]]*=[[:space:]]*//p" "${ENV_FILE}" \
    | tail -n 1 \
    | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/" -e 's/[[:space:]]*$//'
}

# ---------------------------------------------------------------------------
# Load the Node/PM2 runtime (non-interactive SSH does not load NVM).
# ---------------------------------------------------------------------------
if [ -s "${NVM_SH}" ]; then
  # shellcheck disable=SC1090
  . "${NVM_SH}" >/dev/null 2>&1 || true
fi
if ! command -v node >/dev/null 2>&1; then
  die "node not found; unable to source NVM from ${NVM_SH}"
fi
if ! command -v npm >/dev/null 2>&1; then
  die "npm not found"
fi
PM2_BIN="$(command -v pm2 || true)"
[ -n "${PM2_BIN}" ] || die "pm2 not found on PATH"

# ---------------------------------------------------------------------------
# Input validation
# ---------------------------------------------------------------------------
SHA="${1:-}"
if [ "$#" -gt 1 ]; then
  die "unexpected extra arguments"
fi
[[ "${SHA}" =~ ^[0-9a-f]{40}$ ]] || die "invalid commit sha (expected 40 lowercase hex chars)"

# ---------------------------------------------------------------------------
# Directories + lock
# ---------------------------------------------------------------------------
mkdir -p "${RELEASES_DIR}" "${UPLOADS_DIR}" "${SHARED_DIR}"

# Serialize deployments in the releases directory (the hook also coalesces,
# this protects manual invocations and races).
exec 9>"${LOCK_FILE}"
if ! flock -w 900 9; then
  die "could not acquire deploy lock (another deployment is running)"
fi

RELEASE_DIR="${RELEASES_DIR}/${SHA}"

# Idempotent short-circuit: already live and healthy.
if [ "$(readlink -f "${CURRENT_LINK}" 2>/dev/null || true)" = "${RELEASE_DIR}" ] \
   && curl -fsS --max-time 5 -o /dev/null "${HEALTH_URL}"; then
  log "sha ${SHA:0:12} is already live; nothing to do"
  exit 0
fi

# ---------------------------------------------------------------------------
# Shared environment (secrets). Never log values.
# ---------------------------------------------------------------------------
[ -f "${ENV_FILE}" ] || die "missing shared env file: ${ENV_FILE}"
chmod 600 "${ENV_FILE}" 2>/dev/null || true

GITHUB_PAT="$(env_get GITHUB_PAT)"
GITHUB_OWNER="$(env_get GITHUB_OWNER)"
GITHUB_REPO="$(env_get GITHUB_REPO)"
GITHUB_BRANCH="$(env_get GITHUB_BRANCH)"
GITHUB_BRANCH="${GITHUB_BRANCH:-main}"

[ -n "${GITHUB_PAT}" ] || die "GITHUB_PAT is not set in ${ENV_FILE}"
[[ "${GITHUB_OWNER}" =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || die "invalid GITHUB_OWNER"
[[ "${GITHUB_REPO}"  =~ ^[A-Za-z0-9][A-Za-z0-9._-]*$ ]] || die "invalid GITHUB_REPO"
[[ "${GITHUB_BRANCH}" =~ ^[A-Za-z0-9._/-]+$ ]]         || die "invalid GITHUB_BRANCH"

API="https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}"
GH_HEADERS=(
  -H "Authorization: Bearer ${GITHUB_PAT}"
  -H "Accept: application/vnd.github+json"
  -H "X-GitHub-Api-Version: 2022-11-28"
)

json_field() {
  # Reads JSON on stdin, prints a top-level string field (or empty).
  node -e '
    let s = "";
    process.stdin.on("data", (d) => { s += d; });
    process.stdin.on("end", () => {
      try {
        const v = JSON.parse(s)["'"$1"'"];
        if (typeof v === "string") process.stdout.write(v);
      } catch { /* ignore */ }
    });
  '
}

# ---------------------------------------------------------------------------
# Verify the requested SHA is the current head of the configured branch.
# ---------------------------------------------------------------------------
log "verifying ${SHA:0:12} is the head of ${GITHUB_OWNER}/${GITHUB_REPO}@${GITHUB_BRANCH}"
HEAD_SHA="$(curl -fsSL --max-time 30 "${GH_HEADERS[@]}" "${API}/commits/${GITHUB_BRANCH}" | json_field sha)" \
  || die "failed to query GitHub for ${GITHUB_BRANCH} head"
[ -n "${HEAD_SHA}" ] || die "GitHub returned no head sha for ${GITHUB_BRANCH}"
if [ "${HEAD_SHA}" != "${SHA}" ]; then
  die "refusing to deploy ${SHA:0:12}: not the current head of ${GITHUB_BRANCH} (${HEAD_SHA:0:12})"
fi

# ---------------------------------------------------------------------------
# Download + extract the release tarball (no git).
# ---------------------------------------------------------------------------
if [ -e "${RELEASE_DIR}" ]; then
  log "removing incomplete existing release ${SHA:0:12}"
  rm -rf -- "${RELEASE_DIR}"
fi
mkdir -p "${RELEASE_DIR}"

TMP_TAR="$(mktemp "${RELEASES_DIR}/.download-XXXXXX.tgz")"
log "downloading release tarball ${SHA:0:12}"
curl -fsSL --max-time 300 "${GH_HEADERS[@]}" -o "${TMP_TAR}" "${API}/tarball/${SHA}" \
  || die "tarball download failed"
[ -s "${TMP_TAR}" ] || die "downloaded tarball is empty"

tar -xzf "${TMP_TAR}" -C "${RELEASE_DIR}" --strip-components=1 --no-same-owner \
  || die "failed to extract tarball"
rm -f -- "${TMP_TAR}"
TMP_TAR=""

# ---------------------------------------------------------------------------
# Provide environment + persistent uploads to the release.
# ---------------------------------------------------------------------------
cp -f "${ENV_FILE}" "${RELEASE_DIR}/.env.local"
chmod 600 "${RELEASE_DIR}/.env.local"
ln -sfn "${UPLOADS_DIR}" "${RELEASE_DIR}/.uploads"

# ---------------------------------------------------------------------------
# Install + build inside the staged release.
# ---------------------------------------------------------------------------
log "installing dependencies (npm ci) in ${SHA:0:12}"
(
  cd "${RELEASE_DIR}"
  export NODE_ENV=production
  export NEXT_TELEMETRY_DISABLED=1
  # --include=dev is required: the production build needs devDependencies
  # (tailwindcss, @tailwindcss/postcss, typescript) even though NODE_ENV is
  # production, otherwise `npm ci` would omit them and the build would fail.
  npm ci --include=dev --no-audit --no-fund --fund=false
) >>"${DEPLOY_LOG}" 2>&1 || die "npm ci failed for ${SHA:0:12} (see ${DEPLOY_LOG})"

log "building ${SHA:0:12}"
(
  cd "${RELEASE_DIR}"
  export NODE_ENV=production
  export NEXT_TELEMETRY_DISABLED=1
  npm run build
) >>"${DEPLOY_LOG}" 2>&1 || die "build failed for ${SHA:0:12} (see ${DEPLOY_LOG})"

[ -f "${RELEASE_DIR}/.next/BUILD_ID" ] || die "build produced no .next/BUILD_ID"

# ---------------------------------------------------------------------------
# Switch + restart helpers
# ---------------------------------------------------------------------------
switch_current() {
  local target="$1"
  ln -sfn "${target}" "${BASE_DIR}/.current.tmp"
  mv -Tf "${BASE_DIR}/.current.tmp" "${CURRENT_LINK}"
}

restart_app() {
  "${PM2_BIN}" delete "${APP_NAME}" >/dev/null 2>&1 || true
  "${PM2_BIN}" start "${ECOSYSTEM}" --only "${APP_NAME}" --update-env
  "${PM2_BIN}" save >/dev/null 2>&1 || true
}

wait_healthy() {
  local tries="${1:-30}" i
  for ((i = 1; i <= tries; i++)); do
    if curl -fsS --max-time 5 -o /dev/null "${HEALTH_URL}"; then
      return 0
    fi
    sleep 2
  done
  return 1
}

prune_releases() {
  local keep="${KEEP_RELEASES}" i=0 dir current_target
  current_target="$(readlink -f "${CURRENT_LINK}" 2>/dev/null || true)"
  # Newest first; only touch directories named like a full commit sha.
  while IFS= read -r dir; do
    [ -n "${dir}" ] || continue
    i=$((i + 1))
    if [ "${i}" -gt "${keep}" ] && [ "${dir}" != "${current_target}" ]; then
      log "pruning old release ${dir}"
      rm -rf -- "${dir}"
    fi
  done < <(find "${RELEASES_DIR}" -mindepth 1 -maxdepth 1 -type d \
             -regextype posix-extended -regex '.*/[0-9a-f]{40}' \
             -printf '%T@ %p\n' 2>/dev/null | sort -rn | awk '{print $2}')
}

# ---------------------------------------------------------------------------
# Activate + verify, with rollback.
# ---------------------------------------------------------------------------
PREV_LINK="$(readlink "${CURRENT_LINK}" 2>/dev/null || true)"
PREV_TARGET="$(readlink -f "${CURRENT_LINK}" 2>/dev/null || true)"

log "activating ${SHA:0:12}"
switch_current "${RELEASE_DIR}"
restart_app >>"${DEPLOY_LOG}" 2>&1 || true

if wait_healthy 30; then
  echo "${SHA}" > "${LIVE_SHA_FILE}"
  log "deploy complete: ${SHA:0:12} live at ${HEALTH_URL}"
  prune_releases
  exit 0
fi

log_err "health check FAILED for ${SHA:0:12}"
if [ -n "${PREV_LINK}" ] && [ -d "${PREV_TARGET}" ]; then
  log_err "rolling back to previous release ${PREV_TARGET}"
  switch_current "${PREV_LINK}"
  restart_app >>"${DEPLOY_LOG}" 2>&1 || true
  if wait_healthy 30; then
    log_err "rollback complete; previous release is healthy"
  else
    log_err "rollback restart did not become healthy; manual intervention required"
  fi
else
  log_err "no previous release available to roll back to"
fi
die "deployment of ${SHA:0:12} failed"

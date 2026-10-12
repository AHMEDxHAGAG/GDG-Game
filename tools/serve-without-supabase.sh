#!/usr/bin/env bash
#
# Builds and serves the app with Supabase deliberately absent, then runs the
# Playwright suite against both servers.
#
# Why this exists: `NEXT_PUBLIC_SUPABASE_*` is inlined into the client bundle at
# build time. A developer with a working `.env.local` therefore cannot test the
# "no project configured" branch by unsetting anything at runtime — the values
# are already compiled in. `e2e/teams.no-project.spec.ts` needs that branch, so it
# gets its own server on its own port, built from an environment with the two
# variables emptied.
#
# The override is scoped to this process tree only; `.env.local` on disk is never
# touched.
#
# Usage:
#   npm run test:e2e              # both servers
#   npm run test:e2e -- --ui      # any Playwright flag passes through

set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${E2E_PORT:-3100}"
NO_PROJECT_PORT="${E2E_NO_PROJECT_PORT:-3200}"
LOG="${TMPDIR:-/tmp}/opencode/no-project-server.log"

mkdir -p "$(dirname "$LOG")"

# Scoped to the two commands below, NOT exported.
#
# This is the subtle part. Playwright spawns the main `webServer` as a child of
# this script and builds the *normal* app from it, so anything exported here is
# inherited by that build — and an exported `NEXT_PUBLIC_SUPABASE_URL=""` makes
# the "with project" server project-less too. Then the two halves test the same
# thing and the unconfigured-branch specs pass for the wrong reason. Explicit
# empty values per command override dotenv too, without affecting the main build.
NO_PROJECT_ENV=(
  NEXT_PUBLIC_SUPABASE_URL=
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
  # Its own build output, so this build cannot overwrite the `.next` that
  # Playwright's `webServer` uses for the normal build — or be overwritten by it
  # while this server is still running. See the `distDir` note in next.config.ts.
  NEXT_DIST_DIR=.next-no-project
)

DIST_DIR=".next-no-project"

SERVER_PID=""
cleanup() {
  if [[ -n "$SERVER_PID" ]]; then
    # setsid gives npm and all of its Next.js children their own process group.
    kill -TERM -- "-$SERVER_PID" 2>/dev/null || true
    wait "$SERVER_PID" 2>/dev/null || true
    kill -KILL -- "-$SERVER_PID" 2>/dev/null || true
  fi
  # Only ever removes the directory this script created.
  rm -rf "$DIST_DIR" 2>/dev/null || true
}
# The trap runs on Ctrl-C too, so a cancelled run does not leave a build holding
# the port and confusing the next one.
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

echo "==> building the project-less server on :${NO_PROJECT_PORT}"
env "${NO_PROJECT_ENV[@]}" npm run build >/dev/null

setsid env "${NO_PROJECT_ENV[@]}" npm run start -- --port "$NO_PROJECT_PORT" >"$LOG" 2>&1 &
SERVER_PID=$!

echo "==> waiting for http://127.0.0.1:${NO_PROJECT_PORT}"
for _ in $(seq 1 60); do
  if curl -fsS -o /dev/null "http://127.0.0.1:${NO_PROJECT_PORT}"; then
    break
  fi
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "!! the project-less server exited during startup:" >&2
    tail -20 "$LOG" >&2
    exit 1
  fi
  sleep 1
done

if ! curl -fsS -o /dev/null "http://127.0.0.1:${NO_PROJECT_PORT}"; then
  echo "!! the project-less server never became ready; log at $LOG" >&2
  exit 1
fi

echo "==> running the suite against :${PORT} (with project) and :${NO_PROJECT_PORT} (without)"
status=0
npx playwright test "$@" || status=$?
exit "$status"

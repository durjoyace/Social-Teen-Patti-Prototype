#!/bin/bash
# Run from any directory; the linked Railway service must use repository-root context.
set -euo pipefail
repo_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$repo_root"
command -v railway >/dev/null || { echo "Install the Railway CLI first"; exit 1; }
pnpm --filter teen-patti-server build
pnpm --filter teen-patti-server typecheck
# Use docs/durable-tables-release.md for draining, backup and migration requirements.
railway up

#!/bin/bash
# SessionStart hook for Claude Code on the web.
# Installs workspace dependencies so tests and linters work in remote sessions.
set -euo pipefail

# Only run in the remote (Claude Code on the web) environment.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# Enable Corepack so the pnpm version pinned in package.json is used.
corepack enable 2>/dev/null || true

# Install all workspace dependencies. `pnpm install` (not `ci`) lets the
# container cache benefit subsequent runs and is idempotent. This also builds
# the native onlyBuiltDependencies (esbuild, tree-sitter) and runs the
# `prepare` script which builds @understand-anything/core.
pnpm install

echo "session-start hook: dependencies installed"

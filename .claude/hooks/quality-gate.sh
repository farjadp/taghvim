#!/usr/bin/env bash
# ============================================================================
# Source: .claude/hooks/quality-gate.sh
# Version: 0.1.0 — 2026-10-15
# Why: Stop hook for Claude Code. When a session is about to finish with
#      uncommitted code changes, run the unit tests and the type check; if
#      either fails, block the stop and hand the failure back so it is fixed.
# Env / Deps: bash, git, npm; CLAUDE_PROJECT_DIR set by Claude Code.
# ============================================================================

INPUT="$(cat)"
# A stop this hook already blocked once is let through, or a failing test
# would trap the session in a loop.
if echo "$INPUT" | grep -q '"stop_hook_active"[[:space:]]*:[[:space:]]*true'; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# Only code changes need the gate; notes, docs and agent files do not.
CHANGED="$(git status --porcelain -- . ':(exclude).claude' ':(exclude)*.md' 2>/dev/null)"
[ -z "$CHANGED" ] && exit 0

FAILED=""
OUT="$(npm test --silent 2>&1)" || FAILED="${FAILED}\n--- npm test FAILED ---\n$(echo "$OUT" | tail -n 40)"
OUT="$(npm run typecheck --silent 2>&1)" || FAILED="${FAILED}\n--- npm run typecheck FAILED ---\n$(echo "$OUT" | tail -n 40)"

if [ -n "$FAILED" ]; then
  echo -e "Quality gate: fix these before finishing (AGENTS.md: run tests and typecheck before completing any change).${FAILED}" >&2
  exit 2
fi
exit 0

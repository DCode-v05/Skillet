#!/usr/bin/env bash
set -euo pipefail
if [ $# -ne 1 ]; then echo "Usage: bash validate.sh <path-to-json>" >&2; exit 1; fi
SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
REPO_ROOT="$(cd "$SKILL_DIR/../../../.." && pwd)"
exec npx --prefix "$REPO_ROOT" tsx "$REPO_ROOT/eval/validate-skill-json.ts" code-block "$1"

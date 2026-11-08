#!/usr/bin/env bash

set -euo pipefail

if [ $# -ne 1 ]; then
  echo "Usage: bash validate.sh <path-to-json>" >&2
  exit 1
fi

INPUT="$1"

if [ ! -f "$INPUT" ]; then
  echo "Error: file not found: $INPUT" >&2
  exit 1
fi

python3 - "$INPUT" <<'PYEOF'
import json
import re
import sys

path = sys.argv[1]
errors = []

def err(msg):
    errors.append(msg)

# 1. Parses as JSON
try:
    with open(path, "r", encoding="utf-8") as f:
        raw = f.read()
    data = json.loads(raw)
except json.JSONDecodeError as e:
    print(f"FAIL: not valid JSON — {e}", file=sys.stderr)
    sys.exit(1)

# 2. No leftover [placeholders] from the template.
# Match only short, single-line [...] that look like template placeholders:
#   start with a letter, no newlines, no quotes/braces inside (so JSON arrays
#   and strings containing brackets don't trigger false positives).
placeholder_pattern = re.compile(r'\[[A-Za-z][^\]\n"{}]*\]')
def _walk_strings(node):
    if isinstance(node, dict):
        for v in node.values(): yield from _walk_strings(v)
    elif isinstance(node, list):
        for v in node: yield from _walk_strings(v)
    elif isinstance(node, str):
        yield node
for s in _walk_strings(data):
    for match in placeholder_pattern.findall(s):
        err(f"unfilled placeholder still present in a string value: {match}")

# 3. Required top-level fields
required_top = ["widget", "version", "title", "options", "attributes", "summary", "followUps"]
for key in required_top:
    if key not in data:
        err(f"missing required field: {key}")

if errors:
    for e in errors: print(f"FAIL: {e}", file=sys.stderr)
    sys.exit(1)

# 4. Widget type
if data["widget"] != "comparison-table":
    err(f"widget must be 'comparison-table', got '{data['widget']}'")

# 5. Options: 2-6, unique IDs
opts = data["options"]
if not (2 <= len(opts) <= 6):
    err(f"options must have 2-6 entries, got {len(opts)}")
opt_ids = [o.get("id") for o in opts]
if len(set(opt_ids)) != len(opt_ids):
    err(f"option IDs must be unique, got: {opt_ids}")
for o in opts:
    for k in ("id", "label", "clickPromptTemplate"):
        if k not in o:
            err(f"option missing field '{k}': {o}")

# 6. Attributes: 4-10, unique IDs, valid format
attrs = data["attributes"]
if not (4 <= len(attrs) <= 10):
    err(f"attributes must have 4-10 entries, got {len(attrs)}")
attr_ids = [a.get("id") for a in attrs]
if len(set(attr_ids)) != len(attr_ids):
    err(f"attribute IDs must be unique, got: {attr_ids}")

valid_formats = {"text", "number", "currency", "boolean", "rating"}
for a in attrs:
    for k in ("id", "label", "format", "clickPromptTemplate", "cells"):
        if k not in a:
            err(f"attribute missing field '{k}': {a.get('id', a)}")
            continue
    if a.get("format") not in valid_formats:
        err(f"attribute '{a.get('id')}' has invalid format '{a.get('format')}' "
            f"(must be one of {sorted(valid_formats)})")

    # 7. Every option has a cell
    cells = a.get("cells", {})
    for oid in opt_ids:
        if oid not in cells:
            err(f"attribute '{a.get('id')}' missing cell for option '{oid}'")
        else:
            cell = cells[oid]
            for k in ("value", "isWinner", "clickPromptTemplate"):
                if k not in cell:
                    err(f"cell {a.get('id')}/{oid} missing field '{k}'")
            if not isinstance(cell.get("isWinner"), bool):
                err(f"cell {a.get('id')}/{oid} isWinner must be boolean")

    # 8. At most one winner per attribute row
    winners = [oid for oid, c in cells.items() if c.get("isWinner") is True]
    if len(winners) > 1:
        err(f"attribute '{a.get('id')}' has {len(winners)} winners "
            f"(at most one allowed): {winners}")

# 9. followUps: exactly 3 strings
fu = data["followUps"]
if not (isinstance(fu, list) and len(fu) == 3 and all(isinstance(x, str) and x for x in fu)):
    err(f"followUps must be exactly 3 non-empty strings, got {fu}")

# 10. Title length
if len(data.get("title", "")) > 80:
    err(f"title exceeds 80 chars ({len(data['title'])})")

# Report
if errors:
    print(f"FAIL: {len(errors)} validation error(s):", file=sys.stderr)
    for e in errors:
        print(f"  - {e}", file=sys.stderr)
    sys.exit(1)

print(f"OK: comparison-table widget is valid "
      f"({len(opts)} options × {len(attrs)} attributes)")
PYEOF

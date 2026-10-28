#!/usr/bin/env bash
set -euo pipefail
code=$(base64 -d < /d/Workspace/TapTap/奶茶挤挤/evidence/P1-A/20261029-p1a-repair-03/lifecycle/real-background.run-code.js.b64)
printf '%s' "$code" > /tmp/p1a-bg-decoded.js
/c/Users/vinki/.codex/skills/playwright/scripts/playwright_cli.sh --session=p1a-repair run-code "$code"
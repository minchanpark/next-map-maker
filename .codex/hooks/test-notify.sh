#!/usr/bin/env bash
set -euo pipefail

PAYLOAD='{
  "type": "agent-turn-complete",
  "thread-id": "manual-test-thread",
  "turn-id": "manual-test-turn",
  "cwd": "'"$(pwd)"'",
  "input-messages": ["Test prompt from test-notify.sh"],
  "last-assistant-message": "Hook test completed"
}'

python3 .codex/hooks/notify.py "$PAYLOAD"
echo "notify hook test sent"

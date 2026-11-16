#!/bin/bash
# Stops a running gh-notifications server listening on $PORT (default 4777).
set -euo pipefail

PORT="${PORT:-4777}"
LABEL="local.gh-notifications.server.$PORT"

# The macOS app runs the server as a launchd job; remove it so launchd does not restart it.
if command -v launchctl >/dev/null && launchctl list "$LABEL" >/dev/null 2>&1; then
  launchctl remove "$LABEL"
  for _ in $(seq 1 30); do
    lsof -nP -t -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1 || break
    sleep 0.1
  done
  echo "Removed launchd job $LABEL."
fi
PIDS="$(lsof -nP -t -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null || true)"

if [ -z "$PIDS" ]; then
  echo "Nothing is listening on port $PORT."
  exit 0
fi

for PID in $PIDS; do
  CMD="$(ps -o command= -p "$PID" 2>/dev/null || true)"
  if [[ "$CMD" != *server.js* ]]; then
    echo "Port $PORT is used by another program (pid $PID: $CMD); not stopping it." >&2
    exit 1
  fi
  kill "$PID"
  for _ in $(seq 1 20); do
    kill -0 "$PID" 2>/dev/null || break
    sleep 0.1
  done
  if kill -0 "$PID" 2>/dev/null; then
    echo "pid $PID did not exit; stopping it forcefully."
    kill -9 "$PID"
  fi
  echo "Stopped gh-notifications (pid $PID) on port $PORT."
done

#!/usr/bin/env bash
# AIAG uptime monitor — runs every 5 min via cron, alerts to Telegram
# after 3 consecutive failures. Install at /usr/local/bin/aiag-uptime.
#
# Env (loaded from /etc/aiag-uptime.env if present):
#   URL                      — health endpoint (default: prod)
#   TELEGRAM_ALERT_BOT_TOKEN — bot token for alerts
#   TELEGRAM_ALERT_CHAT_ID   — chat id for alerts
set -euo pipefail

if [[ -f /etc/aiag-uptime.env ]]; then
  # shellcheck disable=SC1091
  source /etc/aiag-uptime.env
fi

URL="${URL:-https://ai-aggregator.ru/api/health}"
LOG="${LOG:-/var/log/aiag-uptime.log}"
FAIL_COUNT_FILE="${FAIL_COUNT_FILE:-/tmp/aiag-uptime-fails}"

CODE=$(curl -sIo /dev/null -w '%{http_code}' --max-time 8 "$URL" || echo "000")
TS=$(date -Iseconds)

if [[ "$CODE" =~ ^2 ]]; then
  echo "$TS OK $CODE" >> "$LOG"
  if [[ -f "$FAIL_COUNT_FILE" ]]; then
    PREV=$(cat "$FAIL_COUNT_FILE" 2>/dev/null || echo 0)
    rm -f "$FAIL_COUNT_FILE"
    if (( PREV >= 3 )) && [[ -n "${TELEGRAM_ALERT_BOT_TOKEN:-}" && -n "${TELEGRAM_ALERT_CHAT_ID:-}" ]]; then
      curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_ALERT_BOT_TOKEN}/sendMessage" \
        --data-urlencode "chat_id=${TELEGRAM_ALERT_CHAT_ID}" \
        --data-urlencode "text=✅ AIAG recovered: ${URL} — ${CODE}" >/dev/null || true
    fi
  fi
else
  COUNT=$(( $(cat "$FAIL_COUNT_FILE" 2>/dev/null || echo 0) + 1 ))
  echo "$COUNT" > "$FAIL_COUNT_FILE"
  echo "$TS FAIL $CODE (count=$COUNT)" >> "$LOG"
  if (( COUNT == 3 )); then
    if [[ -n "${TELEGRAM_ALERT_BOT_TOKEN:-}" && -n "${TELEGRAM_ALERT_CHAT_ID:-}" ]]; then
      curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_ALERT_BOT_TOKEN}/sendMessage" \
        --data-urlencode "chat_id=${TELEGRAM_ALERT_CHAT_ID}" \
        --data-urlencode "text=🚨 AIAG down: ${URL} → ${CODE} (${COUNT} consecutive fails)" >/dev/null || true
    fi
  fi
fi

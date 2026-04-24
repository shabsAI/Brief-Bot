#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/user/Brief-Bot"
DATE=$(date +%Y-%m-%d)
DISPLAY_DATE=$(date "+%A, %B %-d, %Y")
LOG_FILE="${REPO_DIR}/briefing.log"

# Load API key
if [ -f "${REPO_DIR}/.env" ]; then
  source "${REPO_DIR}/.env"
fi

echo "[$(date)] Starting briefing generation" >> "$LOG_FILE"

PROMPT="You are a personal intelligence researcher producing a daily briefing for SHABS (two people: Abby, a UX Designer, and Shane, a Mechanical Engineer) based in St. Louis, MO.

Output only the briefing in plain text with markdown formatting — no preamble, no explanation, no HTML.

Rules:
- High signal, low noise. Impact over clicks.
- Balanced perspective on partisan issues.
- Mark unverified or breaking stories with (UNVERIFIED) or (BREAKING).
- Cite sources inline (e.g. via Reuters, WSJ).
- Today's date: ${DISPLAY_DATE}

Use this format exactly:

# Good morning, SHABS — ${DISPLAY_DATE}

## Weather — St. Louis
Current temp and conditions, high/low, wind, humidity. Then a 4-day forecast.

## Markets
S&P 500, Nasdaq, Dow Jones, 10-Yr Yield, Bitcoin, Oil (WTI) — value and % change each.
One or two sentence market context summary.

## World News
3–5 stories in this format:
[WORLD/ECONOMY/TECH] Headline — 1–2 sentence summary with source.

## US News & Politics
3–5 stories in this format:
[POLITICS/ECONOMY] Headline — 1–2 sentence summary with source.

## Today's To-Do
3–5 items in this format:
[HIGH/MED/LOW] Task — optional note or time
"

/opt/node22/bin/claude -p "$PROMPT"

echo "[$(date)] Briefing complete for ${DATE}" >> "$LOG_FILE"

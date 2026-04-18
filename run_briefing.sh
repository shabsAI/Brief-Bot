#!/usr/bin/env bash
set -euo pipefail

REPO_DIR="/home/user/Brief-Bot"
OUTPUT_FILE="${REPO_DIR}/briefing.html"
TEMPLATE_FILE="${REPO_DIR}/briefing_template.html"
DATE=$(date +%Y-%m-%d)
DISPLAY_DATE=$(date "+%A, %B %-d, %Y")
LOG_FILE="${REPO_DIR}/briefing.log"

# Load API key
if [ -f "${REPO_DIR}/.env" ]; then
  source "${REPO_DIR}/.env"
fi

exec >> "$LOG_FILE" 2>&1
echo "[$(date)] Starting briefing generation"

# Ensure we're on main and up to date
cd "$REPO_DIR"
git checkout main
git pull origin main

PROMPT="You are a personal intelligence researcher producing a daily briefing for SHABS (two people: Abby, a UX Designer, and Shane, a Mechanical Engineer) based in St. Louis, MO.

Produce today's briefing as valid HTML only — no markdown, no preamble, no explanation. Use the template below and fill in every <!-- REPLACE --> placeholder with real, current, verified data. Do not change the HTML structure or CSS.

Rules:
- High signal, low noise. Impact over clicks.
- Balanced perspective on partisan issues.
- Mark unverified/breaking stories as such.
- Cite sources inline in the summary text (e.g. via Reuters, WSJ).
- Today's date: ${DISPLAY_DATE}

TEMPLATE:
$(cat "$TEMPLATE_FILE")
"

/opt/node22/bin/claude -p "$PROMPT" > "$OUTPUT_FILE" 2>&1

# Push to GitHub
git add briefing.html
git commit -m "Briefing ${DATE}"
git push origin main

echo "[$(date)] Briefing published for ${DATE}"

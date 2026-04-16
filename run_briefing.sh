#!/usr/bin/env bash
set -euo pipefail

BRIEFING_DIR="/home/user/Brief-Bot/briefings"
DATE=$(date +%Y-%m-%d)
OUTPUT_FILE="${BRIEFING_DIR}/${DATE}.md"

mkdir -p "$BRIEFING_DIR"

PROMPT='You are a personal intelligence researcher. Your goal is to produce a concise, high quality daily news briefing (US and work) that mirrors a presidential daily briefing but for shabs. Focus on developments from the last 24-48hrs.

High signal, low noise: Focus on impact not just clicks.
Balanced perspective: If a story is highly partisan or contested, briefly explain the differing narratives.
Accuracy: Only include verified information. If a story is breaking and unconfirmed, note it as such.
Citation: Cite your sources at the end of each story.'

/opt/node22/bin/claude -p "$PROMPT" > "$OUTPUT_FILE" 2>&1

echo "Briefing saved to $OUTPUT_FILE"

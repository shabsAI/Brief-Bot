# Brief-Bot — Claude Instructions

## Project Overview

Brief-Bot generates a personalized daily HTML briefing (`briefing.html`) for SHABS (Abby + Shane) in St. Louis, MO. The briefing is produced by `run_briefing.sh`, which calls Claude CLI to fill `briefing_template.html` with live weather, market, and news data, then commits the result to GitHub.

## Responding to "Today's Briefing" Requests

When the user asks for **today's briefing**, their daily brief, or any variation of requesting the current briefing, do the following:

1. Read `/home/user/Brief-Bot/briefing.html`
2. Extract and render the content as clean, readable markdown using the format below — do NOT dump raw HTML

### Markdown Output Format

```
# [Greeting from header] — [Date from header]

---

## 🌤 Weather — St. Louis
**[temp]** · [description]
High [x]° · Low [x]° · Wind [x] · Rain [x]

**Forecast:** [Day] [emoji] [temp] · [Day] [emoji] [temp] · ...

---

## 📈 Markets
| | Value | Change |
|---|---|---|
| S&P 500 | ... | ▲/▼ ... |
| Nasdaq | ... | ▲/▼ ... |
| Dow Jones | ... | ▲/▼ ... |
| 10-Yr Yield | ... | ▲/▼ ... |
| Bitcoin | ... | ▲/▼ ... |
| Oil (WTI) | ... | ▲/▼ ... |

> [market context text]

---

## 🌍 World News
**[TAG] [Headline]**
[Summary]

**[TAG] [Headline]**
[Summary]

...

---

## 🇺🇸 US News & Politics
**[TAG] [Headline]**
[Summary]

...

---

## ✅ Today's To-Do
- 🔴 **[high priority task]** — [sub-note]
- 🟡 **[med priority task]** — [sub-note]
- 🟢 **[low priority task]** — [sub-note]
```

### Priority color mapping
- `priority-high` → 🔴
- `priority-med` → 🟡
- `priority-low` → 🟢

### Tag formatting
Render tags inline before the headline in brackets: `**[World]**`, `**[Tech]**`, `**[Politics]**`, `**[Economy]**`, `**[Breaking]**`

### Notes
- Preserve all source citations (e.g., "via Reuters") from summaries
- If `briefing.html` is missing or empty, say so and suggest running `./run_briefing.sh`
- Do not truncate news summaries — include the full text

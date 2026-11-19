[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/slothanabot/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/slothanabot/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

# Vice City Trophy Ledger — Grand Theft Auto VI (PS5)

A complete, offline guide and tracker for all 55 official PlayStation 5 trophies of Grand Theft Auto VI (1 platinum, 2 gold, 6 silver, 46 bronze; 0 online). Every trophy has its official name and description, a plain-words guide with steps, a missable flag where it applies, and a named, linked source (PowerPyx, TrueTrophies, Exophase, PSNProfiles).

## What is inside

- **Ledger** — a filterable 55-trophy table (kind, grade, earned status, missable-only) under a sticky progress header with a progress ring and per-grade counts. Search across names, descriptions and guides. Click **Guide** on any row to open its full guide panel.
- **Roadmap** — five stages to the platinum: Story (Chapters 1–5, ~60–80 h), Side strands, Activities, Collectibles & exploration, then Crime, economy & the platinum (~200 h total, difficulty 4/10 per PowerPyx).
- **Missables** — all 14 one-time trophies in one place. Only Positive Mental Attitude is confirmed missable by the guide sites (the first meditation, at Jason's house, in Chapter 1); the rest are flagged as one-time moments because GTA VI has no mission replay and no New Game+.
- **Tracker** — tick trophies off as you earn them; progress is saved in the browser (localStorage). Export your progress to a file and import it back on another device.
- **Spoiler-safe** — a setting that hides the names and descriptions of story trophies until you earn them.
- **Offline** — static files only, system fonts, no network requests. The source links on each guide panel are plain links to the cited guide sites.

## Honesty note

A few triggers were not yet confirmed by the guide sites when this ledger was written (Challenging Tank, Personal Best, Bad Luck I Guess, The Truth Is Out There). Their guides say so plainly and follow the official description rather than guessing.

## Run it

```sh
# Serve the app (Node 22)
node serve.ts
# then open http://localhost:8080

# Build the hand-in (dossier.json + app + screenshots)
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Screenshots live in `screenshots/` (ledger, guide panel, roadmap, missable filter + spoiler). The entry is a [make.fun bounty](https://make.fun/bounty/gta6-trophy-guide-01) submission.

Fan-made, unofficial. Grand Theft Auto and GTA are trademarks of Take-Two Interactive. No Rockstar assets are used.

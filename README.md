# gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/slothanabot/gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/slothanabot/gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Vice City Trophy Ledger — an offline, open-source trophy guide and tracker for Grand Theft Auto VI: all 55 PS5 trophies (1 platinum, 2 gold, 6 silver, 46 bronze) with own-words guides, cited sources, a 5-stage roadmap to the platinum (~200 hours, 4/10), and the 14 missable trophies flagged. Progress saves in the browser with export/import, filters by story / missable / collectibles / activities / online, and a spoiler setting that hides story trophy names until earned. Fully offline — no network, no account, no Rockstar artwork.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome. Or open `app/index.html` directly from any static file server with `app/` at its root.

## Deep links

- `#trophy-17` opens a trophy's full guide
- `?tab=roadmap` opens the roadmap, `?tab=missables` the missable list
- `?kind=missable&spoiler=on` shows the missable filter with spoilers hidden
- `?demo=1` previews the ledger with sample progress (not saved)

---

<sub>Entered on [make.fun](https://make.fun/?ref=x15bjha9&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>

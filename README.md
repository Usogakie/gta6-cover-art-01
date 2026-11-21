# gta6-cover-art-01

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Usogakie/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Usogakie/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Vice Cover Studio — turn your photo and a caption into GTA-style cover art: multi-panel posters with a Vice City sunset grade, exported as a PNG to share. Built by an AI agent for make.fun's “Make GTA 6 Cover Art” bounty, $250 in USDC.

## What it does

- **Any photo:** load up to three of your own photos (or try the bundled samples), crop and position each by dragging on the cover, scrolling to zoom, or with the zoom/pan sliders.
- **Four panel layouts:** one hero photo plus two panels, three vertical strips, a 2×2 grid, or a single full-bleed photo — with one photo filling every panel or a different photo per panel.
- **Bold caption lettering:** an editable caption and tagline in heavy outlined display type, with caption and accent colour choices.
- **Sunset grade:** a Vice City orange-to-magenta wash, film grain and a poster frame, all adjustable.
- **Fast and easy:** pick a photo, type a caption, export — in the common post sizes 1080 × 1080, 1080 × 1350 and 1920 × 1080.

The app is plain static files under `app/` with no build step and no network requests: photos are read on your own machine and never uploaded. All artwork is original — no Rockstar Games logo, artwork or font.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the vendored make.fun library.

---

<sub>Entered on [make.fun](https://make.fun/?ref=skbtbry2&utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01) · AI agents build software for cash rewards</sub>

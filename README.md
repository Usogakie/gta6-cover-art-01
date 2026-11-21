# gta6-cover-art-01

[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Usogakie/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Usogakie/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your photo and a caption into GTA-style cover art — multi-panel posters with a Vice City sunset grade, exported as PNG.

## Features

- Load up to three of your own photos (or try the bundled samples).
- Crop and position each photo by dragging on the cover, scrolling to zoom, or with zoom/pan sliders.
- Four panel layouts: one hero photo plus two panels, three vertical strips, a 2x2 grid, or a single full-bleed photo — with one photo filling every panel or a different photo per panel.
- Editable caption and tagline in heavy outlined display type, with caption and accent colour choices.
- Sunset grade (orange-to-magenta wash), film grain and poster frame, all adjustable.
- Export in 1080x1080, 1080x1350, 1920x1080.

## Notes

- Plain static files under `app/`, no build step, no network requests.
- Photos never leave the machine — everything runs locally in your browser.
- All artwork is original; no Rockstar logo, artwork, or font is used.

## Run

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome.

## Hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Entered on make.fun with referral skbtbry2.

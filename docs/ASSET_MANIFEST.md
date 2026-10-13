# Asset map

The project uses one approved 3D cartoon art direction. Every food, Polly pose, lesson badge, wooden panel and backdrop follows it. No unrelated bird or generic stock art appears in the live interface.

- `public/assets/polly/`: five feather palettes with standing and expressive poses. Files are named `pose-palette.webp`.
- `public/assets/foods/`: ten separate snack images. Their names match `src/game.mjs`.
- `public/assets/ui/approved-logo.png`: resized from the approved project logo.
- `public/assets/ui/submission-logo.png`: the full-resolution approved logo used for the hackathon submission, 1254 x 1254 PNG.
- `public/assets/ui/favicon.png`: a 64 px mark generated from the submission logo and referenced by `index.html`, so a page load no longer logs a `/favicon.ico` 404.
- `public/assets/ui/tropical-deck.webp`: a matching tropical game backdrop generated for this release.
- `public/assets/ui/lesson-0.png` through `lesson-7.png`: eight distinct wooden game icons.
- `public/assets/reference/`: original character sheets, action sheets, food sheet, brand logo, and approved game concept. They are retained for visual checks.

`node scripts/validate-assets.mjs` confirms required files exist. The browser test also checks that displayed images decode successfully.

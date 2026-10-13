# Asset map

The project uses one approved 3D cartoon art direction. Every food, Polly pose, lesson badge, wooden panel and backdrop follows it. No unrelated bird or generic stock art appears in the live interface.

- `public/assets/polly/`: five feather palettes with standing and expressive poses. Files are named `pose-palette.webp`.
- `public/assets/foods/`: ten separate snack images. Their names match `src/game.mjs`.
- `public/assets/ui/approved-logo.png`: resized from the approved project logo.
- `public/assets/ui/tropical-deck.webp`: a matching tropical game backdrop generated for this release.
- `public/assets/ui/lesson-0.png` through `lesson-7.png`: eight distinct wooden game icons.
- `public/assets/reference/`: original character sheets, action sheets, food sheet, brand logo, and approved game concept. They are retained for visual checks.

`node scripts/validate-assets.mjs` confirms required files exist. The browser test also checks that displayed images decode successfully.

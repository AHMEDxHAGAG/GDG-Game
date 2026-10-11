# Pirate interface asset revamp

The current ten-question journey, local scoring, ranked selection, persistence,
and route guards are retained. The screenshots and JSON under `assests/UI/` are
historical visual references; their eight-question flow is not the app contract.

## Preparing artwork

Run `npm run assets:prepare` after replacing original artwork. The preparation
script uses the `sharp` installation supplied by Next.js, preserves originals,
and publishes a curated set of WebPs plus `src/generated/ui-assets.json`.
Generated assets are committed so ordinary builds need no conversion step.

- Opaque scenes have 768px and 1200px long-edge variants.
- Characters have 256px, 512px, and 768px width variants, retaining their 2:3 ratio.
- Transparent UI and props are trimmed before resizing; compact emblems are 64px.
- Panels and controls use nine-slice CSS borders and content-driven heights.
- The poster frame is recomposed into 1080×1350 with fixed-size corners. The
  poster uses real image elements so its decoder sees every artwork layer.

## Screen mapping

| Screen | Source scenery | Foreground |
| --- | --- | --- |
| Landing | Harbor sky #2 | Skull-sail ship #3, pier #1, five-character crew |
| Quiz | Empty-center cabin #8 | Lantern #24, question scroll #3, answer strip #2 |
| Analyzing | Ocean voyage #5 | Brigantine #26, scroll panel #4 |
| Matches and tracks | Dark cabin #9 | Recommendation panel #12 / character-card plate #8 |
| Result | Deck #6 | Ornate frame #10, chosen character, ornate track emblem |
| Presentation | Harbor sky #2 | Pier #1, five characters, unobstructed QR plate |

Red action plate #5 and navy button plate #6 skin the shared buttons. Compact
emblems use gear #15, circuit brain #11, brackets #16, bars #12, and shield #9;
ornate versions use #14, #8, #13, #10, and #6 respectively. Alternate scenes,
duplicate icons, and extra props are intentionally outside the published set.

## Result content

The downloadable 4:5 poster contains brand, optional username, a large character,
persona title, Arabic/English track names, tagline, and rank/score. Strengths,
traits, and the authored secondary recommendation remain fully readable on the
result page. The poster export API, PNG dimensions, filenames, and share fallback
are unchanged. The result page is one column on phones, and details-right,
poster-left at desktop widths.

## Arabic copy

The interface, questions, results, accessibility labels, and metadata use plain
Egyptian Arabic. Technical track names and pirate identities retain their names.
Rewritten result prose is marked `authored`; the original reference files stay
untouched. Question ids, answer affinities, and scoring stay fixed.

## Verification

Run typecheck, lint, unit tests, production build, and Playwright. Asset tests
check published files and variants. Browser coverage checks the existing flow,
gallery controls, narrow layouts, 200% text enlargement, reduced motion, and all
five poster exports.
Inspect the exported PNGs as well as the page: correct dimensions alone do not
prove Arabic text and image layers rendered correctly.

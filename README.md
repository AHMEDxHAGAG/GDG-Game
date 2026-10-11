# GDGoC — اكتشف شخصيتك

A mobile-first, Arabic RTL personality quiz for the
**Google Developer Groups on Campus (GDGoC) AASTMT Aswan** orientation event.

Visitors answer **ten single-select questions**, and each answer adds weighted
points to two of the five GDGoC tracks. The answers produce a ranked list —
first, second, third and so on — and the visitor **picks the match they like**,
not necessarily the top one. They then get a downloadable card showing **their
username and the chosen track**.

Scoring is a pure, synchronous function that runs entirely in the browser.
There is no AI, no server, no API key, and nothing leaves the device.

```
Landing → Quiz Q1..Q10 → Analyzing → Ranked matches → Pick one → Card → Download PNG
```

- Design source of truth: `assests/UI/` (spec bundle + reference screenshots)
  and `assests/Characters/` (the five production pirate PNGs).
- Rich scene backgrounds, parchment controls, and frames use the curated assets
  documented in `docs/UI_ASSET_REVAMP.md`. The card is an identity poster; full
  strengths, traits, and recommendations appear on the result page.
- Projector screen at `/present` with a configurable QR code.
- Session resume, RTL-safe Arabic/English copy, reduced-motion support, and a
  client-side 1080×1350 PNG export.

## Quick start

```bash
npm install
npm run assets:prepare # regenerate optimized artwork after source changes
npm run dev        # http://localhost:3000
npm run test       # vitest
npm run test:e2e   # playwright (builds + serves the app itself)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (flat config)
npm run build      # production build
npm start          # serve the production build
```

Requirements: Node.js `>=20.9.0`. Browser tests need Chromium once:
`npx playwright install chromium`.

Interface copy lives in `src/content/ui.ts`, the question bank in
`src/content/questions.ts` and the persona result copy in
`src/content/tracks.ts`. After editing any of them run
`python3 tools/check-copy.py`, which rejects stray non-Latin characters that
would otherwise render as tofu in the Arabic UI.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Absolute URL encoded in the `/present` QR code | Current origin at runtime, so `npm run dev` works with no config |

No API keys are required — scoring runs fully offline.

## How the scoring works

```
Each option carries { primary: 3, secondary: 1 }
10 answers × 4 points = 40 points spread across the five tracks
```

Ranking is deterministic: score → primary hits → secondary hits → fixed track
order. Over the whole bank each track is the primary of exactly **8** options and
the secondary of exactly **8**, so the question set cannot favour any track —
only the visitor's answers can.

See `docs/AGENT_CONTEXT.md` for the full fairness analysis and the measured
distribution.

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing — hero, five personas, optional username, start |
| `/quiz` | The ten MCQs |
| `/analyzing` | Scoring beat |
| `/matches` | Ranked 1st–5th; the visitor chooses |
| `/result/[trackId]` | Card for the chosen track |
| `/tracks` | Five-persona gallery |
| `/present` | Projector screen with QR |

`/analyzing` is not the spec's `/loading`: `app/loading.tsx` is a reserved
Next.js App Router filename.

## Repository structure

```text
src/
  app/                 # page, quiz, analyzing, matches, result/[trackId],
                       # tracks, present
  components/
    characters/        # CharacterArtwork, CharacterPortrait, TrackEmblem
    shared/            # NauticalBackground, ParchmentPanel, PirateButton, art
  content/
    questions.ts       # the ten questions and their weights
    tracks.ts          # per-persona result copy
    ui.ts              # all other interface copy
  features/
    quiz/              # types, scoring, reducer, provider, storage, screens
    matches/           # ranked matches screen
    tracks/            # gallery screen
    reveal/            # ResultScene, ResultCard (PNG export), ResultActions
  config/              # characters (the five personas), site
  generated/           # artwork manifest and UI asset catalogue — generated
  lib/                 # ids, typed route builders
assests/               # supplied design source — do not modify
public/assets/characters/  # originals and responsive WebPs, named by TrackId
public/assets/ui/      # curated scene, control, emblem, and poster derivatives
docs/                  # AGENT_CONTEXT, OVERHAUL_IMPLEMENTATION_PLAN
tools/                 # artwork manifest generator, copy checker
e2e/                   # Playwright specs
```

## Character artwork

The optimized cutouts live in `public/assets/characters/`, named by `TrackId`.
Run `npm run assets:prepare` after updating the originals — `tools/generate-artwork-manifest.mjs` regenerates
`src/generated/artwork-manifest.ts` on `predev`, `prebuild` and `pretest`, and the
UI falls back to a designed placeholder for any track with no file on disk.

The sources are 1024×1536 transparent PNGs. Production WebPs are 768×1152 with
256px and 512px width variants (2:3 portrait, not 1:1). They render as
plain `<img>` with explicit dimensions rather than `next/image`, because the PNG
export re-fetches every image URL.

## Accessibility

Native radio groups with `fieldset`/`legend`, a `role="progressbar"` with real
values on the quiz and deliberately **no** `aria-valuenow` on the indeterminate
analyzing bar, `aria-live` announcements for question changes and the full
ranking, focus moved to the question heading on navigation, 44px minimum touch
targets, and full `prefers-reduced-motion` support.

## Docs

- `docs/AGENT_CONTEXT.md` — current architecture, invariants, and the traps
- `docs/OVERHAUL_IMPLEMENTATION_PLAN.md` — the overhaul plan this build followed

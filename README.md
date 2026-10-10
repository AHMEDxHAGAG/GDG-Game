# GDGoC — The Pirate Identity Expedition

A mobile-first, chat-driven pirate personality adventure for the
**Google Developer Groups on Campus (GDGoC) AASTMT Aswan** orientation event.

Visitors meet a pirate captain, answer ~7 open-ended scenarios in Egyptian
Arabic (with natural English track terms), then receive an animated pirate
identity reveal tied to one of five technical tracks. The real AI conversation
is **deliberately out of scope**: the app ships with a scripted
`MockConversationEngine` behind a provider-neutral `ConversationEngine`
interface, so a future server-backed engine replaces the adapter — not the
frontend.

- Live concept: cinematic welcome → free-text chat → suspense → character
  reveal → shareable result card → optional gallery.
- Projector screen at `/present` with a configurable QR code.
- Session resume, retryable errors, dev-only five-result preview, RTL-safe
  Arabic/English copy, and client-side PNG export.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run test       # vitest (20 tests)
npm run typecheck  # tsc --noEmit
npm run lint       # eslint (flat config)
npm run build      # production build
npm start          # serve the production build
```

Requirements: Node.js `>=20.9.0`.

## Environment variables

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Absolute URL encoded in the `/present` QR code | Current origin at runtime, so `npm run dev` works with no config |
| `NEXT_PUBLIC_ENABLE_DEV_TOOLS` | Force the dev-only result preview switcher in production | Off in production; on in development |

No API keys are required — the mock engine runs fully offline.

## Repository structure

```text
src/
  app/               # page.tsx (expedition), present/page.tsx (projector)
  components/        # shared / chat / characters primitives
  features/
    expedition/      # WelcomeScene, BoardingScene, ConversationScene,
                     # ExpeditionShell, expeditionReducer, ExpeditionProvider
    conversation/    # engine/ factory + MockConversationEngine, types, schemas
    characters/      # CharacterGallery (five-pirate overview + preview)
    reveal/          # RevealingScene, ResultScene, ResultCard, ResultActions
    session/         # versioned localStorage persistence + TTL
    present/         # PresentationScreen (QR + five pirates)
  config/            # site.ts (brand/QR/limits), characters.ts (5 pirates)
  content/           # ui.ts (all copy), dialogue/mockScript.ts (7 beats)
  lib/ids.ts         # collision-resistant ids with non-HTTPS fallback
public/assets/characters/   # production artwork slots (placeholder until then)
docs/AI_INTEGRATION.md      # future engine contract (architectural, no AI)
tools/check-copy.py         # stray-CJK / replacement-char guard for copy
assests/                    # supplied reference (note the legacy spelling)
```

## Character configuration

`src/config/characters.ts` is the single source of truth for the five pirates:

| Track | Pirate | Colour | Emblem |
|---|---|---|---|
| Software Engineering | The Shipwright | `#d33a2c` | gear |
| Artificial Intelligence | The Oracle | `#2e86de` | robot |
| Web Development | The Navigator | `#e88b22` | globe |
| Data Science | The Cartographer | `#8e44c4` | chart |
| Cybersecurity | The Guardian | `#22a850` | shield |

Each entry holds the English title, Arabic epithet, track name, personality
line, palette (vivid/deep/wash), emblem, motifs, artwork slot and discovery
note. Change copy or colours there — no JSX edits needed.

## How the mock dialogue works

`src/content/dialogue/mockScript.ts` holds the scripted voyage (intro + 7
scenario beats + closing). `MockConversationEngine` plays beats in order,
records genuine free-text answers, replies with **content-free**
acknowledgements (never claims understanding), advances an opaque `cursor` in
`engineState` (resume-safe), and closes with `phase: 'completed'`. Then
`getResult()` returns a fixed, clearly-labelled `origin: 'demo'` track
(`cybersecurity` by default). It never keyword-matches, scores, or classifies.


## Session persistence

`sessionStorage.ts` persists nickname, messages, phase, engine cursor, result
and timestamps to `localStorage` (`gdgoc-pirate-expedition:session`, schema
`v1`, 12-hour TTL). On reload the app hydrates to `welcome` and offers
**continue vs restart**; in-flight `awaiting`/`boarding` downgrades to
`conversation`, and unknown/expired payloads are discarded — never migrated.
A subtle footer reset clears the device session.

## Previewing all five results

Development builds show a floating **DevTools** switcher (bottom-left) that
previews any track instantly via `result/preview`. The result-screen gallery
also previews on select. Force it in production with
`NEXT_PUBLIC_ENABLE_DEV_TOOLS=true` for on-stage rehearsals only.

## Configuring the event QR code

Set the deployed URL before building:

```bash
NEXT_PUBLIC_SITE_URL=https://your-event-url.vercel.app npm run build
```

Without it, `/present` encodes the current origin at runtime — correct for
local rehearsal, but set the variable for the real event. The QR is generated
client-side (`qrcode` package); no external service is called.

## Adding / replacing character artwork

1. Export **isolated transparent** PNG/WebP files (1:1, ≥1536px source).
2. Drop them into `public/assets/characters/` as:
   `software-engineering.png`, `ai.png`, `web-development.png`,
   `data-science.png`, `cybersecurity.png`.
3. Done — `CharacterArtwork` prefers `character.artwork.src` and falls back to
   the designed ink placeholder (plus an `onError` fallback) if a file is
   missing. Update dimensions in `characters.ts` if your exports differ.

The composite `assests/characters.jpg` reference cannot be cleanly sliced into
transparent sprites, so it is **not** used in the UI. See
`public/assets/characters/README.md`.

## How result images are exported

`ResultCard` renders a fixed 4:5 card (1080x1350 @2x) with real text and
bidi-safe directions. `html-to-image` captures it after `document.fonts.ready`
so Arabic shaping survives; Web Share API with files is tried first, then PNG
download, then an explanatory error. Chat transcripts are never included.

## What remains for future AI integration

- Server-backed `ConversationEngine` (see `docs/AI_INTEGRATION.md`).
- Real personality inference, adaptive follow-ups, explanations.
- Production character PNGs (placeholders ship today).
- Optional E2E (Playwright installed, no specs yet) and event-day rehearsal.
  Unit coverage: reducer, mock engine, storage, provider flow, catalogue.

# GDGoC — اكتشف شخصيتك

A mobile-first, Arabic RTL personality quiz for the
**Google Developer Groups on Campus (GDGoC) AASTMT Aswan** orientation event.

Visitors answer **ten single-select questions**, and each answer adds weighted
points to two of the five GDGoC tracks. The answers produce a ranked list —
first, second, third and so on — and the visitor **picks the match they like**,
not necessarily the top one. They then get a downloadable card showing **their
username and the chosen track**.

Scoring is a pure, synchronous function that runs entirely in the browser.
There is no AI and no model provider — the ranking is arithmetic over a
hand-authored question bank. Answers never leave the device; the only thing
that does is the **name** a visitor gives and the room they join it to.

```
Landing → Quiz Q1..Q10 → Analyzing → Ranked matches → Pick one → Card
       → Create Team → Name → Create or join a room
```

- Design source of truth: `assests/UI/` (spec bundle + reference screenshots)
  and `assests/Characters/` (the five production pirate PNGs).
- Rich scene backgrounds, parchment controls, and frames use the curated assets
  documented in `docs/UI_ASSET_REVAMP.md`. The card is an identity poster; full
  strengths, traits, and recommendations appear on the result page.
- Projector screen at `/present` with a configurable QR code.
- No accounts and no sign-in. A visitor is a **name** plus a device-local id;
  rooms of four are backed by Supabase — see [Rooms](#rooms).
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

Copy `.env.example` to `.env.local`. **Every variable is optional** — with none
of them set the quiz, the card and the gallery all run offline and the team
screens say so instead of failing.

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Absolute URL encoded in the `/present` QR code | Current origin at runtime, so `npm run dev` works with no config |
| `NEXT_PUBLIC_SUPABASE_URL` | Your project URL, e.g. `https://abc.supabase.co` | Unset — rooms are off |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable (`sb_publishable_…`) or legacy `anon` key | Unset — rooms are off |

Both Supabase values are on **Project Settings → API** in the dashboard. Use the
publishable key, never the secret key: every `NEXT_PUBLIC_` variable is shipped
to the browser.

The key is used purely as an **anonymous** key. There is no login to
authenticate, and the database grants that role nothing but `EXECUTE` on six
room functions — it cannot read a single table.

## Rooms

The quiz needs no server. Recording a name and a room does.

### Who a visitor is

A **name**, a public random ID, and a separate secret device token, generated
with cryptographic randomness and stored together in localStorage. There is no
password, OAuth provider, or server session. When storage is blocked, identity
stays stable in memory for the lifetime of the page.

Room rosters expose only public IDs. Every mutation validates the separate token
against its SHA-256 hash in the database; neither the token nor its hash appears
in an RPC response. Access to another device's localStorage still permits acting
as that visitor, so this remains device-local identity, not account security.

The credential migration intentionally does **not** adopt old visitor IDs:
those bearer IDs were public and cannot prove ownership. Existing room data is
preserved, but returning devices start new identities (keeping their quiz and
remembered names); old memberships cannot be recovered using just an old ID.
Apply the new migration and deploy the updated client together.

### The four-person capacity rule

A room holds **at most four members**. Multiple teammates may share the same
track. Capacity and one membership per visitor are enforced **in the database**,
not just the UI:

| Mechanism | Rejects |
|---|---|
| `room_members_pkey` (primary key) | The same visitor joining twice |
| `room_members_cap_four` (trigger) | The fifth member |
| `join_room` (RPC) | Duplicate membership or a full room, with a named error |

Both the join RPC and capacity trigger lock the parent room row before counting
or inserting seats, serializing concurrent joins to the same room.

The app reports a full room in Arabic rather than a constraint-violation stack
trace: `الروم كاملة — أربع ناس max`.

### Access model

`anon` holds **no table privileges at all** — not even `SELECT`. Every read and
write goes through a `SECURITY DEFINER` function, which is what lets the rules
live in one place instead of being re-implemented in the UI and bypassed by
anyone using the REST API directly.

RLS is still enabled on all three tables. There are no policies because there
are no grants to gate; leaving it on means a future `GRANT` that forgets to
think about access fails closed instead of exposing every name in the database.

### Live roster

The room screen polls every five seconds. It does **not** use Realtime
`postgres_changes`, because a subscription needs `SELECT` on `room_members` —
which is the one thing the access model exists to prevent, since it would let
anyone enumerate every membership. Five seconds on a four-seat room is
imperceptible.

### Setup

1. **Apply the schema.** Run the files in `supabase/migrations/` in order via
   the dashboard's SQL editor or `supabase db push`. Apply each migration once;
   do not replay the historical teardown migrations over an existing project.

2. **Point the app at the project** — the two `NEXT_PUBLIC_SUPABASE_*` values
   above. Restart `npm run dev`; they are read at build time.

There is no provider to enable and no redirect URL to register.

### Verify it against the real database

```bash
PGPASSWORD=… psql "host=aws-0-<region>.pooler.supabase.com dbname=postgres \
  user=postgres.<project-ref> sslmode=require" -f tools/verify-team-rules.sql
```

Checks the rule set, every refusal, and the access model against real rows,
then rolls back. It calls the RPCs as `anon` — the role the browser actually
uses — so a function that quietly depended on privileges the app does not have
fails here rather than in someone's browser.

For the last-seat race, use a disposable migrated database with `PGHOST`,
`PGPORT`, `PGDATABASE`, and `PGUSER` configured, then run:

```bash
python3 tools/verify-room-concurrency.py
```

It checks overlapping joins through both the RPC and capacity trigger using
both different and shared tracks, then removes only its randomly generated fixtures.

### Without credentials

Unset both Supabase variables and the app behaves exactly as it did before:
no Create Team bar on the result screen, and `/create-groups` and `/team`
explain that rooms are not switched on rather than offering a dead end.

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
| `/` | Landing — hero, five personas, optional name, start |
| `/quiz` | The ten MCQs |
| `/analyzing` | Scoring beat |
| `/matches` | Ranked 1st–5th; the visitor chooses |
| `/result/[trackId]` | Card for the chosen track, plus the Create Team bar |
| `/create-groups` | Your name, then create a room or join one by its code |
| `/team/[code]` | The room: roster, join code, owner rename |
| `/tracks` | Five-persona gallery |
| `/present` | Projector screen with QR |

`/analyzing` is not the spec's `/loading`: `app/loading.tsx` is a reserved
Next.js App Router filename.

## Repository structure

```text
src/
  app/                 # page, quiz, analyzing, matches, result/[trackId],
                       # tracks, present, create-groups, team/[code]
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
    teams/             # visitor identity, room api, room screens
    tracks/            # gallery screen
    reveal/            # ResultScene, ResultCard (PNG export), ResultActions,
                       # CreateTeamCta
  config/              # characters (the five personas), site, team
  generated/           # artwork manifest and UI asset catalogue — generated
  lib/                 # ids, typed route builders, join codes, supabase client
assests/               # supplied design source — do not modify
public/assets/characters/  # originals and responsive WebPs, named by TrackId
public/assets/ui/      # curated scene, control, emblem, and poster derivatives
supabase/migrations/   # visitors + rooms schema and the room RPCs
docs/                  # AGENT_CONTEXT, OVERHAUL_IMPLEMENTATION_PLAN
tools/                 # artwork manifest generator, copy checker,
                       # verify-team-rules.sql (rule + access verification)
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

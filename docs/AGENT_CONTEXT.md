# AGENT_CONTEXT — handoff

**What this is:** a mobile-first, Arabic RTL personality quiz for GDGoC AASTMT Aswan.
Ten single-select questions are scored locally into a weighted ranking of the five
GDGoC tracks. The visitor sees first…fifth, picks the match they like, and gets a
downloadable card showing **their username and that track**.

**It is not** a chat app. The conversation engine, its composer, its message list
and its scripted dialogue were all deleted — see §5.

| Check | Command | Status |
| --- | --- | --- |
| Types | `npm run typecheck` | clean |
| Lint | `npm run lint` | 0 errors, 0 warnings |
| Unit | `npm test` | 6 files, **83 tests** pass |
| Build | `npm run build` | clean, 8 routes (all prerendered) |
| Copy | `python3 tools/check-copy.py` | clean (no CJK leakage in Arabic copy) |
| E2E | `npm run test:e2e` | **118 tests** pass (59 × mobile Pixel 7 + desktop 1440×900) |

---

## 1. Routes

| Route | File | Purpose |
| --- | --- | --- |
| `/` | `src/app/page.tsx` | Landing — hero, five personas, username field, CTA |
| `/quiz` | `src/app/quiz/page.tsx` | The ten MCQs |
| `/analyzing` | `src/app/analyzing/page.tsx` | Scoring beat |
| `/matches` | `src/app/matches/page.tsx` | Ranked 1st–5th, visitor picks one |
| `/result/[trackId]` | `src/app/result/[trackId]/page.tsx` | Card for the chosen track |
| `/tracks` | `src/app/tracks/page.tsx` | Five-persona gallery |
| `/present` | `src/app/present/page.tsx` | Projector screen with QR |

`/analyzing` is **not** the spec's `/loading`: `app/loading.tsx` is a reserved
Next.js App Router filename for a Suspense boundary, so `app/loading/` cannot
coexist with it.

---

## 2. Architecture

```
src/content/questions.ts        10 questions, each option weighted to 2 tracks
src/content/tracks.ts           per-persona result copy + `contentSource` flag
src/features/quiz/
  types.ts                      QuizOption / QuizQuestion / weight constants
  scoring/scoreAnswers.ts       pure: answers → scores + deterministic ranking
  state/quizReducer.ts          answers, index, ranking, selection
  state/QuizProvider.tsx        React binding + localStorage persistence
  state/quizStorage.ts          zod-validated v2 session
  components/                   LandingScene, QuizScene, AnalyzingScene
src/features/matches/           MatchesScene
src/features/tracks/            TracksScene
src/features/reveal/            ResultScene, ResultCard (PNG export), ResultActions
src/config/characters.ts        the five personas: palette, emblem, artwork
src/lib/routes.ts               typed route builders (next.config has typedRoutes)
```

### One provider per route — and why each route must announce itself

Every route mounts its own `<QuizProvider>`. A fresh `/quiz` therefore hydrates
from storage to `phase: 'landing'`, and the reducer's phase guards would
**silently drop every answer**.

Each scene calls `enterPhase('<phase>')` once hydration finishes. If you add a
route, do this first or your screen will render and do nothing.

### Latch the entry guards

`/matches`, `/result` and `/analyzing` redirect away if there is nothing behind
them. Those checks run **once per mount**, guarded by a ref:

```ts
if (!isHydrated || checkedEntry.current) return;
checkedEntry.current = true;
```

Without the latch, "start over" nulls `selectedTrackId`, re-triggers the guard and
redirects to `/quiz` while the real navigation to `/` is still in flight.

---

## 3. Scoring

```
Each option: { primary: 3, secondary: 1 }
10 answers × 4 points = 40 points across the five tracks
Max for one track 26 · Min 0 · Median winner 13 · Median lead 3
```

Ranking order — **total and deterministic**:

1. `score` desc
2. `primaryHits` desc
3. `secondaryHits` desc
4. `TRACK_IDS` order (fixed last resort, so the comparator is never partial)

Pure and synchronous. No engine, no network, no AI.

### Fairness invariant (enforced by tests)

Over all 40 options, each track is the **primary of exactly 8** and the
**secondary of exactly 8**; each is absent from exactly 2 of the 10 questions.
The bank cannot favour a track — only the answers can.

Secondary affinity graph:

```
SE → WEB, SEC     AI → DATA, WEB     WEB → SE, DATA
DATA → AI,  SEC   SEC → SE,  AI
```

A zero score **is** reachable (you pick 10 of 40 options; a track appears in 8),
at roughly 0.2–0.5 % per track. That is honest, not a bug — `scoreAnswers.test.ts`
pins the rate rather than pretending it cannot happen.

---

## 4. Assets

`assests/` is the design source of truth. It stays on disk but is **gitignored**
(see §8), so a fresh clone does not have it; only `npm run assets:prepare` needs
it.

- `assests/Characters/*.png` → copied to `public/assets/characters/<trackId>.png`.
  The filenames *are* the `TrackId`s; `tools/generate-artwork-manifest.mjs` derives
  `src/generated/artwork-manifest.ts` from whatever it finds there.
- `assests/UI/*.png` are **reference screenshots only**. Never ship them, never
  slice them into UI.

All five character PNGs were verified by decoding their alpha channel: 1024×1536
RGBA, transparent corners, 45–57 % transparent, 3–5 % soft glow. They are **2:3,
not 1:1** — `artwork.width/height` are 1024×1536 so the browser reserves the right
box and the export has no layout shift.

Characters render as plain `<img>`, **not** `next/image`: `html-to-image` re-fetches
every image URL while composing the export, and `/_next/image` is not a reliable
canvas source.

### Missing by design

The spec names backgrounds, props and a logo SVG that do not exist
(`assets/backgrounds/*.webp`, `assets/props/*`, `assets/branding/*.svg`).
Per the spec's own `asset_missing_behavior` these are CSS atmosphere. Do not
invent them by cropping screenshots.

---

## 5. What was deleted

The chat system, in full: `components/chat/*`, `features/conversation/**`,
`features/expedition/**`, `features/session/sessionStorage.ts`,
`content/dialogue/mockScript.ts`, `components/shared/DevTools.tsx`,
`features/reveal/RevealingScene.tsx`, `CharacterGallery`, `SecondaryAffinity`,
and `e2e/{conversation,welcome,reveal-result,present}.spec.ts`.

`docs/AI_INTEGRATION.md` went with it: there is no engine boundary left to
document, because there is no engine.

---

## 6. Things that will bite you

**Bundle weight is framework-dominated, and that is the floor.** Measured on
the production build at 360×800, each route pulls ~199 KB gzip of JS. Only
~30 KB of that is application code; the rest is React 19 + the Next 16
runtime, which this project cannot shrink. The two things that *were*
removable are gone as of the perf pass below. Before optimising further, run
the numbers rather than guessing — a DPR-1 browser says the character and
prop art is 3× oversized, and it is wrong, because real phones are DPR 2–3 and
the shipped WebPs are already sized for that.

### Perf pass: what was changed, and what was measured

| Change | Effect |
| --- | --- |
| `zod` removed from `quizStorage.ts` | **−30 KB gzip JS on 5 of 6 routes** (−120 KB decoded). The schema runtime was 122 KB raw / 34 KB gzip to validate one small localStorage payload, on the critical path of every route that mounts a provider. Hand-written guards now, same behaviour, `quizStorage.test.ts` pins all 16 cases. `/present` never mounted a provider and never paid it. |
| `generateStaticParams` on `/result/[trackId]` | The route was the app's only dynamic one (`ƒ`); every share link paid a server render. All five personas are now `●` prerendered. `dynamicParams` is deliberately left at its default: see below. |

`/result/<unknown-id>` resolves **200**, not 404, and that is intended.
`dynamicParams = false` turns it into a 404, but that same response is what a
valid shared link gets when opened on a device with no stored session — and
`ResultScene` already answers both with its "finish the quiz first" guard.
Making it a 404 would break the share case to tidy the typo case.

### The result card clips. The frame is `overflow-hidden` at a fixed 4:5, so
content that is too tall is *clipped and lost*, not scrolled. This ate the traits
and the secondary card once already. `e2e/result-card.spec.ts` → *"never clips its
own content, for any track"* measures every descendant against the frame for all
five personas. If you add a section, that test must still pass. Widening the card
(`max-w-[26rem]`) is how you buy vertical room — a wider card at a fixed aspect is
a taller one.

**The PNG export sizes twice, and silently.** `html-to-image` has *two* separate
sizing mechanisms:

- `width`/`height` size the **SVG source** only. The card still lays out at its
  natural CSS width; these do not make a bigger bitmap.
- `canvasWidth`/`canvasHeight` size the **bitmap**, and the bitmap is then
  multiplied by `pixelRatio`.

The export originally passed `width: 1080, height: 1350` *and* `pixelRatio: 3`,
believing it scaled the 360px layout up to 1080. It did the opposite: 1080 × 3 =
**3240×4050**, a 1.37 MB file. Correct is `canvasWidth`/`canvasHeight` with
`pixelRatio: 1` — the SVG then scales up vectorially, so text stays crisp and the
file is 1080×1350 at ~1.0 MB. The download test now asserts the exact geometry, so
a regression here fails CI instead of shipping a 3× file.

**Arabic RTL bidi.** Every Latin run needs `dir="ltr"` (global `unicode-bidi:
isolate` is set for you) or `dir="auto"` for user input. Track names, `GDGoC`,
`Builder` and the exported filename all contain Latin.

**Logical properties in RTL.** `start`/`end` are logical, not physical. The
landing hero stage had to be emitted in reverse (`[4,3,2,1,0]`) to appear
left-to-right as the reference does. The quiz captain uses `-start-2`, which is
the image-right in this document.

**`typedRoutes: true`.** A bare `` `/result/${id}` `` widens to `string` and fails
to typecheck. Use `resultRoute(trackId)` from `@/lib/routes`.

**Arabic-Indic digits.** Visible numbers go through `toArabicDigits()`. When
reading digits out of the DOM in a test, map `٠-٩` back first.

---

## 7. Content provenance

`content/tracks.ts` carries a `contentSource` flag per persona:

- `spec` — verbatim from the supplied result-card JSON. **Software Engineering
  and Artificial Intelligence only.**
- `authored` — written for this build to the same structure. **Web Development,
  Data Science, Cybersecurity.** The client supplied no reference for these.

`allContentIsSpecApproved()` returns `false` today. If the client sends approved
copy for the remaining three, flip the flags rather than deleting the field.

Question 3 reproduces the approved screenshot's four option texts **verbatim**;
its only change is that the data option carries `cybersecurity` as a secondary,
because the spec flags that its own example omits security entirely.

---

## 8. Next work

Nothing is blocked. Possible follow-ups, none required:

- `/tracks` cards become selectable only once a ranking exists — by design, since
  browsing must not look like scoring.
- Share currently downloads a PNG; there is no server-side result, by design.
- `assests/` is ~72 MB and is **gitignored** (it was tracked until the perf
  cleanup; `.gitignore` now carries it). It is the design source of truth and
  stays on disk, but a fresh clone does not have it. Nothing in the build path
  reads it: `prebuild`/`predev`/`pretest` run `tools/generate-artwork-manifest.mjs`,
  which only looks at `public/assets/characters/`. The one script that needs the
  originals is `npm run assets:prepare` (`tools/prepare-ui-assets.mjs`), which is
  run deliberately and now exits with an explanation rather than an ENOENT stack
  when the bundle is absent. Shrinking the existing `.git` (~75 MB) would need a
  history rewrite — deliberately not done.
- The five original `public/assets/characters/*.png` were **deleted**. They were
  byte-identical duplicates of `assests/Characters/` (verified by md5), nothing ever
  requested them — `prepare-ui-assets.mjs` resizes straight from `assests/` — and they
  cost ~9 MB in every deployment. The originals in `assests/` are the source of truth
  and are untouched.
- If Supabase is ever added: it cannot make this app faster. Scoring is local
  arithmetic, content is bundled, and there is no data path to accelerate — an
  inserted one adds a round trip. Where it would genuinely fit is live
  participation counts on `/present`, which is explicitly out of scope today
  ("No live stats, no tracking").

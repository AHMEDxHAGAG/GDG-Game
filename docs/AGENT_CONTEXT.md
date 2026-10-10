# AGENT CONTEXT — GDGoC Pirate Identity Expedition (handoff)

> Paste this whole file into a new agent session as its starting context.
> It states what exists, what is verified, what is missing, and what to do
> next, mapped against the original **MASTER_IMPLEMENTATION_PROMPT** the
> project is built from (referred to below as "the Plan", with its section
> numbers and §25 acceptance checklist).

## 0. Ground truth (re-verify before trusting)

Repo: `/home/ahmed/Projects/GDG-Game` (Next.js App Router, TypeScript strict,
Tailwind v4, React 19, ESLint flat config, Vitest, Playwright). Node `>=20.9.0`
(dev runs on v22.23.1). No API keys needed — the mock engine runs offline.

Last verified state — **all gates green**:

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | pass, 0 errors |
| Lint | `npm run lint` | pass, **0 errors and 0 warnings** |
| Unit tests | `npm run test` | 5 files, **28 tests** pass |
| Build | `npm run build` | pass; routes `/`, `/_not-found`, `/present` |
| Copy | `python3 tools/check-copy.py` | pass |
| E2E | `npm run test:e2e` | **66 tests** pass (33 × mobile 360×800 + desktop 1440×900) |

`npm run test:e2e` builds and serves the app itself (see `playwright.config.ts`),
so run it after any production-affecting change. Playwright Chromium is installed.

## 1. What has been done (matches the Plan)

### Milestones from §24

- **M1 Discovery** — existing stack reused (Next 16, Tailwind 4, Lucide, Zod,
  Vitest, Playwright). Supplied reference: `assests/characters.jpg` (composite
  1280x960 JPEG) + `assests/sharedVisual.json` (visual direction).
  *Note: GSAP was in the supplied stack but is now intentionally removed — see
  §2.4 for the decision and how to reinstate it.*
- **M2 Foundation** — design tokens in `src/app/globals.css` (parchment/ink/
  ocean/track accents, motion keyframes, reduced-motion),
  `src/config/site.ts` (brand, QR URL env, limits), `src/config/characters.ts`
  (5-pirate single source of truth), shared primitives: `PirateButton`,
  `ParchmentPanel`, `NauticalBackground` (+`ExpeditionBrand`), `nautical-art`
  SVGs, `TrackEmblem`, `PiratePlaceholder`, `CharacterArtwork` (real-art-or-
  placeholder), `CharacterPortrait`, `CharacterBadge`.
- **M3 Experience structure** — `WelcomeScene` (Arabic copy, optional/skippable
  nickname, resume offer), `BoardingScene` (skippable transition),
  `ConversationScene` (captain header + JourneyProgress + ChatMessageList with
  auto-scroll/ARIA live region + ChatComposer with Enter/Shift+Enter, length
  caps, keyboard-safe `100dvh` layout), `ExpeditionShell` phase router.
- **M4 Engine abstraction** — `ConversationEngine` interface +
  `MockConversationEngine` (scripted intro + 7 scenarios + closing, content-
  free acknowledgements, opaque cursor for resume, `failNextCalls` test seam,
  `origin: 'demo'` result), `createConversationEngine()` factory as the single
  AI-integration seam, full reducer state machine
  (`welcome → boarding → conversation ⇄ awaiting → revealing → result` +
  `error` with retry), `ExpeditionProvider` orchestration (serialization
  guard, idempotent sends, optimistic context sync, chained `getResult` on
  completion), Zod-validated `localStorage` persistence (schema v1, 12h TTL,
  safe downgrade, footer reset).
- **M5 Character results** — `RevealingScene` (suspense, skippable, with a
  1200 ms hold *after* the payload lands so it cannot flash),
  `ResultScene` (silhouette → portrait entrance, demo banner, explanation
  slot with sample label, secondary affinity only when supplied),
  `ResultCard` (fixed 4:5 export via `html-to-image`, waits for fonts,
  bidi-safe, container-query type scale), `ResultActions` (Web Share API → PNG
  download fallback → explanatory error), `CharacterGallery` (five pirates),
  dev-only `DevTools` preview switcher for all five tracks.
- **M6 Event presentation** — `/present`: title, client-side QR (`qrcode`;
  destination = `NEXT_PUBLIC_SITE_URL` or runtime origin), 3-step
  instructions, five pirate portraits, 16:9-ish composition. No
  leaderboards/tracking (per §26).
- **M7 Polish** — entrance animations + reduced-motion, `dir="auto"`/bidi
  isolation, safe-area insets, ARIA (role=log, aria-live, progressbar,
  dialog), error states (retry + give-up), `global-error.tsx`,
  `not-found.tsx`.
- **M8 Verification** — 28 unit tests (reducer incl. hydration, mock engine
  incl. progress regression, storage, provider orchestration, character
  catalogue) **+ a 66-test Playwright suite** in `e2e/` covering welcome,
  conversation, reveal/result, `/present`, session persistence, footer
  behaviour and result-card legibility at two viewports.

### Deliverables from §27

- `README.md` — concept, commands, env vars, structure, character config,
  mock dialogue, persistence, five-result preview, QR configuration, artwork
  replacement, export behavior, future AI work.
- `docs/AI_INTEGRATION.md` — interface contract, server-engine wiring point
  (`engine/index.ts`), async handling, expected result object, undecided
  items, pre-integration blockers. **No provider, model, or system prompt**
  (per §15).
- `.env.example` — documents `NEXT_PUBLIC_SITE_URL` /
  `NEXT_PUBLIC_ENABLE_DEV_TOOLS`.

## 2. What is missing / undone (real gaps, ordered by priority)

1. **Production character artwork (blocks §25 "supplied artwork used")**
   — `public/assets/characters/` contains only a README. The composite
   `assests/characters.jpg` was judged unsliceable into clean transparent
   sprites, so the UI ships designed ink placeholders (`PiratePlaceholder`).
   The plumbing is done: `tools/generate-artwork-manifest.mjs` runs at build
   time, writes `src/generated/artwork-manifest.ts`, and `CharacterArtwork`
   skips the network request entirely for tracks with no file — so there are
   no 404s and no broken-image flash. TODO: obtain or extract isolated
   transparent PNGs for the 5 tracks, drop them in with the exact filenames in
   `public/assets/characters/README.md`, update `width`/`height` in
   `src/config/characters.ts` if dimensions differ. Nothing else to change.
2. **No deployment** — Vercel-compatible but never deployed; QR needs a real
   `NEXT_PUBLIC_SITE_URL` before the event (§12: do not invent a URL).
3. **Reference folder typo** — `assests/` (sic) left untouched on purpose;
   flag if renaming (update README paths).
4. **GSAP intentionally removed** — the Plan §10 asks for GSAP on cinematic
   transitions. It was installed but had zero call sites; all motion is CSS
   keyframes under a `prefers-reduced-motion` guard. Rather than ship a dead
   ~70 KB dependency, it was removed from `package.json`. The reveal already
   satisfies §25 ("reveal is animated and skippable") via CSS. To reinstate:
   `npm i gsap`, then add a timeline in `RevealingScene` behind an
   `if (prefersReducedMotion) skip()` guard — the existing E2E reveal tests
   will catch regressions.
5. **Not covered by tests** — the `/present` QR *scanning* path (canvas
   renders and is asserted, but no camera decode), and true device testing on
   real iOS/Android hardware. Playwright viewports are a good proxy, not a
   substitute.

## 3. Bugs found by visual QA and fixed (keep in mind when editing)

These were invisible to unit tests and to `tsc`; they only showed up in a real
browser. Re-run the E2E suite after touching any of these areas.

- **`TrackEmblem` silently dropped `className`** — `Frame` destructured only
  `{children, color, title}` and never spread the remaining SVG props onto the
  `<svg>`. Every `size-*` passed to it was discarded, so the emblem fell back
  to its `viewBox` ratio and inflated whatever container it sat in (it was
  silently making the result card's footer 86 px instead of 44 px and pushing
  the card content out of frame). Fixed in
  `src/components/characters/TrackEmblem.tsx` by spreading `...rest` *first*
  so the fixed attributes still win, plus `width`/`height` 100 % defaults.
- **Result card clipped its own text** — a fixed `aspect-[4/5]` height plus a
  fixed `h-72` portrait overflowed the card on narrow viewports; the card is
  `overflow-hidden`, so the title, track, personality and footer were silently
  cut off **in the exported PNG as well as on screen**. The 4:5 ratio is a hard
  requirement (Instagram story), so the fix was to make the content scale, not
  to let the card grow: `@container` + `@min-[23rem]:` type scale, a
  container-unit portrait box (`h-[36cqw] w-[30cqw]`), and a short
  `ui.reveal.demoTag` on the card. `e2e/reveal-result.spec.ts` now asserts both
  that every child box is inside the card *and* that the inner column does not
  overflow.
- **A viewBox SVG ignores `height: 100%`** — `height:100%` against an
  indefinite parent resolves to `auto`, so the portrait grew to
  width × 1.3 and painted over the title. Sizing the box in `cqw` units gives
  `preserveAspectRatio` something definite to letterbox inside.
- **Reset bar floated over the card** — `ExpeditionFooter` is `fixed`; on the
  result screen it sat on top of the shareable card. `result` was added to
  `IMMERSIVE_PHASES`; the link is still reachable from the welcome screen.
- **`MockConversationEngine` progress overran** — progress could advance past
  the scenario count and render "8 من 7". Fixed with a regression test.
- **Hydration mismatches** — nickname state, the provider's hydration flag and
  the `/present` QR origin are all runtime-only. The reducer carries an
  explicit hydration flag; the strict lint rules `react-hooks/set-state-in-effect`
  and `react-hooks/refs` are back to **error**.

## 4. Plan §25 acceptance checklist — status

- [x] Working independent web app; pirate theme matches visual direction
- [x] All five GDGoC pirate identities (config + reveal + gallery)
- [ ] **Supplied character artwork used** — placeholders only (§2.1); all
      plumbing in place, only the PNGs are missing
- [x] Mobile-first; Egyptian-Arabic primary with English terms; free-text
      chat only; no multiple-choice, no team stage, no separate stage B
- [x] Complete mock conversation (7 scenarios → reveal)
- [x] Mock engine clearly separated from future AI (interface + factory)
- [x] No real AI provider/scoring; demo results explicitly labelled
- [x] Restart and resume work (unit- **and** E2E-tested)
- [x] Each character has a polished result screen (all five previewable)
- [x] Reveal is animated and skippable
- [x] Result-card export implemented **and verified in a real browser**
      (download asserted; card geometry asserted)
- [x] Common mobile sizes covered by CSS **and** by a 360×800 E2E viewport
- [x] Projector QR screen exists (`/present`)
- [x] Important interactions accessible; error + loading states exist
- [x] TypeScript and production build pass
- [x] Ready for future AI integration without frontend rewrites
      (`docs/AI_INTEGRATION.md`)

## 5. Suggested next tasks (in order)

1. Land the 5 transparent character PNGs in `public/assets/characters/` — the
   build picks them up automatically, then re-run the E2E suite and check the
   result card at both viewports (real artwork changes the portrait's aspect).
2. Deploy, then set the real `NEXT_PUBLIC_SITE_URL` so the `/present` QR
   resolves (§12 — do not invent a URL).
3. Optional polish: GSAP reveal timeline (§2.4), real-device pass on iOS
   Safari and Android Chrome.
4. Commit with:
   `git -c user.name="GDG-Game Builder" -c user.email="builder@gdgoc.local"`
   (no git identity configured on this machine).

## 6. Hard constraints to keep honoring (from the Plan)

- **§15 — no AI**: no provider, no LLM SDK, no system prompt, no keyword
  heuristics, no API keys, no client-side LLM calls. Future AI = implement
  `ConversationEngine` and swap it in `src/features/conversation/engine/index.ts`.
- **§2/§26 — no scope creep**: no accounts, leaderboards, multiplayer,
  island navigation, analytics, WhatsApp portal, databases.
- **§2 — honesty**: demo results must never read as analysed personalities;
  keep `origin: 'demo'` labels (the card carries the short `demoTag`, the
  result screen keeps the full `demoBanner`) and the mock-engine note in the
  chat header.
- **Arabic-first copy** lives in `src/content/ui.ts` and
  `src/content/dialogue/mockScript.ts` — never hardcode copy in JSX (§22).
  Run `python3 tools/check-copy.py` after editing copy.
- Conventions: feature folders under `src/features`, `@/` path alias,
  `React.JSX.Element` return types, lint-enforced `type` imports, absolute
  paths when referring to files.
- **Shared components must forward their props.** A component that accepts
  `className` and silently discards it is a real bug here — it caused the card
  clipping in §3. Spread `...rest` onto the DOM node.
- Before claiming done: `npm run typecheck && npm run lint && npm run test &&
  npm run build && python3 tools/check-copy.py && npm run test:e2e`.
# AGENT CONTEXT — GDGoC Pirate Identity Expedition (handoff)

> Paste this whole file into a new agent session as its starting context.
> It states what exists, what is verified, what is missing, and what to do
> next, mapped against the original **MASTER IMPLEMENTATION PROMPT** the
> project is built from (referred to below as "the Plan", with its section
> numbers and §25 acceptance checklist).

## 0. Ground truth (re-verify before trusting)

Repo: `/home/ahmed/Projects/GDG-Game` (Next.js App Router, TypeScript strict,
Tailwind v4, React 19, ESLint flat config, Vitest). Git history:

- `ce5fae4` — Complete Pirate Identity Expedition: playable voyage, reveal,
  projector screen, tests, docs (62 files)
- `db4e2a9` — Fix test wrappers to JSX children (lint react/no-children-prop)

Last verified state (all green):

| Check | Command | Result |
|---|---|---|
| Types | `npm run typecheck` | pass |
| Tests | `npm run test` | 5 files, 22 tests pass |
| Lint | `npm run lint` | **0 errors, 7 warnings** (see §3.1) |
| Build | `npm run build` | pass; routes `/`, `/_not-found`, `/present` |
| Copy | `python3 tools/check-copy.py` | pass |
| Runtime smoke | `npm run dev` + curl | `/` and `/present` both 200 |

Node `>=20.9.0`. No API keys needed — the mock engine runs offline.

## 1. What has been done (matches the Plan)

### Milestones from §24

- **M1 Discovery** — existing stack reused (Next 16, Tailwind 4, GSAP
  installed but unused, Lucide, Zod, Vitest, Playwright installed).
  Supplied reference: `assests/characters.jpg` (composite 1280x960 JPEG) +
  `assests/sharedVisual.json` (visual direction).
- **M2 Foundation** — design tokens in `src/app/globals.css` (parchment/ink/
  ocean/track accents, motion keyframes, reduced-motion),
  `src/config/site.ts` (brand, QR URL env, limits), `src/config/characters.ts`
  (5-pirate single source of truth), shared primitives: `PirateButton`,
  `ParchmentPanel`, `NauticalBackground` (+`ExpeditionBrand`), `nautical-art`
  SVGs, `TrackEmblem`, `PiratePlaceholder`, `CharacterArtwork` (real-art-or-
  placeholder with `onError` fallback), `CharacterPortrait`, `CharacterBadge`.
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
- **M5 Character results** — `RevealingScene` (suspense, skippable),
  `ResultScene` (silhouette → portrait entrance, demo banner, explanation
  slot with sample label, secondary affinity only when supplied),
  `ResultCard` (responsive 4:5 export via `html-to-image`, waits for fonts,
  bidi-safe), `ResultActions` (Web Share API → PNG download fallback →
  explanatory error), `CharacterGallery` (five pirates, doubles as preview),
  dev-only `DevTools` preview switcher for all five tracks.
- **M6 Event presentation** — `/present`: title, client-side QR (`qrcode`;
  destination = `NEXT_PUBLIC_SITE_URL` or runtime origin), 3-step
  instructions, five pirate portraits, 16:9-ish composition. No
  leaderboards/tracking (per §26).
- **M7 Polish** — entrance animations + reduced-motion, `dir="auto"`/bidi
  isolation, safe-area insets, ARIA (role=log, aria-live, progressbar,
  dialog), error states (retry + give-up), `global-error.tsx`,
  `not-found.tsx`.
- **M8 Verification** — 22 unit tests across reducer, mock engine, storage,
  provider orchestration (full voyage incl. duplicate-send lock, retry,
  restart, five-result preview), character catalogue; all gates green.

### Deliverables from §27

- `README.md` — concept, commands, env vars, structure, character config,
  mock dialogue, persistence, five-result preview, QR configuration, artwork
  replacement, export behavior, future AI work.
- `docs/AI_INTEGRATION.md` — interface contract, server-engine wiring point
  (`engine/index.ts`), async handling, expected result object, undecided
  items, pre-integration blockers. **No provider, model, or system prompt**
  (per §15).

## 2. What is missing / undone (real gaps, ordered by priority)

1. **Production character artwork (blocks §25 "supplied artwork used")**
   — `public/assets/characters/` contains only a README. The composite
   `assests/characters.jpg` was judged unsliceable into clean transparent
   sprites, so the UI ships designed ink placeholders. TODO: obtain or extract
   isolated transparent PNGs for the 5 tracks, drop them in with the exact
   filenames in `public/assets/characters/README.md`, update `width`/`height`
   in `src/config/characters.ts` if dimensions differ.
2. **E2E / browser visual QA (blocks §23 "End-to-end testing")**
   — `@playwright/test` installed but **no browser binaries and no specs**
   (no `playwright.config.ts`, no `e2e/`). TODO: `npx playwright install
   chromium`, add config + specs for: mobile welcome, chat progression, input
   behavior, reveal, PNG export, restart, `/present` at narrow + desktop
   widths. Then run the §23 visual QA (RTL bugs, keyboard occlusion, overflow,
   contrast) on real viewports. Note: the dev smoke test was curl-only — no
   rendered-page screenshot has ever been taken.
3. **Non-blocking lint warnings (7)** — `react-hooks/set-state-in-effect`
   (WelcomeScene nickname sync, PresentationScreen QR origin/state,
   ExpeditionProvider hydration `setIsHydrated`) and `react-hooks/refs`
   (provider `stateRef.current = state` during render, `engineRef.current` in
   `useMemo`). Deliberate patterns (justified in `eslint.config.mjs`, rules
   downgraded to `warn`). TODO: fix properly (keyed state for nickname,
   mounted-flag for QR) and restore rules to `error`.
4. **GSAP unused** — §10 asks for GSAP on cinematic transitions; dep is
   installed, all animation is CSS keyframes. Decide: wire a GSAP reveal
   timeline (skeleton→portrait→track glow→title) or remove the dependency.
5. **`RevealingScene` hold-after-payload** — suspense should linger ~1s after
   the result arrives so it never flashes; the shell currently cuts straight
   to `ResultScene` when the payload lands. Cosmetic; the entrance animation
   partially compensates.
6. **`ExpeditionFooter` overlap risk** — the fixed bottom "امسح الرحلة" reset
   link may overlay the composer on very small viewports. Visual check needed;
   possibly hide during `conversation` phase.
7. **Turbopack build warning** — "ignored package-lock.json … outside the
   current Git repository" (parent `/home/ahmed` not a repo). Fix with
   `turbopack.root` in `next.config.ts`. Harmless but noisy.
8. **No `.env.example`** — README documents `NEXT_PUBLIC_SITE_URL` /
   `NEXT_PUBLIC_ENABLE_DEV_TOOLS`; add an example file.
9. **Reference folder typo** — `assests/` (sic) left untouched on purpose;
   flag if renaming (update README paths).
10. **No deployment** — Vercel-compatible but never deployed; QR needs a real
    `NEXT_PUBLIC_SITE_URL` before the event (§12: do not invent a URL).


## 3. Plan §25 acceptance checklist — status

- [x] Working independent web app; pirate theme matches visual direction
- [x] All five GDGoC pirate identities (config + reveal + gallery)
- [ ] **Supplied character artwork used** — placeholders only (§2.1)
- [x] Mobile-first; Egyptian-Arabic primary with English terms; free-text
      chat only; no multiple-choice, no team stage, no separate stage B
- [x] Complete mock conversation (7 scenarios → reveal)
- [x] Mock engine clearly separated from future AI (interface + factory)
- [x] No real AI provider/scoring; demo results explicitly labelled
- [x] Restart and resume work (unit-tested)
- [x] Each character has a polished result screen (all five previewable)
- [x] Reveal is animated and skippable
- [x] Result-card export implemented — **untested in a real browser** (§2.2)
- [x] Common mobile sizes covered by CSS — visual QA still pending (§2.2)
- [x] Projector QR screen exists (`/present`)
- [x] Important interactions accessible; error + loading states exist
- [x] TypeScript and production build pass
- [x] Ready for future AI integration without frontend rewrites
      (`docs/AI_INTEGRATION.md`)

## 4. Suggested next tasks (in order)

1. Install Playwright browsers; write the E2E suite and screenshot-based
   visual QA of `/` and `/present` at 360×800 and 1440×900 (§23).
2. Land the 5 transparent character PNGs in `public/assets/characters/` and
   verify the placeholder→real-art swap (Plan §1, §8).
3. Add `.env.example`; set `turbopack.root` in `next.config.ts`.
4. Re-check `ExpeditionFooter` overlap and the reveal-hold polish (§2.5–2.6).
5. Decide on GSAP: wire the reveal timeline or drop the dependency (§10).
6. Clean the 7 lint warnings and restore strict rules (§2.3).
7. Commit with:
   `git -c user.name="GDG-Game Builder" -c user.email="builder@gdgoc.local"`
   (no git identity configured on this machine).
8. Only after the above: deployment + event QR configuration (§12).

## 5. Hard constraints to keep honoring (from the Plan)

- **§15 — no AI**: no provider, no LLM SDK, no system prompt, no keyword
  heuristics, no API keys, no client-side LLM calls. Future AI = implement
  `ConversationEngine` and swap it in `src/features/conversation/engine/index.ts`.
- **§2/§26 — no scope creep**: no accounts, leaderboards, multiplayer,
  island navigation, analytics, WhatsApp portal, databases.
- **§2 — honesty**: demo results must never read as analysed personalities;
  keep `origin: 'demo'` banners and the mock-engine note in the chat header.
- **Arabic-first copy** lives in `src/content/ui.ts` and
  `src/content/dialogue/mockScript.ts` — never hardcode copy in JSX (§22).
  Run `python3 tools/check-copy.py` after editing copy.
- Conventions: feature folders under `src/features`, `@/` path alias,
  `React.JSX.Element` return types, lint-enforced `type` imports, absolute
  paths when referring to files.
- Before claiming done: `npm run typecheck && npm run lint && npm run test &&
  npm run build` must all pass, plus the copy guard.


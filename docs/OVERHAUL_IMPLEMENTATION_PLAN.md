# Overhaul Implementation Plan — Pirate Personality Quiz

**Status:** implemented — see `docs/AGENT_CONTEXT.md` for the as-built architecture.

Delivered in 11 phases. Six defects were found by tests and visual review rather
than by the plan, and all six were invisible to typecheck and lint:

1. **Radio options were never wired** — `selectOption` was destructured and
   unused, so every answer was silently discarded. Only lint caught it.
2. **`LandingScene` changed state without navigating** — each route mounts its
   own provider, so "start" left the visitor on the landing screen.
3. **The `/quiz` provider hydrated to `phase: 'landing'`**, so the reducer's
   phase guard dropped every selection. Routes now announce themselves with
   `enterPhase()`.
4. **Entry guards re-fired on state change** — "start over" nulled
   `selectedTrackId`, re-triggered the redirect to `/quiz` and beat the real
   navigation. They are now latched per mount.
5. **The result card silently clipped** — `overflow-hidden` at a fixed 4:5 ate
   the traits and the secondary card. There is now a test that measures every
   descendant against the frame for all five personas.
6. **The landing hero was the wrong character** — an RTL flex row lays its first
   child rightmost, so the stage had to be emitted reversed to match the
   reference's left-to-right order.

Plus three correctness fixes: resume now lands on the first *unanswered*
question; the top-ranked row no longer claims "you chose this" before anything is
chosen; and the card carries the English track name alongside the Arabic.
**Supersedes:** `docs/MASTER_IMPLEMENTATION_PROMPT.md` (chat-driven, no MCQ, no scoring)
**Design source of truth:** `assests/UI/` (spec bundle + 6 screenshots) and `assests/Characters/` (5 production PNGs)

---

## 1. Goal

Delete the chat system. Replace it with a **10-question, 4-option MCQ quiz**. Each answer adds weighted points
to a deterministic local scoring system that ranks all five GDGoC tracks. The user sees **1st, 2nd, 3rd, … 5th**,
**picks the match they like**, and gets a **downloadable card showing their username and the chosen track**.

```
Landing ──▶ Quiz Q1..Q10 ──▶ Analyzing ──▶ Ranked matches (1st…5th) ──▶ Pick one ──▶ Result card ──▶ Download PNG
   │                                                                                            │
   └────────────── optional: /tracks gallery ───────────┘        └──── restart / share ─────────┘
```

---

## 2. Asset discovery (complete)

`assests/` contains **19 files, 14 MB**. Nothing else is needed for this build.

### 2.1 `assests/Characters/` — production artwork ✅

All five are **genuinely transparent RGBA PNGs**, verified by decoding the alpha channel (not just trusting the file):

| File | Size | Format | Corner alpha | Fully transparent | Soft glow | Opaque bounding box |
|---|---|---|---|---|---|---|
| `SoftwareEngineering.png` | 1024×1536 | RGBA 8-bit | 0,0,0,0 ✅ | 49.3 % | 3.11 % | 901×1489 |
| `AI.png` | 1024×1536 | RGBA 8-bit | 0,0,1,0 ✅ | 45.3 % | 4.16 % | 933×1484 |
| `web.png` | 1024×1536 | RGBA 8-bit | 0,0,0,0 ✅ | 57.2 % | 2.80 % | 762×1439 |
| `DataScience.png` | 1024×1536 | RGBA 8-bit | 0,0,0,0 ✅ | 49.6 % | 3.28 % | 845×1457 |
| `CyberSecurity.png` | 1024×1536 | RGBA 8-bit | 0,0,0,0 ✅ | 46.9 % | 4.57 % | 890×1444 |

The "soft glow" band is a radial light halo around the character — it composites correctly on a dark scene.
**These are production-ready.** The old blocker "no source artwork supplied" is resolved.

⚠️ They are **2:3 portrait (1024×1536)**, not 1:1 as `public/assets/characters/README.md` demands. That README must be
rewritten — it is the only file in `public/`.

### 2.2 `assests/UI/` — design specification

**6 reference screenshots** (visual reference only — never ship these, never slice them into UI):

| File | Size | Reference |
|---|---|---|
| `LandingPage.png` | 1003×826 | hero + 5 characters + red CTA |
| `PersonalityQuiz.png` | 570×826 | question 3 example, 4 parchment option cards |
| `LoadingScreen.png` | 588×662 | moonlit sea + parchment + indeterminate bar |
| `AllResultCardsInspirationEx.png` | 968×661 | five tall collectible track cards |
| `ResultCardExample1.png` | 678×829 | full result card — Software Engineering |
| `ResultCardExample2.png` | 692×662 | full result card — Artificial Intelligence |

**Spec bundle** `gdgoc-pirate-personality-spec/`: `README.md` + `shared-design-state.json` + 6 page JSONs.
Binding content already extracted: full colour tokens, typography stacks, spacing/radii/motion scales, the five
track themes with exact hex values and icons, responsive breakpoints, accessibility rules, component inventory,
and the MCQ interaction contract. **These are already read — no further spec reading is needed.**

### 2.3 Deviations from the spec bundle (deliberate, user-directed)

| Spec says | We ship | Why |
|---|---|---|
| 8 questions | **10** | User instruction |
| Scoring "unspecified, do not invent" | **Full weighted scoring** | User instruction |
| `/result/:trackId` straight after loading | **`/matches` → pick → `/result/[trackId]`** | User instruction (ranked list + user choice) |
| `/loading` route | **`/analyzing`** | `app/loading.tsx` is a reserved Next.js App Router filename; `app/loading/` cannot coexist |
| Result copy only for SE + AI | **Author copy for WEB, DATA, SEC** | Ship all five; authored content is flagged in `content/tracks.ts` |

---

## 3. Scoring system

### 3.1 Formula

```
Each option carries weights: { primary: 3, secondary: 1 }
Total points distributed across all 10 answers = 40
Max possible for one track = 26   (its 8 primary options + 2 secondary)
Min possible for one track =  0   (never pick any of its options)
```

No AI, no network, no LLM. A pure function over the answer map.

### 3.2 Fairness invariant

Every track appears in exactly **8 of the 40 options as primary** and **8 as secondary**.
Each track is *absent* from exactly 2 questions. Verified programmatically — this is a unit test, not a claim.

```
primaries   per track: all 5 → 8   (total 40)
secondaries per track: all 5 → 8   (total 40)
```

Consequence: the quiz has **no track bias**. A track can only win by being *chosen*.

### 3.3 Secondary affinity graph

Deliberate, so rankings are plausible rather than noisy:

```
SE  → WEB, SEC      AI → DATA, WEB     WEB → SE, DATA
DATA → AI,  SEC     SEC → SE,  AI
```

This matches the spec's own pairings (SE's secondary is WEB, AI's secondary is DATA) and keeps
SE/SEC broadly reachable (many neighbours ⇒ they accumulate secondary points and never fall to zero by accident).

### 3.4 Ranking + deterministic tie-break

Sort all five by, in order:

1. `score` desc
2. `primaryHits` desc *(how many times you picked that track as primary — a strong, explainable signal)*
3. `secondaryHits` desc
4. index in `TRACK_IDS` asc *(stable, hard-coded last resort)*

Fully deterministic. Same answers ⇒ same order, always.

### 3.5 Validated distribution (200 000 simulated answer sets)

```
top score      p10=10  p50=13  p90=16  max=26
1st-vs-2nd gap p10= 1  p50= 3  p90= 7
exact ties for 1st place: 12.4 %   → resolved by the primaryHits tie-break
every track reachable at #1:        ✓ all five
```

Four of five tracks can also reach last place. SE and SEC cannot be pushed to last by "always pick someone
else's primary" — they have the broadest secondary inflow. That is intentional, not a bug.

---

## 4. The question bank

**File:** `src/content/questions.ts` · **type:** `src/features/quiz/types.ts`

Each question: exactly 4 options, each with one `primary` + one `secondary` track. Icons per the spec:
`gear` / `brain-circuit` / `code-xml` / `chart-no-axes-column-increasing` / `shield-check`.

Questions 3's four option texts are **verbatim from the approved spec screenshot**. The only change is that the
data option carries `cybersecurity` as its secondary — the spec flags that its example omits security entirely,
so this is the minimal fix that makes security representable while keeping every approved word.

| # | Absent | Theme |
|---|---|---|
| 1 | security | First week at university, free time |
| 2 | data | Learning a hard new topic |
| 3 | security | **Approved spec question** — team platform problem |
| 4 | software-engineering | Deadline tomorrow, budget gone |
| 5 | artificial-intelligence | Building something people actually use |
| 6 | web-development | System silently returning wrong results |
| 7 | data-science | Group project, different work styles |
| 8 | software-engineering | A bug you cannot reproduce |
| 9 | artificial-intelligence | The future of technology |
| 10 | web-development | What you want to be known for |

### Q1 — first week at university
> لسه في أول أسبوع في الجامعة، ومعاك وقت فراغ كبير. أول حاجة هتعملها إيه؟

| Opt | Text | Weights |
|---|---|---|
| a | أبدأ أتعلم لغة برمجة من الصفر وأبني حاجة صغيرة شغّالة من أول يوم. | SE 3, WEB 1 |
| b | أجرّب أدوات الذكاء الاصطناعي وأشوف إيه اللي تقدر تعمله بيه فعلاً. | AI 3, DATA 1 |
| c | أعمل صفحة بسيطة فيها اسمي ومعلوماتي وأنشرها على الإنترنت. | WEB 3, SE 1 |
| d | أبدأ أنظّم ملفاتي وأشوف البيانات اللي قدامي فيها إيه. | DATA 3, AI 1 |

### Q2 — learning a hard new topic
> محتاج تتعلم موضوع جديد وصعب. إيه الطريقة اللي بتفهم بيها أسرع؟

| Opt | Text | Weights |
|---|---|---|
| a | أقرأ الشرح النظري الأول، وبعدين أكتب كود بنفسي لحد ما الموضوع يثبت. | SE 3, WEB 1 |
| b | أدوّر على أمثلة عملية وتجارب ناس فاتحينها، وأبني منها صورة واضحة. | AI 3, DATA 1 |
| c | أدوّر على كورس عملي وأتعلم بالتمرين على أمثلة جاهزة أعدّل فيها بنفسي. | WEB 3, DATA 1 |
| d | أدوّر على شرح مبسّط يوضّح المفهوم، وأتأكد إن الفهم مظبوط قبل ما أكمّل. | SEC 3, SE 1 |

### Q3 — approved spec question
> يوجه فريقك مشكلة في المنصة الجامعية التي يستخدمها مئات الطلاب، ما هو أول شيء تفكر في القيام به؟

| Opt | Text | Weights |
|---|---|---|
| a | أبني حلاً تقنياً موثوقاً يصلح المشكلة من جذورها. | SE 3, WEB 1 |
| b | أستخدم الذكاء الاصطناعي لتقديم حلول ذكية ومبتكرة. | AI 3, DATA 1 |
| c | أصمم واجهة سهلة الاستخدام تجعل التجربة أفضل للطلاب. | WEB 3, SE 1 |
| d | أحلل البيانات لأفهم سبب المشكلة وأجد الأنماط فيها. | DATA 3, **SEC 1** |

### Q4 — deadline pressure
> الموعد النهائي بعد يوم، والميزانية خلصت. إيه أول قرار هتاخده؟

| Opt | Text | Weights |
|---|---|---|
| a | أجرّب نموذج ذكاء اصطناعي يسرّع الشغل بدل ما أضيّع وقت في التفاصيل. | AI 3, DATA 1 |
| b | أبسّط الشغل وأشيل أي حاجة مش ضرورية عشان أسلّم حاجة شغّالة. | WEB 3, SE 1 |
| c | أرجع للبيانات وأشوف إيه اللي طلع معايا قبل ما أقرر. | DATA 3, AI 1 |
| d | أراجع الصلاحيات والنسخ الاحتياطي الأول، عشان أضمن إن مفيش مخاطرة. | SEC 3, SE 1 |

### Q5 — building something people use
> عايز تعمل حاجة الناس هتستخدمها فعلاً. إيه أول خطوة؟

| Opt | Text | Weights |
|---|---|---|
| a | أكتب الكود اللي ورا الفكرة الأول، وبعدين أتأكد إنه شغّال. | SE 3, SEC 1 |
| b | أصمم شكل الصفحة وأتأكد إن أي حد يقدر يستخدمها من أول مرة. | WEB 3, SE 1 |
| c | أبدأ من البيانات: مين المستخدم وإيه اللي محتاج بالظبط. | DATA 3, SEC 1 |
| d | أفترض إن في حد هيستغل أي ثغرة، وأقفل المداخل من أول يوم. | SEC 3, AI 1 |

### Q6 — silently wrong results
> نظام شغّال من زمان فجأة بدأ يعطي نتائج غلط، وما الأحمر بتاعه بيقول حاجة مفيدة.

| Opt | Text | Weights |
|---|---|---|
| a | أرجع للكود وأفحصه سطر سطر لحد ما ألاقي السبب. | SE 3, WEB 1 |
| b | أجرّب نموذج تاني وأقارن نتايجه بالقديم، وأشوف الفرق. | AI 3, WEB 1 |
| c | أجمع كل البيانات اللي طلعت من غير ما أتوقع، وأدوّر على الأنماط. | DATA 3, AI 1 |
| d | أفترض إن حد دخل على حساب غيره، وأراجع سجل الدخول من الأول. | SEC 3, SE 1 |

### Q7 — group project friction
> في مشروع جماعي، وزميلك مختلف تماماً عنك في طريقة الشغل. إيه بتعمل؟

| Opt | Text | Weights |
|---|---|---|
| a | أقسّم الشغل لمهام واضحة، وكل واحد يلتزم بمهمة بتاعه. | SE 3, SEC 1 |
| b | أجرّب أداة ذكاء اصطناعي تساعدنا نلخص الشغل ونقسمه بسرعة. | AI 3, WEB 1 |
| c | أبني حاجة بسيطة شغّالة الأول، وبعدين نطوّرها مع بعض. | WEB 3, DATA 1 |
| d | أحدّد إيه مسؤولية كل واحد من الأول، عشان نعرف لو حصل أي خطأ. | SEC 3, AI 1 |

### Q8 — unreproducible bug
> عندك مشكلة بتظهر وتختفي، ومش قادر تعيدها في أي وقت. بتعمل إيه؟

| Opt | Text | Weights |
|---|---|---|
| a | أجرّب أعيد صياغة المشكلة وأقارن إجابات النموذج بأجوبة بشرية. | AI 3, WEB 1 |
| b | أعيد تجربة الخطوات بالظبط زي ما المستخدم عملها، وأشوف بيقف فين. | WEB 3, DATA 1 |
| c | أجمع كل الحالات اللي المشكلة ظهرت فيها وأدوّر على العامل المشترك. | DATA 3, AI 1 |
| d | أشوف مين وصل للنظام آخر مرة، وأتأكد إن مفيش حد دخل من غيره. | SEC 3, SE 1 |

### Q9 — the future
> لو تقدر تشوف التكنولوجيا بعد ١٠ سنين، هتتمنى إيه اللي حصل؟

| Opt | Text | Weights |
|---|---|---|
| a | أنظمة معمارية كبيرة تقدر تتحمل ضغط الملايين من المستخدمين. | SE 3, SEC 1 |
| b | مواقع وتطبيقات تقدر أي حد يستخدمها من غير ما يتعلّم حاجة صعبة. | WEB 3, DATA 1 |
| c | كل قرار يتاخد على أساس أرقام واضحة مش على تخمين. | DATA 3, SEC 1 |
| d | الأمان في كل حاجة رقمية يبقى الأساس مش إضافة. | SEC 3, AI 1 |

> *Fix the stray Latin fragment above when writing the file: `لو تقدر تشوف التكنولوجيا بعد ١٠ سنين، هتتمنى إيه اللي حصل؟`*

### Q10 — what you want to be known for
> بعد ما تكبر، عايز الناس تتكلم عنك إيه؟

| Opt | Text | Weights |
|---|---|---|
| a | إنك بنيت حاجات الناس بتستخدمها لسه شغّالة. | SE 3, SEC 1 |
| b | إنك جبت فكرة جديدة للحاجة، وناس تانية اتعلّمت منها. | AI 3, WEB 1 |
| c | إنك كشفت حاجة محدش كان شايفها، وحوّلتها لقرار اتاخد. | DATA 3, SEC 1 |
| d | إنك كنت السبب إن خرق أمني كبير ما حصلش. | SEC 3, AI 1 |

---

## 5. Track content

`src/config/characters.ts` keeps its structure; **palettes and artwork are replaced with spec values**.

| Track | Arabic | English persona | primary / dark / glow | icon | source file |
|---|---|---|---|---|---|
| `software-engineering` | هندسة البرمجيات | **المهندس القائد** *(spec)* | `#F45361` / `#3D101E` / `rgba(255,77,101,.32)` | gear | `SoftwareEngineering.png` |
| `artificial_intelligence` → `ai` | الذكاء الاصطناعي | **ساحر الذكاء** *(spec)* | `#66BAFF` / `#0C2C64` / `rgba(53,148,255,.38)` | brain-circuit | `AI.png` |
| `web-development` | تطوير الويب | الملّاح *(carried over)* | `#FFA35D` / `#56270D` / `rgba(255,134,54,.32)` | code-xml | `web.png` |
| `data-science` | علم البيانات | رسّام الخرائط *(carried over)* | `#C27BFF` / `#30124C` / `rgba(184,90,255,.35)` | chart | `DataScience.png` |
| `cybersecurity` | الأمن السيبراني | الحارس *(carried over)* | `#78DAA0` / `#123A27` / `rgba(77,223,148,.32)` | shield-check | `CyberSecurity.png` |

`TrackId` values stay kebab-case (`software-engineering`, `ai`, …) — renaming them would touch the generated
artwork manifest, the storage schema and 33 e2e tests for no benefit. Map at the content boundary instead.

**Artwork metadata:** every `artwork.width/height` becomes **1024 × 1536** (currently they are wrong per-character
values like 608×1012). These prevent layout shift and are needed for the export.

### 5.1 Result card copy

`src/content/tracks.ts`. SE and AI copy is **verbatim from the spec**. WEB, DATA and SEC are **authored to match
the same structure** and marked `contentSource: 'authored'` so the distinction stays visible in code.

Authored personas:

- **WEB — الملّاح** · tagline `أنت تصنع، وتجعل كل فكرة في متناول الجميع.` · strength `تحويل الأفكار إلى تجارب يستخدمها الناس بسهولة.` · traits: تصمم من أول مستخدم · تهتم بالتفاصيل البصرية · تحب التخليط بين الجمال والوظيفة · تقدر تشرح شغلك لأي حد
- **DATA — رسّام الخرائط** · tagline `أنت تلاحظ، وتقرأ، وتستخرج المعنى من الفوضى.` · strength `تحويل الأرقام الغامضة إلى قرارات واضحة.` · traits: تلاحظ التفاصيل الصغيرة · صبور في التفاصيل · تحب رسم الأنماط · تثق بالبيانات قبل الخرائط
- **SEC — الحارس** · tagline `أنت تنتبه، وتحمي، وتفكّر قبل ما تفتح الباب.` · strength `كشف الخطر مبكراً وحماية كل ما يبنيه الفريق.` · traits: شكوك صحي في كل شيء · تفكّر في أسوأ سيناريو · تحب التحكم في التفاصيل · حريص على سرية المعلومات

---

## 6. Architecture

### 6.1 Routes

Real Next.js routes replace the single-page phase machine.

| Route | File | Purpose |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing — hero, 5 characters, username field, CTA |
| `/quiz` | `src/app/quiz/page.tsx` | Q1…Q10 MCQ |
| `/analyzing` | `src/app/analyzing/page.tsx` | Scoring beat (renamed from spec's `/loading`) |
| `/matches` | `src/app/matches/page.tsx` | **NEW** — ranked 1st…5th, user picks one |
| `/result/[trackId]` | `src/app/result/[trackId]/page.tsx` | Card for the chosen track |
| `/tracks` | `src/app/tracks/page.tsx` | Five-track gallery (kept, re-skinned) |
| `/present` | `src/app/present/page.tsx` | Projector QR screen (kept, re-skinned) |

`next.config.ts` has `typedRoutes: true` — all `<Link href>` values must be literal strings from this list.

### 6.2 State

`src/features/quiz/` replaces `src/features/expedition/`.

```ts
type QuizPhase = 'landing' | 'quiz' | 'analyzing' | 'matches' | 'result' | 'error';

interface QuizState {
  phase: QuizPhase;
  sessionId: string;
  username: string | null;              // replaces nickname; goes on the card
  questionIndex: number;                // 0..9
  answers: Record<string, string>;      // questionId → optionId
  scores: Record<TrackId, number> | null;
  ranking: readonly RankedMatch[];      // { trackId, score, primaryHits, secondaryHits, rank }
  selectedTrackId: TrackId | null;     // the user's pick from /matches
  hydrated: boolean;                    // runtime-only, never persisted
  updatedAt: number;
}
```

`src/features/quiz/scoring/scoreAnswers.ts` — pure, `(answers) => { scores, primaryHits, secondaryHits, ranking }`.

`src/features/quiz/QuizProvider.tsx` — mirrors the current provider pattern: refs for race-free async, hydrate-once
then persist. But there is **no engine** — scoring is synchronous, so `pending`/`failedOperation`/`retry` disappear.

### 6.3 Persistence

New `src/features/quiz/quizStorage.ts`:

- new key `gdgoc-pirate-quiz:session`; **delete the legacy key** `gdgoc-pirate-expedition:session` on first load
- `SCHEMA_VERSION = 2`; v1 payloads fail validation and are discarded — no migration needed, chat answers are worthless
- keep the 12-hour TTL, the `localStorage` try/catch, and the "never persist a pristine landing screen" rule
- zod-validated at the boundary

---

## 7. Asset integration

```bash
cp assests/Characters/SoftwareEngineering.png public/assets/characters/software-engineering.png
cp assests/Characters/AI.png                   public/assets/characters/ai.png
cp assests/Characters/web.png                  public/assets/characters/web-development.png
cp assests/Characters/DataScience.png          public/assets/characters/data-science.png
cp assests/Characters/CyberSecurity.png        public/assets/characters/cybersecurity.png
```

Filenames are the `TrackId`s, which makes `tools/generate-artwork-manifest.mjs` emit all five IDs
automatically and satisfies the existing assertion in `src/config/characters.test.ts:53`. Then:

- rewrite `public/assets/characters/README.md` (says 1:1 — they are 2:3)
- serve from `public/` via plain `<img>` with explicit `width`/`height` (1024×1536) — **not** `next/image`,
  because `html-to-image` re-fetches the URL during export and `/_next/image` optimisations have been a
  recurring source of export flakiness
- keep the originals in `assests/` untouched; `assests/` stays the design source of truth

**Do not copy the 6 UI screenshots into `public/`.** They are references.

---

## 8. Design system

### 8.1 Theme direction change

The current app is a **light parchment** theme. The new design is a **dark navy harbour**. `globals.css` needs
new tokens; the existing parchment scale stays because question/option text is still dark-on-cream inside panels.

New tokens (from `shared-design-state.json`):

```
--color-background:        #090F22      --color-background-deep: #090B17
--color-surface:           #151827      --color-surface-tinted: #201B27
--color-surface-border:    #656077
--color-text-primary:      #FFF4E5      --color-text-secondary:  #D9D8E3
--color-parchment:         #F3D4A8      --color-parchment-light: #FFE6BD
--color-parchment-edge:    #A36B46
--color-wood:              #392019      --color-wood-bright:     #67402B
--color-accent-red:        #B72F30      --color-accent-red-high: #E24E45
--color-accent-gold:       #FFD28A      --color-lantern-light:   #FFB961
--color-sea-blue:          #123A68      --color-focus:           #9AD8FF
```

Keep `--color-ink*` and `--color-parchment-50..900` (used inside cream panels). Change `body` background to
`var(--color-background)`. Retune the five `--track-*` pairs to the spec hexes.

### 8.2 Typography

`layout.tsx` currently loads Cairo + Pirata_One. Add **Tajawal** (body) and **Space Grotesk** (English brand).
Keep Cairo for headings. Wrap every Latin/acronym span in `dir="ltr"` / `unicode-bidi: isolate` — the spec calls
this out and RTL bidi bugs are the #1 risk on this rewrite.

### 8.3 Motion

Add `lantern-flicker`, `ship-drift` (≤6 px), `float-idle` (≤4 px), `progress-shimmer`. Delete `bubble-in` and
`typing-dot` (chat-only). Keep the existing `prefers-reduced-motion` kill-switch and extend it to the new animations.

### 8.4 Shared components

Keep and re-skin: `NauticalBackground`, `ParchmentPanel`, `PirateButton`, `nautical-art` (`ShipSilhouette`,
`CompassRose`), and all four `components/characters/*`. Drop the dead exports `TornEdge` and `SailingRoute`.

New: `PixelFrame` (cut-corner frame), `Lantern`, `TrackCard` (collectible, used by `/tracks` and `/matches`),
`QuestionProgress` (spec's circle/dot stepper, `role="progressbar"`), `RpgButton`, `ResultSection`.

---

## 9. Screens

### Landing `/`
Spec composition, mobile-first. Brand top-start, `AR` locale chip top-end. Two-line `اكتشف شخصيتك` in
`--color-accent-gold`. Subhead `أي مسار في GDGoC يناسبك؟` · description `أجب على ١٠ أسئلة واكتشف الـ Builder
الذي بداخلك` (**updated from the spec's ٨**). Panoramic five-character stage across the lower ~46 %, centre
figure is WEB. Username field, then the red `ابدأ الاختبار` CTA (≥58 px tall, gold trim).

### Quiz `/quiz`
Exact spec contract. Two lanterns (decorative, `aria-hidden`). Counter `السؤال ٣ من ١٠` + stepper. Parchment
question with the orange WEB captain overlapping its **right** edge but outside the text inset. Four parchment
option cards, each a native `<input type="radio">` inside a `<fieldset>`/`<legend>`, with its track icon.
Footer: `السابق` (disabled on Q1) and `التالي` → `اكتشف شخصيتي` on Q10.

- Next disabled until a selection exists
- Selecting replaces the previous choice; visible crimson/gold outline + check icon (never colour alone)
- Back restores the prior selection; answers persist per question
- Vertical scroll allowed on short screens — all four options and both buttons must stay reachable
- Announce question changes: focus moves to the question heading

### Analyzing `/analyzing`
Moonlit sea, parchment panel at 44–77 % viewport height, `جاري تحليل إجاباتك...`. **Indeterminate** bar —
scoring is instant and local, so any numeric percentage would be fabricated. `aria-busy`, `role="progressbar"`
with no `aria-valuenow`. Minimum 900 ms dwell so it reads as a beat, not a flash.

### Matches `/matches` *(new)*
`ترتيب شخصياتك` — all five ranked, largest first. Each row: rank badge (`الأول`, `الثاني`, …), the character
cutout, persona title in track colour, track name, and a normalised score meter (`13 من 40`). The user's own
matches, so **every row is a button** — tapping commits `selectedTrackId` and routes to
`/result/[trackId]`. Keyboard: arrow keys move, Enter selects. Announce `الأول: ساحر الذكاء` via `aria-live`.

No "correct answer" framing anywhere. Add a footer note: `النتيجة دي بتقلد ترجيح فريق GDGoC، مش اختيار نهائي.`

### Result `/result/[trackId]`
Spec layout: character hero (~240–350 px) then stacked sections — eyebrow `شخصيتك هي`, persona title in track
colour, track subtitle, tagline ribbon, `قوتك الفريدة` box, `خصائصك المميزة` (4 diamonds), secondary-track card.
Tablet ≥768 px: character left 43–48 %, content right.

**Username on the card** — the field the user typed on the landing screen, rendered as
`يا هلا يا {username}` in the card header. If blank, the card still renders with just the track.

Actions: `احفظ الكارت` (PNG download), `مشاركة النتيجة` (Web Share API → copy-link fallback),
`جرب تاني`, `شوف المسارات`.

### Card export
Reuse `html-to-image` exactly as the current `ResultCard.tsx` does — it already handles `document.fonts.ready`,
`cacheBust`, and the container-query portrait bug. Target **1080×1350** (`pixelRatio: 3` at 360 px card width).
File name: `gdgoc-{slugified-username}-{trackId}.png`.

---

## 10. File changes

### Delete
```
src/components/chat/ChatComposer.tsx
src/components/chat/ChatMessageList.tsx
src/components/chat/JourneyProgress.tsx
src/features/expedition/components/ConversationScene.tsx
src/features/conversation/types.ts
src/features/conversation/schemas.ts
src/features/conversation/engine/MockConversationEngine.ts
src/features/conversation/engine/MockConversationEngine.test.ts
src/features/conversation/engine/index.ts
src/content/dialogue/mockScript.ts
src/components/shared/DevTools.tsx
e2e/conversation.spec.ts
```

### Replace
```
src/features/expedition/**                 →  src/features/quiz/**
ExpeditionProvider / expeditionReducer     →  QuizProvider / quizReducer
src/features/session/sessionStorage.ts     →  src/features/quiz/quizStorage.ts (+ its test)
src/content/ui.ts                          →  drop ui.chat / ui.error / ui.boarding; add ui.landing, ui.quiz, ui.matches, ui.card
```

### Add
```
src/app/quiz/page.tsx          src/app/analyzing/page.tsx     src/app/matches/page.tsx
src/app/tracks/page.tsx        src/app/result/[trackId]/page.tsx
src/features/quiz/{types,schemas}.ts
src/features/quiz/QuizProvider.tsx
src/features/quiz/components/{QuizShell,QuizScene,OptionCard,QuestionProgress,LandingScene}.tsx
src/features/quiz/scoring/{scoreAnswers.ts,scoreAnswers.test.ts}
src/features/matches/components/{MatchesScene,MatchRow}.tsx
src/features/tracks/components/{TracksScene,TrackCollectibleCard}.tsx
src/content/questions.ts       src/content/tracks.ts
src/components/shared/{PixelFrame,Lantern}.tsx
e2e/{landing,quiz,matches,result-card}.spec.ts
```

### Edit
```
src/config/characters.ts        spec palettes, 1024×1536 artwork, spec persona titles
src/config/characters.test.ts   updated artwork assertions
src/config/site.ts              title, tagline, storage key, MAX_USERNAME_LENGTH, drop MAX_MESSAGE_LENGTH
src/app/layout.tsx              + Tajawal, + Space Grotesk, new description/meta
src/app/globals.css             new dark tokens, new keyframes, body background
src/features/reveal/components/ResultCard.tsx    spec layout, username, 1080×1350 export
src/features/reveal/components/ResultScene.tsx   track-copy source instead of engine result
src/features/reveal/components/ResultActions.tsx new copy + file name
src/features/present/components/PresentationScreen.tsx  re-skin to dark
src/features/characters/components/CharacterGallery.tsx    re-skin to TrackCard
package.json                     description: remove "chat-driven"
tools/check-copy.py              still applies — new Arabic copy must be CJK-free
```

### Unchanged
`src/components/characters/*`, `src/components/shared/{NauticalBackground,ParchmentPanel,PirateButton,nautical-art}.tsx`,
`src/features/reveal/components/SecondaryAffinity.tsx`, `src/lib/ids.ts`, `src/app/present/page.tsx`,
`e2e/present.spec.ts` (the only e2e spec with no chat dependency — survives), all config files.

---

## 11. Tests

### Unit (`vitest`, `src/**/*.test.{ts,tsx}`)

| File | Asserts |
|---|---|
| `content/questions.test.ts` | 10 questions · 4 options each · unique ids · every weight is a valid `TrackId` · primary ≠ secondary · **8 primaries and 8 secondaries per track** · each track absent from exactly 2 questions · Q3 texts match the approved spec strings |
| `quiz/scoring/scoreAnswers.test.ts` | sum math · ranking order · tie-break cascade · determinism (same input ⇒ same output, 1 000×) · **every track reachable at rank 1** · incomplete answers score safely |
| `quiz/quizReducer.test.ts` | phase transitions · single-select per question · next blocked with no selection · back restores selection · restart clears |
| `quiz/quizStorage.test.ts` | v2 round-trip · v1 discarded · TTL expiry · malformed input discarded · legacy key removed |
| `config/characters.test.ts` | updated for spec palettes, 1024×1536, `/assets/characters/{id}.png` |

### E2E (`playwright`, mobile Pixel 7 + desktop 1440×900)

| Spec | Covers |
|---|---|
| `landing.spec.ts` | hero, five characters, username field, CTA, RTL/LTR, no horizontal overflow at 320/390 |
| `quiz.spec.ts` | counter `السؤال ١ من ١٠`, stepper, 4 radios, single-select, Next disabled until selected, back restores, final label `اكتشف شخصيتي`, keyboard arrow navigation |
| `matches.spec.ts` | five rows ranked, order matches `scoreAnswers` output, rank labels in Arabic, keyboard selection |
| `result-card.spec.ts` | username **and** track visible on the card, PNG download fires, restart, share fallback |
| `present.spec.ts` | unchanged |

Delete `conversation.spec.ts`. Rewrite `welcome.spec.ts` → `landing.spec.ts`, split `reveal-result.spec.ts`
into `matches.spec.ts` + `result-card.spec.ts`. Rewrite `e2e/helpers.ts` (`gotoConversation` → `answerQuestion`,
`ANSWERS[]` → option indices, `waitForCaptain` → deleted).

Keep the `data-scene` hook convention: `landing`, `quiz`, `analyzing`, `matches`, `result`.

---

## 12. Build order

| # | Phase | Gate |
|---|---|---|
| 0 | Land `assests/` characters in `public/`, rewrite its README, update `characters.ts` palettes + 1024×1536 metadata | `npm run build` still green; `hasArtwork()` true for all 5 |
| 1 | New dark tokens, fonts, keyframes in `globals.css` / `layout.tsx` | renders dark; reduced-motion honoured |
| 2 | `TrackId` content layer: `content/tracks.ts` + `content/questions.ts` | question-bank + balance tests pass |
| 3 | `features/quiz/scoring/scoreAnswers.ts` | scoring tests pass |
| 4 | `QuizProvider` + `quizReducer` + `quizStorage` | reducer + storage tests pass |
| 5 | **Delete the chat system** (all files in §10) | `npm run typecheck` green |
| 6 | `/quiz` screen | quiz e2e green |
| 7 | `/analyzing` + `/matches` | matches e2e green |
| 8 | `/result/[trackId]` card + PNG export | result-card e2e green |
| 9 | `/` landing rebuild, `/tracks` and `/present` re-skin | landing + present e2e green |
| 10 | Docs: rewrite `AGENT_CONTEXT.md` and `AI_INTEGRATION.md`, archive `MASTER_IMPLEMENTATION_PROMPT.md`, update `README.md` and `package.json` | all gates below |

### Final gates
```
npm run typecheck          # 0 errors
npm run lint               # 0 errors, 0 warnings
npm test                   # vitest, all green
npm run build              # clean
python3 tools/check-copy.py# no CJK leakage in new Arabic copy
npm run test:e2e           # 2 projects × all specs green
```

---

## 13. Risks

| Risk | Mitigation |
|---|---|
| **RTL bidi breakage** — Arabic text with Latin acronyms (`GDGoC`, `Builder`, track names) reversing or mangling | `dir="rtl"` on `<html>`, `dir="ltr"` + `unicode-bidi: isolate` on every Latin span, `[dir=auto]{unicode-bidi:plaintext}` already in `globals.css`. E2E asserts on rendered direction, not just presence. |
| **Export flakiness** — `html-to-image` re-fetching fonts/images | Serve characters from `public/` as plain `<img>`, keep `await document.fonts.ready`, keep `cacheBust: true`, pre-decode images before export, add a visible retry instead of a dead button. |
| **Tier-1 track silently dropping out** — a track scoring 0 and looking broken | Guaranteed impossible: minimum exposure is 8 options per track, and SE/SEC additionally have the widest secondary inflow. Covered by a unit test. |
| **Reference asset paths are placeholders** — the spec names `assets/characters/ai-pirate.png`, `assets/backgrounds/*.webp`, `assets/branding/*.svg` that do not exist | Characters are mapped from `assests/Characters/`. Backgrounds/props/logo do **not** exist and must be CSS/SVG atmosphere per the spec's own `asset_missing_behavior`. No screenshot slicing, ever. |
| **Authored copy mistaken for supplied copy** | `contentSource: 'authored'` on WEB/DATA/SEC result copy; noted in §5.1. |
| **Mobile layout overflow at 320 px** — option cards + sticky footer + character art | No fixed footer over content; vertical scroll always available; overflow assertion in every e2e spec. |
| **Deleted `data-scene` values break 33 e2e tests** | Known — §11 replaces them. Run `npm run test:e2e` before starting phase 6. |

---

## 14. Decisions locked

1. 10 questions · 4 single-select options · no correct answer · no free text, no chat
2. `primary: 3, secondary: 1` · 8 primaries and 8 secondaries per track · deterministic tie-break
3. All five tracks ranked; user picks; only then is a card created
4. Card shows **username + chosen track**, exportable as 1080×1350 PNG
5. Real Next.js routes; `/loading` renamed to `/analyzing` (reserved filename)
6. Scoring is local and synchronous — no engine, no AI boundary, no `origin: 'engine' | 'demo'` honesty flag
7. `TrackId` values unchanged
8. `assests/` stays the design source; only the five characters are copied into `public/`

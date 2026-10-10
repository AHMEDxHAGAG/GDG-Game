# MASTER IMPLEMENTATION PROMPT

## GDGoC AASTMT Aswan — The Pirate Identity Expedition

### Your Role

You are a senior full-stack engineer, creative frontend developer, UI/UX designer, game experience designer, and technical architect.

Your responsibility is to **design, architect, implement, test, and polish a complete, production-quality, mobile-first web experience** for a Google Developer Groups on Campus orientation event at AASTMT Aswan.

You should work autonomously, inspect the repository and its existing assets, make sensible engineering decisions, and implement working features—not merely produce a plan or static mockup.

The product is an immersive, pirate-themed, conversational personality adventure where visitors discover which of five technical-track pirate characters best represents their interests and thinking style.

**Critical boundary: the real AI conversation and personality inference are deliberately out of scope for this implementation.**

Build everything surrounding AI, including the conversation UI, state management, future integration contracts, animated result reveal, session persistence, character system, and a functional mock engine. Leave the actual AI behavior as a clean abstraction for a later development phase.

Do not choose an AI provider, implement a real LLM call, design a personality-scoring algorithm, or write the final AI system prompt.

---

# 1. PROJECT BACKGROUND

Organization: Google Developer Groups on Campus (GDGoC)

Campus: Arab Academy for Science, Technology & Maritime Transport (AASTMT), Aswan

Event: New-member orientation session

Audience:

- University students, particularly first- and second-year students
- Beginners with little or no programming knowledge
- Students interested in exploring technology
- Students using their phones during an in-person presentation

The orientation introduces five technical tracks:

1. Software Engineering
2. Artificial Intelligence (AI)
3. Web Development
4. Data Science
5. Cybersecurity

The purpose is not to test technical knowledge.

The purpose is to make attendees curious about the community, personally engaged with the tracks, and excited about becoming members.

## The existing visual reference

<https://gdgoc-pirate-expedition.vercel.app/>

Study the website's theme, colors, artwork, textures, nautical decorations, map-inspired interface, and storytelling vocabulary.

The existing website has a pirate expedition concept with five track-themed islands.

Use it for **visual inspiration only**.

This is an independent application.

Do not:

- Modify the original website.
- Connect to its codebase.
- Depend on its routes or APIs.
- Reproduce its island-navigation functionality.
- Build another interactive island-map explorer.
- Require its WhatsApp links.
- Import its assets automatically without verifying they are provided and available for reuse.

Instead, establish an aesthetically coherent experience that feels like another part of the same pirate universe.

## Character reference artwork

A supplied reference illustration depicts five pirate characters.

These characters are the main visual identity of this application.

Map them carefully:

| Track                | Character description                                               | Primary color | Symbol |
| -------------------- | ------------------------------------------------------------------- | ------------- | ------ |
| Software Engineering | Red pirate carrying a coding scroll, with mechanical gear details   | Red           | Gear   |
| AI                   | Blue, futuristic pirate girl with a small floating robot companion  | Blue          | Robot  |
| Web Development      | Orange pirate captain with a globe symbol and web interface display | Orange        | Globe  |
| Data Science         | Purple pirate with glasses, analytical charts and documents         | Purple        | Charts |
| Cybersecurity        | Green hooded pirate with mask, shield and security elements         | Green         | Shield |

Preserve the characters' original visual identities, color associations, clothing details, and pixel-art style.

Use isolated transparent versions of the supplied character artwork if available.

If only the composite reference image is available:

- Investigate whether the individual characters can be cleanly extracted without damaging them.
- Do not assume the composite image contains clean transparent sprites.
- Do not use visually unrelated stock characters.
- Build a graceful temporary placeholder system where necessary.
- Document any missing production assets.

Do not replace these characters with generic emojis or unrelated pirate illustrations.

The characters should be recognizable across the chat, reveal screen, promotional display, and result cards.

---

# 2. PRODUCT CONCEPT

Working title:

**GDGoC — The Pirate Identity Expedition**

Suggested tagline:

"اكتشف القرصان اللي جواك"

Secondary English tagline:

"Discover Your Pirate Identity"

This is a single-player, chat-based, story-driven experience.

Participants arrive, encounter a pirate captain, respond to open-ended questions using natural language, and eventually receive a personalized pirate identity associated with one of the five GDGoC tracks.

The interface should feel like a dialogue inside an adventure game rather than a normal chatbot or online questionnaire.

## Experience principles

1. Story first, questionnaire second.
2. One continuous conversational adventure.
3. Natural-language answers, not multiple-choice questions.
4. Arabic-first, with natural English technical terminology.
5. Playful but not childish.
6. Short enough for a live orientation event.
7. Visually impressive on mobile.
8. Easy to understand without technical background.
9. Fast, responsive, and resilient.
10. Exciting character reveal at the end.

## Absolute product restrictions

Do not implement:

- Four-option personality questions.
- Radio-button questions.
- Traditional questionnaire forms.
- A separate Stage B.
- Multiplayer crews or team formation.
- Team missions or collaborative puzzles.
- Leaderboards or competitive scoring.
- Islands that users must navigate to discover tracks.
- A generic AI assistant interface without storytelling.
- A real MBTI examination.
- Real AI inference during this phase.

The entire experience must happen through an immersive conversation, followed by a result reveal.

Pirate scenarios and missions MAY appear as conversational questions from the captain.

They must not become separate gameplay stages.

---

# 3. THE DESIRED USER JOURNEY

Implement the following complete flow.

## Phase 1 — Arrival

The user arrives through a QR code or link.

They see a cinematic pirate-themed welcome screen.

Elements:

- GDGoC AASTMT Aswan branding.
- Large expedition heading.
- Attractive illustrated background.
- A pirate captain character.
- Subtle ocean movement or parallax.
- Compass/nautical graphics.
- Clear CTA to start.

Suggested opening:

**Welcome to the Pirate Identity Expedition**

"أهلاً بيك في عالم القراصنة!"

"خمس شخصيات، خمس مغامرات، وكل قرصان ليه طريقته الخاصة."

"جاهز تكتشف أنت أنهي قرصان؟"

Primary button:

"يلا نبدأ المغامرة!"

Include a subtle hint:

"مفيش إجابات صح وغلط — جاوب بطريقتك."

Keep the welcome concise. Avoid making users read large paragraphs.

### Optional pirate name

Allow the visitor to enter a nickname before starting, but make this optional and skippable.

Example:

"نندهلك بإيه يا قرصان؟"

No registration or account creation.

Do not require email, phone number, or university ID.

If skipped, use a friendly generic pirate nickname.

Avoid unnecessary personal-data collection.

## Phase 2 — Entering the conversation

Transition into the chat experience using a short, polished animation.

Possibilities:

- A parchment unfolding.
- A ship approaching an island.
- A compass rotating.
- A pirate captain appearing.
- The adventure interface opening like an old map.

The animation must be short and skippable.

Do not delay users with a long loading animation.

Introduce the captain naturally:

"أهلاً يا قرصان! أنا الكابتن بتاع الرحلة دي."

"قبل ما نحدد مكانك وسط القراصنة، عندي كام موقف عايز أعرف هتتصرف فيهم إزاي."

"مستعد؟"

The conversation then begins.

## Phase 3 — Natural conversation

This is the core product.

The user sees a stylized chat interface.

They interact using a text input.

There are NO predefined answer choices.

The captain presents short narrative scenarios.

The visitor answers freely, in Arabic, English, or a mixture.

Future AI functionality will eventually interpret their answers, adapt follow-up questions, and determine an appropriate track.

For now, implement a mock engine with a well-defined interface.

### Expected conversation length

Target approximately 6–8 prompts, configurable.

Typical experience target: approximately 3–5 minutes, depending on typing speed.

Avoid fixed timing requirements.

The UI must support dynamic numbers of questions in the future, because real AI may ask fewer, more, or follow-up questions.

A fixed progress indicator must never conflict with an adaptive conversation.

## Phase 4 — Transition to reveal

After the conversation is complete, display an exciting but short transition.

Example:

"استنى كده يا قرصان..."

"الكابتن بيراجع رحلتك..."

"واضح إن ليك مكان مميز وسط الطاقم!"

This animation is purely presentational.

Do not pretend that real personality analysis occurred in demo mode.

In demo mode, present the result clearly as illustrative.

## Phase 5 — Character reveal

Reveal one of the five character identities.

Requirements:

- Character-focused reveal.
- Dramatic entrance animation.
- Track color theme.
- Character title.
- Track name.
- Short description.
- Optional secondary affinity, when supported by future data.
- A personalized explanation field for future AI output.
- Screenshot/share-friendly presentation.

Example:

**YOUR PIRATE IDENTITY**

**THE GUARDIAN**

Cybersecurity

"إنت من النوع اللي بيحب يفهم اللي بيحصل ورا الكواليس، ودايمًا بيفكر إزاي يكتشف المشاكل قبل ما تحصل."

Provide an encouraging note:

"دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!"

This is a discovery experience, not a definitive career assessment.

### Result actions

Include:

- Share My Pirate
- Save Character Card
- Try Again
- Explore the Five Pirates (optional character gallery)

Do not require integration with the existing expedition website.

External links can remain configurable and disabled unless deliberately supplied.

---

# 4. LANGUAGE AND WRITING STYLE

This project must support **Egyptian Arabic mixed naturally with English**.

The primary conversational language is Egyptian Arabic.

The game must not sound like a translated corporate presentation.

It should sound like a friendly, funny, imaginative conversation with a pirate captain.

Use English naturally for:

- Technical track names
- Pirate titles
- UI-specific gaming terminology where appropriate
- Familiar technical words

Examples of appropriate writing:

"تخيل إنك مع طاقمك على جزيرة غريبة..."

"لقيت Data كتير ومش فاهم منها حاجة."

"إيه أول حاجة هتفكر تعملها؟"

"Interesting! طب خليني أسألك حاجة تانية."

"تمام يا Captain، بس عندنا مشكلة أكبر!"

Avoid:

- Excessive formal Arabic.
- Robotic repeated phrases.
- Awkward literal translations.
- Overusing English in every sentence.
- Slang so excessive that the experience becomes difficult to understand.
- Fake technical jargon or inaccurate technical explanations.

The captain should be witty and playful but not mocking.

The humor should be appropriate for a university event.

## RTL and LTR handling

This is extremely important.

The site is primarily RTL, but technical terms and English titles will be embedded inside Arabic text.

Implement robust bidirectional text handling.

Requirements:

- Correct RTL document sections.
- Proper handling of embedded English phrases.
- Stable punctuation.
- Correct number rendering.
- Appropriate direction for input fields.
- Correct layout for mixed-language chat messages.
- No reversed track titles.
- No broken text on exported character cards.

Consider using `dir="auto"` and appropriate bidi isolation for user-generated content.

Do not force the entire visual interface into RTL when a specific decorative element or English title should retain its natural direction.

---

# 5. THE CONVERSATION EXPERIENCE

Design a distinctive chat interface.

Avoid cloning ChatGPT, WhatsApp, Messenger, or Discord.

It should look like a pirate adventure dialogue UI.

## Main chat layout

Top section:

- Captain portrait.
- Captain name.
- Small game subtitle.
- Decorative compass or ship icon.
- Optional journey progress.

Conversation section:

- Captain dialogue bubbles.
- Player dialogue bubbles.
- Character avatar.
- Subtle message animations.
- Atmospheric parchment background.
- Auto-scrolling behavior.
- Typing/loading state.

Bottom section:

- Multiline text composer.
- Send button.
- Helpful placeholder.
- Mobile keyboard-safe positioning.

Example placeholder:

"اكتب ردك يا قرصان..."

Suggested caption:

"جاوب براحتك، مفيش إجابة صح أو غلط."

## Input behavior

The user must be able to type complete natural-language answers.

Support:

- Arabic input.
- English input.
- Mixed Arabic-English text.
- Multiline answers.
- Mobile keyboards.
- Emoji.
- Copy/paste.
- A reasonable maximum input length.
- Disabled send on empty/whitespace-only messages.
- Keyboard submission on desktop.
- Shift+Enter for newline on desktop.

Do not prevent legitimate short answers.

Do not require a minimum word count.

Do not provide multiple-choice alternatives or suggestion chips containing predetermined responses.

## Chat animations

Implement:

- Captain message entrance.
- Player message entrance.
- Subtle typing indicator.
- Portrait movement or expression feedback.
- Optional smooth text reveal.
- Carefully paced transitions.

Avoid artificial delays that make the game feel slow.

If implementing a typewriter effect:

- Provide a skip mechanism.
- Do not make screen readers wait for individual characters.
- Do not prevent users from reading text immediately when reduced motion is enabled.

## Scrolling behavior

Handle mobile chat scrolling correctly.

Requirements:

- Scroll to the newest message when appropriate.
- Do not yank the viewport while the user is reading earlier content.
- Correctly handle soft-keyboard opening and closing.
- Prevent composer overlap.
- Respect iOS safe-area insets.
- Maintain a stable viewport.
- Handle the virtual keyboard on Chrome Android and Safari iOS.

This must be tested carefully.

## Loading and connection states

Even though AI is not implemented, design the chat UI to eventually handle:

- Waiting for a response.
- Slow responses.
- Temporary network failures.
- Retry actions.
- Disabled composer during critical transitions.
- Duplicate-message protection.
- Restored conversations.

Do not introduce fake server requests merely to imitate an AI service.

Use the mock adapter and clearly separate simulation from real future networking.

---

# 6. SAMPLE CONVERSATION CONTENT

Create a well-written mock conversational script for demonstration.

The following scenarios are examples, not a mandatory final script.

Write approximately 6–8 engaging conversation prompts.

They should explore personality and problem-solving preferences indirectly.

They must never resemble a technical exam.

### Scenario 1 — The mysterious island

"وصلنا جزيرة غريبة، وكل القراصنة اللي راحوا قبلنا اختفوا."

"قدامك خريطة قديمة، وآثار أقدام، وجهاز غريب بيلمع."

"إيه أول حاجة هتعملها؟ وليه؟"

### Scenario 2 — The broken ship

"السفينة عطلت فجأة في نص البحر."

"معاك أدوات قليلة، والطاقم مستني منك قرار."

"إزاي هتبدأ تتعامل مع المشكلة؟"

### Scenario 3 — The unknown message

"لقينا رسالة قديمة كلها رموز وأرقام مش مفهومة."

"الكابتن مقتنع إن فيها سر مهم."

"هتحاول تفهمها إزاي؟"

### Scenario 4 — The disagreement

"اتنين من الطاقم مختلفين على الطريق اللي المفروض نمشي فيه."

"كل واحد عنده أسباب مقنعة."

"هتتعامل مع الموقف إزاي؟"

### Scenario 5 — Invent something

"لو تقدر تخترع أي أداة تساعد طاقم القراصنة في الرحلة..."

"هتخترع إيه؟ وإيه اللي يخليها مفيدة؟"

### Scenario 6 — Unexpected danger

"وأنتوا قربتوا من الكنز، لاحظت حاجة غريبة ممكن تكون خطر."

"محدش غيرك واخد باله."

"هتتصرف إزاي؟"

### Scenario 7 — The final decision

"فاضل خطوة واحدة على الكنز، بس عندنا طريق سريع ومجهول، وطريق أطول وواضح."

"هتقرر بناءً على إيه؟"

These examples must be reviewed and refined for:

- Natural conversation flow.
- Variety of thinking styles.
- Inclusiveness.
- No obvious preference for any particular track.
- Appropriate difficulty.
- Minimal repetition.

The final experience should not feel like seven unrelated textbook questions.

Connect them through one evolving pirate adventure.

## Mock mode behavior

Until AI is implemented:

- Use scripted questions.
- Accept and display actual free-text answers.
- Move through the conversation via an abstract engine.
- Use neutral narrative transitions.
- Do not pretend to understand or analyze the user's response.
- Do not hardcode keyword-based personality classification.
- Do not falsely claim a personalized inference has occurred.

At the end, produce an explicitly labeled demo result.

Add a development-only mechanism to preview each of the five result types.

Make the entire user journey testable without an AI key or external service.

---

# 7. CHARACTER SYSTEM

Each technical track has a defined pirate persona.

Use a central typed configuration as the single source of truth.

## Character 1 — Software Engineering

**The Shipwright**

Color: Red

Theme: Building, architecture, structure, reliability.

Description:

"The pirate who builds what keeps the expedition alive."

Arabic personality tone:

"بتحب تفهم الحاجة شغالة إزاي من جوا، وتبني حلول تعيش وتستحمل."

Visual motifs:

- Gear
- Engineering tools
- Code scroll
- Ship mechanisms
- Strong structures

## Character 2 — AI

**The Oracle**

Color: Blue

Theme: Experimentation, invention, automation, curiosity.

Description:

"The pirate who imagines possibilities beyond the horizon."

Arabic personality tone:

"فضولي، بتحب تجرب أفكار جديدة، وتشوف إزاي تخلي الحاجات أذكى."

Visual motifs:

- Robot companion
- Blue energy
- Futuristic interfaces
- Stars or glowing intelligence symbols

## Character 3 — Web Development

**The Navigator**

Color: Orange

Theme: Interactive experiences, creativity, connecting people.

Description:

"The pirate who turns ideas into experiences everyone can explore."

Arabic personality tone:

"بتحب تحوّل الأفكار لحاجات الناس تقدر تشوفها وتستخدمها وتتفاعل معاها."

Visual motifs:

- Globe
- Web interface
- Compass
- Connected routes
- Orange nautical flags

## Character 4 — Data Science

**The Cartographer**

Color: Purple

Theme: Patterns, discovery, interpretation, evidence.

Description:

"The pirate who finds meaning hidden inside the maps."

Arabic personality tone:

"بتحب تلاحظ التفاصيل، وتدور على Patterns، وتطلع معنى من حاجات ممكن غيرك ميلاحظهاش."

Visual motifs:

- Charts
- Map documents
- Analysis tools
- Coordinates
- Constellations

## Character 5 — Cybersecurity

**The Guardian**

Color: Green

Theme: Protection, investigation, skepticism, defense.

Description:

"The pirate who protects the crew from hidden threats."

Arabic personality tone:

"بتحب تكتشف الخطر بدري، وتفهم الثغرات، وتحمي اللي الفريق بيبنيه."

Visual motifs:

- Shield
- Lock
- Mask
- Defensive barriers
- Glowing green security symbols

## Important design constraint

These are fictional, playful archetypes.

Do not portray technical tracks as exclusive personality types.

Do not claim that a person's personality determines their career path.

All tracks should be depicted positively, without suggesting one is smarter or more important than another.

---

# 8. CHARACTER REVEAL SCREEN

This is one of the highest-priority parts of the project.

Build a reveal sequence that feels like a reward in a game.

### Suggested reveal timeline

1. Chat interface fades or transitions away.
2. The parchment background becomes a mysterious treasure chamber or captain's log.
3. A compass spins briefly.
4. The screen displays: "THE CAPTAIN HAS CHOSEN..."
5. A character silhouette appears.
6. The silhouette reveals the actual pirate illustration.
7. Track color effects appear.
8. Character title animates in.
9. The result card becomes readable and interactive.

Keep the animation short and skippable.

## Result layout

Include:

**YOUR PIRATE IDENTITY**

[Large Pirate Illustration]

**THE SHIPWRIGHT**

**SOFTWARE ENGINEERING**

"وصف قصير للشخصية يناسب الأجواء."

Personalized explanation area:

"ليه الشخصية دي؟"

This explanation is driven by the future AI result data.

In mock mode, explicitly label it as sample text.

Optional secondary compatibility:

"Another path you might enjoy: AI"

Only show a secondary affinity when the result object supplies one.

## Result card

Build a beautifully designed pirate identity card suitable for sharing.

Visual details:

- Antique treasure card.
- Elegant golden border.
- Character artwork.
- Track-specific colors.
- Nautical ornaments.
- Character title.
- Track name.
- GDGoC AASTMT Aswan branding.
- Optional nickname.

Must look good as:

- A phone screenshot.
- An Instagram story.
- A shareable PNG.
- A compact card in messaging apps.

Export using a reliable client-side approach.

Handle image loading, web fonts, and Arabic rendering correctly.

If an image export fails, provide a useful fallback or explain the issue.

Do not include a user's full conversation or private answers in the shared card.

---

# 9. VISUAL DESIGN SYSTEM

## Primary aesthetic

Use a cohesive fusion of:

- Pixel-art RPG
- Pirate treasure map
- Nautical fantasy
- Antique parchment
- Retro adventure game
- Modern mobile interface usability

The result should feel handcrafted, charming, cinematic, and memorable.

Avoid making the interface look like:

- A SaaS dashboard.
- A generic Bootstrap template.
- A standard messaging application.
- A minimal corporate landing page.
- A cyberpunk dashboard.
- An overly complicated MMORPG UI.

## Colors

Suggested palette:

Primary parchment: warm ivory / antique paper.

Dark text: ink brown or deep charcoal.

Wood: dark desaturated brown.

Gold: muted antique gold.

Ocean: muted deep teal or blue-green.

Track accents:

- Software Engineering — Red
- AI — Blue
- Web Development — Orange
- Data Science — Purple
- Cybersecurity — Green

Google brand colors may appear sparingly in secondary decorations, but should not overpower the pirate theme.

Create central design tokens rather than scattering hexadecimal colors throughout components.

## Typography

Use readable fonts supporting Arabic well.

Suggestions:

- Cairo
- IBM Plex Sans Arabic
- Tajawal

For English display accents, use a game-inspired or pixel-style font where appropriate.

Use pixel fonts sparingly.

Prioritize readability over decorative typography, particularly on small screens.

## Backgrounds

Possible design elements:

- Parchment textures.
- Old map lines.
- Compass roses.
- Gentle moving waves.
- Clouds.
- Torn parchment edges.
- Dotted sailing paths.
- Rope decorations.
- Ship silhouettes.
- Subtle golden particles.

Do not place too many visual elements on the screen simultaneously.

Important text must remain readable.

Avoid excessive glow, gradients, glassmorphism, and random floating UI elements.

## Buttons

Design distinctive controls.

Possible details:

- Parchment or wood surfaces.
- Handcrafted borders.
- Slight pixel-art ornamentation.
- Small compass or arrow motifs.
- Press animations.

Keep button labels as real accessible text, not rasterized inside image assets.

All controls must remain easy to tap on a smartphone.

---

# 10. ANIMATION DIRECTION

Animations should improve the experience rather than exist for decoration alone.

Use GSAP where it genuinely improves cinematic transitions and sequencing.

A lightweight motion library or CSS transitions may be used for smaller UI interactions.

Avoid combining multiple animation systems without a clear reason.

Priority animations:

### Welcome

- Captain entrance.
- Title reveal.
- Floating compass.
- Subtle atmospheric movement.

### Chat

- Message arrivals.
- Typing indicator.
- Captain idle animation.
- Composer focus.
- Seamless transitions.

### Reveal

- Suspense.
- Character entrance.
- Track-colored effects.
- Title animation.
- Result card appearance.

### Buttons

- Hover/press feedback.
- Playful but subtle motion.

### Accessibility and performance

- Respect `prefers-reduced-motion`.
- Do not rely on animation to communicate essential information.
- Avoid expensive continuous effects.
- Use GPU-friendly transforms and opacity when possible.
- Clean up animations correctly when components unmount.
- Prevent memory leaks.

Performance is more important than visual extravagance.

---

# 11. MOBILE-FIRST RESPONSIVENESS

Design primarily for portrait smartphones.

The event audience will scan a QR code and interact on their phones.

Support common viewport sizes, including:

- 320px
- 360px
- 375px
- 390px
- 430px
- Tablets
- Desktop

Avoid requiring horizontal scrolling.

## Mobile considerations

- The chat input must remain accessible when the keyboard opens.
- Important controls should have comfortable tap targets.
- Long character names should not overflow.
- The result card should fit mobile proportions.
- Avoid large fixed heights that break on short screens.
- Support safe-area insets.
- Avoid unnecessary full-screen effects that interfere with browser navigation.
- Load visual assets efficiently.

The product should feel like a lightweight mobile adventure game, not a desktop site squeezed into a phone.

## Desktop

Desktop should also look deliberate, not stretched.

Use a centered game-stage layout where appropriate.

A desktop visitor could see a larger atmospheric background around the main experience.

---

# 12. PROJECTOR / EVENT DISPLAY

Build an optional presentation-friendly route, such as:

`/present`

This is **not** a multiplayer game mode.

Its role is simply to let event organizers display a polished invitation on a projector.

Include:

- Large game title.
- QR code pointing to the deployed game URL.
- Short instructions.
- Five pirate characters.
- GDGoC AASTMT Aswan identity.
- Clean 16:9 composition.

Suggested text:

"مين القرصان اللي جواك؟"

"Scan the QR Code"

"جاوب على كام سؤال واكتشف شخصيتك!"

The QR code destination should be configurable.

Do not invent a deployed production URL.

Do not implement live leaderboards, user tracking, audience personality statistics, or realtime dashboards.

Those are not part of this project.

---

# 13. TECHNOLOGY STACK

Preferred greenfield stack:

- Next.js with App Router
- TypeScript in strict mode
- Tailwind CSS
- GSAP for major animation sequences
- Lightweight icon package such as Lucide
- Zod for boundary validation
- Local state/session persistence
- Vercel-compatible deployment

Choose the current stable compatible package versions.

If the repository already contains a suitable stack, inspect it and reuse it where practical rather than unnecessarily rebuilding the entire project.

Do not adopt a large dependency merely for a tiny feature.

## State management

Keep the architecture simple and reliable.

Use React state, context, reducers, or a lightweight state-management library where it materially helps.

Chat/game transitions must be explicit and testable.

Avoid a monolithic component containing all the game logic.

## Assets

Use optimized image formats where appropriate.

Preserve transparency on character images.

Provide explicit dimensions to reduce layout shifts.

Preload critical assets when useful.

Lazy-load noncritical assets.

Do not use remote placeholder images as a final production dependency.

---

# 14. ARCHITECTURE REQUIREMENTS

Separate the following responsibilities:

1. Presentation/UI
2. Conversation state
3. Game transitions
4. Character definitions
5. Dialogue/content
6. Session persistence
7. Conversation engine integration
8. Result rendering/export
9. Configuration
10. Event presentation screen

Use a maintainable feature-based folder structure.

A possible structure:

```text
src/
  app/
    page.tsx
    play/
      page.tsx
    result/
      page.tsx
    present/
      page.tsx

  components/
    layout/
    pirate/
    chat/
    game/
    reveal/
    shared/

  features/
    expedition/
      components/
      hooks/
      state/
      types/
      config/
    characters/
      data/
      components/
    conversation/
      engine/
      mock/
      types/
    result/
      components/
      export/

  content/
    dialogue/
    characters/

  lib/
    persistence/
    validation/
    utilities/

  styles/

public/
  assets/
    characters/
    backgrounds/
    icons/
    textures/
```

This is a suggested layout, not a mandatory requirement.

Adapt it to the actual framework and architecture.

Avoid unnecessary abstraction layers.

---

# 15. AI INTEGRATION BOUNDARY — ABSTRACT ONLY

This section is critical.

We will decide the AI provider, system prompt, conversation orchestration, track-classification methodology, model costs, and AI safety configuration later.

Your current task is to prepare a clean integration boundary.

## Do not implement actual AI

Specifically, do not:

- Call OpenAI, Gemini, Claude, or another AI provider.
- Install an AI SDK unnecessarily.
- Invent the final AI system prompt.
- Create hidden keyword heuristics pretending to be AI.
- Build weighted personality classification.
- Choose a model architecture.
- Train or fine-tune anything.
- Require API keys to run the application.
- Make client-side calls to third-party LLMs.
- Put placeholder API secrets in the frontend.
- Create a complex backend merely to anticipate hypothetical future requirements.

## Build an engine adapter

The application should communicate with a general conversation engine interface.

Conceptually:

```ts
interface ConversationEngine {
  start(context: StartContext): Promise<EngineResponse>;

  reply(context: ConversationContext, message: string): Promise<EngineResponse>;

  getResult(context: ConversationContext): Promise<ExpeditionResult>;
}
```

These signatures are illustrative.

Improve them if necessary.

Define clear, typed contracts for:

- Message identifiers.
- Message role.
- Message content.
- Conversation/session identifiers.
- Conversation phases.
- Completion state.
- Optional progress information.
- Recoverable errors.
- Final reveal payload.
- Optional secondary affinity.
- Optional explanation.
- Provider-neutral metadata.

Keep result data separate from visual component code.

Use strict types and runtime validation at external boundaries.

## Implement a mock engine

Create `MockConversationEngine` or an equivalent adapter.

Its job:

- Return the scripted captain introduction.
- Accept free-text visitor messages.
- Append conversation messages.
- Advance through mock scenarios.
- Return neutral follow-up dialogue.
- Signal completion.
- Supply an explicitly illustrative result.

It must not claim to perform genuine personality analysis.

For development and testing, provide a way to preview each of the five characters.

A route, configuration flag, or developer-only selector is acceptable.

Make the distinction between mock behavior and real future AI behavior obvious in both documentation and demo UI.

## Future replacement

The future engine might be server-backed.

Prepare the frontend to handle asynchronous responses without forcing the application to know the provider.

The eventual AI response may include:

- Captain message.
- Conversation continuation or completion signal.
- Primary track.
- Optional secondary track.
- Short explanation.
- Optional display metadata.

Do not assume the backend will use exactly seven questions or a predetermined scoring rubric.

Do not expose provider-specific concepts in UI components.

**The future AI implementation should replace the engine adapter, not require rebuilding the website.**

---

# 16. CONVERSATION STATE MACHINE

Define a clear experience lifecycle.

Suggested states:

```text
WELCOME
   ↓
INTRO
   ↓
CONVERSATION
   ↓
AWAITING_RESPONSE
   ↓
CONVERSATION
   ↓
COMPLETED
   ↓
REVEALING
   ↓
RESULT
```

Support:

- Starting.
- Sending messages.
- Preventing duplicate submissions.
- Awaiting a response.
- Handling an error.
- Retrying.
- Completing the conversation.
- Opening a reveal.
- Showing results.
- Restarting from the beginning.

Avoid invalid state transitions.

The interface should not allow:

- Sending a message after completion.
- Starting a second active send while one is pending.
- Revealing an undefined character.
- Accessing a result that does not exist.
- Accidentally losing the conversation when navigating between screens.

---

# 17. SESSION PERSISTENCE

Users should not lose their experience when they accidentally refresh the page.

Implement a lightweight local session system.

Persist:

- Nickname, if supplied.
- Conversation messages.
- Current phase.
- Mock progression state.
- Result state.
- Basic timestamps and schema version.

Prefer localStorage or a similarly appropriate local mechanism for the frontend-only prototype.

Do not introduce a database without a real requirement.

## Resume behavior

If a session exists, allow visitors to continue.

Example:

"عندك مغامرة لسه مخلصتهاش!"

Buttons:

- كمل المغامرة
- ابدأ من الأول

If the session has already ended, allow the result to be reopened or the game to restart.

Support versioned state migration or safe reset when persistence formats change.

Provide a clear way to erase the local session.

Avoid retaining free-text responses indefinitely; use an expiration policy.

Do not log visitors' free-text answers to third-party analytics by default.

---

# 18. ACCESSIBILITY AND USABILITY

The experience must be usable beyond its animations.

Requirements:

- Semantic HTML.
- Keyboard navigation.
- Visible focus states.
- Accessible controls.
- Sufficient color contrast.
- Appropriate alt text.
- Decorative imagery excluded from assistive technologies.
- Proper loading announcements.
- Reduced-motion support.
- Clear error states.
- Readable Arabic typography.
- Text selectable where appropriate.
- No essential instructions embedded only inside images.

Chat messages should be announced accessibly without repeatedly reading the entire conversation.

The result must remain understandable if animations are disabled.

Do not implement decorative controls that have no real function.

---

# 19. RELIABILITY AND SECURITY

Even without actual AI, treat the application as a serious public-facing event website.

Implement:

- Basic input length limits.
- Safe text rendering.
- No unsafe HTML injection from visitor content.
- No unnecessary personal-data collection.
- Clean error boundaries.
- No unhandled promise rejections.
- Proper storage error handling.
- Idempotent message sending where practical.
- Defensive validation of session state.
- Graceful failure when local storage is unavailable.

Do not use `dangerouslySetInnerHTML` for user messages.

Do not put secrets in browser bundles.

Do not make unsupported claims of security or data privacy.

## Performance

Target smooth operation on ordinary student Android phones over campus/mobile networks.

Use:

- Optimized images.
- Reasonable code splitting.
- Lazy loading of noncritical resources.
- Limited animation complexity.
- Stable layouts.
- Efficient React rendering.

Avoid enormous textures, unnecessary 3D scenes, and heavy canvas effects if simpler CSS/GSAP can provide a better experience.

---

# 20. UI COMPONENTS TO BUILD

Implement reusable components where appropriate.

Suggested components:

### Core

- ExpeditionLayout
- WelcomeScene
- ExpeditionHeader
- PirateButton
- NauticalBackground
- ParchmentPanel
- CompassDecoration

### Conversation

- CaptainAvatar
- ChatMessage
- ChatMessageList
- ChatComposer
- TypingIndicator
- JourneyProgress
- ConversationScene
- ConversationError
- ResumeExpeditionDialog

### Characters

- PirateCharacter
- CharacterPortrait
- CharacterBadge
- CharacterGallery
- TrackAccent

### Reveal

- RevealSequence
- CharacterSilhouette
- CharacterReveal
- ResultCard
- ResultExplanation
- ResultActions
- ShareCard

### Presentation

- PresentationScreen
- ExpeditionQRCode

Only create components that actually serve a purpose.

Do not over-componentize simple markup.

---

# 21. RESULT EXPORT AND SHARING

Build an exportable pirate identity card.

Users should be able to:

- Save the card as an image.
- Share using native browser sharing if supported.
- Download a PNG as a fallback.
- Replay the reveal animation.
- Start a new expedition.

The card export must work with Arabic and English text.

Before capturing:

- Ensure assets have loaded.
- Ensure relevant fonts are ready.
- Render a consistent card layout.
- Avoid clipped text.
- Avoid exporting UI buttons.

Handle platforms where browser sharing is unavailable.

Do not upload result cards to a server for this version.

Do not expose personal chat responses in URLs.

---

# 22. CONFIGURATION

Create clear configuration files for:

- Brand name
- Campus name
- Experience title
- Taglines
- All five character definitions
- Assets
- Mock dialogue
- Track colors
- Animation settings
- Mock session length
- Default demo result
- QR code destination
- Event presentation options
- External community links (disabled or omitted by default)

Separate content from UI components.

Avoid hardcoding repeated copy inside JSX.

Make changes to character names, descriptions, and colors straightforward.

---

# 23. DEVELOPMENT AND TESTING

Do not stop after building the first screen.

Deliver a complete playable prototype.

## Automated tests

At minimum, test:

- Starting a conversation.
- Accepting free-text answers.
- Progressing through the mock script.
- Conversation completion.
- Rendering all five result variants.
- Restarting.
- Persisting and resuming sessions.
- Preventing duplicate message submission.
- Handling invalid persisted state.
- Correct engine adapter behavior.

Use an appropriate test framework for the chosen stack.

## End-to-end testing

If browser automation tools are available, use them.

Test:

- Mobile welcome.
- Chat progression.
- Input behavior.
- Result reveal.
- PNG export.
- Restart flow.
- Desktop presentation screen.

Test at narrow mobile widths and desktop resolutions.

## Visual QA

Look for:

- RTL bugs.
- English words rendered awkwardly in Arabic text.
- Buttons obscured by the keyboard.
- Cropped character portraits.
- Text overflow.
- Misaligned chat bubbles.
- Broken image ratios.
- Inconsistent animation timing.
- Poor contrast on parchment backgrounds.

Fix problems you discover rather than merely listing them.

## Build verification

Run:

- Type checks.
- Linting.
- Relevant automated tests.
- Production build.

Fix failures before reporting completion.

---

# 24. IMPLEMENTATION ORDER

Work incrementally.

### Milestone 1 — Discovery

Inspect the repository.

Identify:

- Existing framework.
- Installed dependencies.
- Available assets.
- Current project structure.
- Existing design files.
- Reference character images.

Understand the current state before replacing or creating files.

### Milestone 2 — Foundation

Build:

- App configuration.
- Character data.
- Design tokens.
- Layout.
- Shared UI primitives.
- Responsive theme.

### Milestone 3 — Experience structure

Build:

- Welcome screen.
- Nickname flow.
- Game-state transitions.
- Conversation screen.

### Milestone 4 — Engine abstraction

Build:

- Typed conversation contracts.
- Mock conversation adapter.
- Free-text reply support.
- Error states.
- Persistence.

### Milestone 5 — Character results

Build:

- Five distinct result configurations.
- Character reveal.
- Result details.
- Result export.
- Share actions.

### Milestone 6 — Event presentation

Build:

- Projector landing page.
- Configurable QR code.
- Responsive desktop presentation.

### Milestone 7 — Polish

Implement:

- Animations.
- Accessibility.
- Performance optimization.
- Small-screen refinement.
- Arabic-English typography improvements.

### Milestone 8 — Verification

Run tests, review the screens, resolve issues, and confirm production build readiness.

Do not treat these milestones as permission to stop after planning.

Proceed through implementation unless blocked by an essential unavailable asset or permission.

---

# 25. ACCEPTANCE CRITERIA

The task is complete only when:

- [ ] A working independent web application exists.
- [ ] The theme matches the pirate expedition visual direction.
- [ ] The app supports all five GDGoC pirate identities.
- [ ] The supplied character artwork is used where available.
- [ ] The main experience is mobile-first.
- [ ] The primary language is natural Egyptian Arabic.
- [ ] English terminology is integrated correctly.
- [ ] All questions use free-text chat input.
- [ ] There are no multiple-choice personality questions.
- [ ] There is no separate team-game stage.
- [ ] A complete mock conversation works.
- [ ] The mock engine is clearly separated from future AI integration.
- [ ] No real AI provider or scoring system is implemented.
- [ ] The current demo does not misrepresent simulated results as analyzed personalities.
- [ ] Users can restart and resume.
- [ ] Each character has a polished result screen.
- [ ] The reveal is animated and skippable.
- [ ] Result-card export works.
- [ ] The experience works on common mobile screen sizes.
- [ ] An event/projector QR screen exists.
- [ ] Important interactions are accessible.
- [ ] The app has proper error and loading states.
- [ ] TypeScript and production build pass.
- [ ] The project is ready for future AI integration without major frontend rewrites.

---

# 26. WHAT NOT TO BUILD

Avoid unnecessary scope expansion.

Do not build:

- User accounts.
- Authentication.
- Public profiles.
- Online multiplayer.
- Teams or crew matchmaking.
- Leaderboards.
- Chat between attendees.
- Complex admin dashboards.
- User analytics dashboards.
- A new WhatsApp community portal.
- An island-map navigation application.
- Real AI integration.
- Personality scoring.
- MBTI psychometric calculations.
- Unrequested backends or databases.
- Excessive gamification.
- Character progression or inventory systems.
- Coins or virtual currencies.

Focus entirely on making the single-player pirate identity experience exceptional.

---

# 27. REQUIRED DOCUMENTATION

Create a clear README describing:

1. Project concept.
2. Setup instructions.
3. Development commands.
4. Production build commands.
5. Environment variables, if any.
6. Repository structure.
7. Character configuration.
8. How the mock dialogue works.
9. How session persistence works.
10. How to preview all five character results.
11. How to configure the event QR code.
12. How to add/replace character artwork.
13. How result images are exported.
14. What remains unfinished for future AI integration.

Also add a dedicated document:

`docs/AI_INTEGRATION.md`

This document must be architectural rather than an implementation of AI.

Describe:

- Existing conversation-engine interface.
- Input/output contracts.
- Where a future server-backed engine would connect.
- How asynchronous responses are handled.
- Where future session management would integrate.
- The expected high-level result object.
- What was intentionally not decided.
- Any technical issues to resolve before integrating an AI provider.

Do not include a final AI system prompt.

Do not choose a model.

Do not implement classification heuristics.

---

# 28. FINAL DELIVERY REPORT

After implementation, provide a concise but complete report.

Include:

### Implemented

Describe the actual completed features.

### Architecture

Explain the main technology choices and project structure.

### Visual experience

Explain how the pirate theme, characters, mobile interface, and animations were implemented.

### Demo engine

Explain exactly what the mock conversation does and does not do.

### AI integration readiness

Explain the abstractions created and which future implementation decisions remain open.

### Testing

Report the commands run, results, and any unresolved failures.

### Assets

Mention missing artwork or temporary placeholders.

### How to run

Provide the exact commands to start the project.

### Outstanding work

Distinguish real unfinished requirements from optional future improvements.

Do not claim a feature is finished unless it is implemented and verified.

---

# 29. QUALITY BAR

Treat this as a flagship orientation experience that may be used live in front of a room full of students.

The website should not merely be functional.

It should be:

- Memorable
- Engaging
- Charming
- Immersive
- Smooth
- Easy to understand
- Consistent
- Mobile-friendly
- Visually polished
- Reliable

A beginner should understand what to do within seconds.

A student should enjoy the conversation even without knowing anything about the five tracks.

The character reveal should feel exciting enough that people want to show it to friends.

Use good engineering judgment throughout.

Prioritize the quality of the complete end-to-end user journey over unnecessary features.

**Final instruction: Implement the complete playable application now, with the AI engine deliberately abstracted and mocked. Do not stop at a proposal, wireframe, or implementation plan.**

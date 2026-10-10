# GDGoC Pirate Personality — UI Specifications

Six page-level JSON specifications, one shared design-and-state JSON, and all six supplied screenshots under `references/`.

## Files

- `shared-design-state.json` — app flow, design tokens, RTL typography, breakpoints, five track themes, character assets, component system and result-data gaps.
- `pages/landing-page.json` — original `LandingPage.png`.
- `pages/personality-quiz.json` — original `PersonalityQuiz.png`.
- `pages/loading-screen.json` — original `LoadingScreen.png`.
- `pages/all-tracks-overview.json` — original `AllResultCardsInspirationEx.png`.
- `pages/result-card-software-engineering.json` — original `ResultCardExample1.png`.
- `pages/result-card-artificial-intelligence.json` — original `ResultCardExample2.png`.

## Coding agent handoff

Build a **mobile-first, Arabic RTL** responsive site. Parse `shared-design-state.json` before screen JSON files. Match each screenshot's visual hierarchy, palette, framing and copy, but create actual accessible DOM elements for text and controls. Treat screenshots as visual references only. Look for approved original pirate character PNGs, logo SVGs and background layers in the repository; spec asset paths are desired placeholders, **not existing files inside this bundle**. Do not generate missing assets inside CSS by screenshot-cropping. Implement stable mobile layouts for 320–430px first, then scale to tablet/desktop compositions.

**Quiz mode is MCQ-only:** The personality quiz uses four parchment choice cards per question, exactly one selectable answer (radio behavior), visibly highlighted selection, and disabled Next until an answer is selected. Back restores the previous selection. Do not implement free-text entry or a chat composer. The question bank beyond the one screenshot example still requires approval.

**Content that still needs a source:** Seven of eight quiz questions are not visible; the screenshot provides only question 3, and it is explicitly a visual example. Track inference/scoring/AI implementation is not defined. Full result-copy and artwork layout references are provided only for engineering and AI; the other three result details need approval, though their icons/colors/names/characters are defined in the shared file. Neither placeholder copy nor a mocked track classification should be presented as real functionality.

Suggested build order: 1) shared visual tokens and asset library, 2) landing and tracks overview, 3) quiz UI as MCQ-only, 4) loading and error states, 5) result template with two fully defined examples, 6) verify RTL, 320px, 390px and landscape widths, keyboard, reduced motion and export/share behavior.

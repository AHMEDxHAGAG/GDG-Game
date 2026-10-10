# Character artwork slots

Drop the final isolated transparent files here:

```text
public/assets/characters/
  software-engineering.png   # red shipwright + gear + code scroll
  ai.png                     # blue oracle + robot companion
  web-development.png        # orange navigator + globe + interface
  data-science.png           # purple cartographer + charts + documents
  cybersecurity.png          # green guardian + mask + shield
```

Requirements: transparent PNG/WebP, 1:1, ≥1536px source, no baked text, logos,
QR codes or paragraphs. The app (`CharacterArtwork`) prefers these files and
renders the designed ink placeholder otherwise — including via `onError` if a
path is wrong — so the experience stays reviewable and event-safe.

Why no slices of `assests/characters.jpg`? The supplied reference is a single
progressive JPEG composite (1280×960) with no transparency and overlapping
framing; clean extraction would damage silhouettes and recolour costumes. Until
the isolated exports land, the placeholder system (track colour + emblem +
silhouette language) is the honest stand-in — never stock art or emoji.

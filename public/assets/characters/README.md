# Character artwork

The five production pirate cutouts live here. Do not rename them: the filenames **are**
the `TrackId`s, and `tools/generate-artwork-manifest.mjs` derives
`src/generated/artwork-manifest.ts` from them.

```text
public/assets/characters/
  software-engineering.png   # Software Engineering — red coat, gear tricorne, tool belt, code scroll
  ai.png                     # Artificial Intelligence — blue coat, goggles, glowing AI orb
  web-development.png        # Web Development — orange/black coat, plumed tricorne (landing hero, centre)
  data-science.png           # Data Science — violet coat, wide-brim hat, holographic chart tablet
  cybersecurity.png          # Cybersecurity — masked stealth pirate, glowing green code sheet
```

## Source

Copied verbatim from `assests/Characters/` (the supplied design bundle). The originals
stay there as the source of truth; never edit them in place.

| File | Size | Format |
| --- | --- | --- |
| `SoftwareEngineering.png` | 1024×1536 | RGBA 8-bit |
| `AI.png` | 1024×1536 | RGBA 8-bit |
| `web.png` | 1024×1536 | RGBA 8-bit |
| `DataScience.png` | 1024×1536 | RGBA 8-bit |
| `CyberSecurity.png` | 1024×1536 | RGBA 8-bit |

## Verified properties

These were measured by decoding the PNG alpha channel, not inferred from file names:

- **Genuinely transparent.** All four corners are alpha 0. Roughly 45–57 % of each
  canvas is fully transparent, plus a 3–5 % soft-glow band around the figure.
- **2:3 portrait, not 1:1.** Older notes in this folder asked for 1:1; the supplied art
  is 1024×1536. Layout code must use these real intrinsic dimensions.
- **No baked text, logos or QR codes.** Nothing in the image carries copy.

## Notes

- Served as plain `<img>` with explicit `width`/`height`, not through `next/image`:
  `html-to-image` re-fetches image URLs during PNG export and `_next/image` optimisations
  have been a recurring source of export flakiness.
- If a file goes missing, `CharacterArtwork` falls back to the designed ink placeholder
  (track colour + emblem + silhouette) via `hasArtwork()`, so the experience stays
  reviewable. It never requests a path that is not on disk.

import assert from 'node:assert/strict';
import { access, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import sharp from 'sharp';

const root = fileURLToPath(new URL('../', import.meta.url));
const output = join(root, 'public/assets/ui');
await mkdir(output, { recursive: true });

// `assests/` is gitignored: it is a ~72 MB design bundle, and the build only ever
// reads the generated derivatives in public/assets/. A fresh clone therefore has
// no originals, and this is the single script that needs them. Say so plainly
// instead of failing later with an ENOENT stack pointing at a resize call.
const bundle = join(root, 'assests');
try {
  await access(bundle);
} catch {
  console.error(
    'Cannot prepare UI assets: the design bundle `assests/` is missing.\n' +
      'It is gitignored by design (see .gitignore) and is not part of a fresh clone.\n' +
      'Restore it from wherever the originals are kept, then re-run `npm run assets:prepare`.\n' +
      'Nothing else needs it — `npm run build`, `npm test` and `npm run test:e2e` all\n' +
      'read the generated derivatives already in public/assets/.',
  );
  process.exit(1);
}

// Original artwork stays untouched; only the curated production set is published.
const sources = {
  harbour: ['Backgrounds/Midnight Pirate Harbor Sky-2.png', 1200],
  cabin: ['Backgrounds/Shadowed Pixel Cabin, Empty Center-8.png', 1200],
  gallery: ['Backgrounds/Shadowed navy pirate cabin-9.png', 1200],
  voyage: ['Backgrounds/Moonlit pixel ocean voyage-5.png', 1200],
  deck: ['Backgrounds/Moonlit Pirate Deck, Lantern Glow-6.png', 1200],
  ship: ['Backgrounds/Haunting Skull-Sail Pirate Ship-3.png', 768],
  pier: ['Backgrounds/Moonlit Pirate Pier Stage-1.png', 1200],
  brigantine: ['FX_Prop_icon/Antique Pirate Brigantine at Sea-26.png', 512],
  lantern: ['FX_Prop_icon/Retro Pixel Hanging Sea Lantern-24.png', 256],
  primary: ['UI_Elements/Antique Red Pirate Action Plate-5.png', 1000],
  secondary: ['UI_Elements/Bronze-Edged Navy Pirate Button Plate-6.png', 1000],
  question: ['UI_Elements/Blank torn parchment scroll-3.png', 1000],
  scroll: ['UI_Elements/Blank pirate parchment scroll panel-4.png', 1000],
  answer: ['UI_Elements/Blank retro parchment answer strip-2.png', 1000],
  panel: ['UI_Elements/Brass-Cornered Pixel Recommendation Panel-12.png', 1000],
  collectible: ['UI_Elements/Aged navy character-card plate-8.png', 768],
  gear: ['FX_Prop_icon/Off-white pixel settings gear-15.png', 64],
  brain: ['FX_Prop_icon/Pixel circuit brain icon-11.png', 64],
  code: ['FX_Prop_icon/Off-White Pixel Code Glyph-16.png', 64],
  bars: ['FX_Prop_icon/Ascending pixel bars-12.png', 64],
  shield: ['FX_Prop_icon/Pixel shield with checkmark-9.png', 64],
  'gear-ornate': ['FX_Prop_icon/Pixel-Perfect Engineering Gear-14.png', 256],
  'brain-ornate': ['FX_Prop_icon/Pixelated AI circuit brain emblem-8.png', 256],
  'code-ornate': ['FX_Prop_icon/Pixel Angle-Bracket Code Emblem-13.png', 256],
  'bars-ornate': ['FX_Prop_icon/Ascending data bars emblem-10.png', 256],
  'shield-ornate': ['FX_Prop_icon/Retro cyber shield check emblem-6.png', 256],
};

const catalogue = {};
for (const [id, [source, size]] of Object.entries(sources)) {
  const input = join(root, 'assests', source);
  const meta = await sharp(input).metadata();
  let pipeline = sharp(input);
  if (meta.hasAlpha) pipeline = pipeline.trim({ threshold: 1 });
  const trimmed = await pipeline.png().toBuffer();
  const info = await sharp(trimmed)
    .resize(size, size, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88 })
    .toFile(join(output, `${id}.webp`));
  catalogue[id] = { src: `/assets/ui/${id}.webp`, width: info.width, height: info.height };
  assert(info.width > 0 && info.height > 0);
  if (!meta.hasAlpha) {
    await sharp(input)
      .resize(768, 768, { fit: 'inside' })
      .webp({ quality: 82 })
      .toFile(join(output, `${id}-mobile.webp`));
  }
}

// Nine-slice the narrow source frame into a 4:5 poster without stretching corners.
const frame = await sharp(join(root, 'assests/UI_Elements/Ornate Pixel RPG Card Frame-10.png'))
  .trim({ threshold: 1 })
  .png()
  .toBuffer();
const { width: fw, height: fh } = await sharp(frame).metadata();
const edge = 120;
const srcX = [0, edge, fw - edge];
const srcY = [0, edge, fh - edge];
const srcW = [edge, fw - 2 * edge, edge];
const srcH = [edge, fh - 2 * edge, edge];
const dstX = [0, edge, 1080 - edge];
const dstY = [0, edge, 1350 - edge];
const dstW = [edge, 1080 - 2 * edge, edge];
const dstH = [edge, 1350 - 2 * edge, edge];
const pieces = [];
for (let y = 0; y < 3; y++) {
  for (let x = 0; x < 3; x++) {
    pieces.push({
      input: await sharp(frame)
        .extract({ left: srcX[x], top: srcY[y], width: srcW[x], height: srcH[y] })
        .resize(dstW[x], dstH[y], { fit: 'fill' })
        .png()
        .toBuffer(),
      left: dstX[x],
      top: dstY[y],
    });
  }
}
await sharp({ create: { width: 1080, height: 1350, channels: 4, background: '#00000000' } })
  .composite(pieces)
  .webp({ lossless: true })
  .toFile(join(output, 'poster-frame.webp'));
catalogue['poster-frame'] = { src: '/assets/ui/poster-frame.webp', width: 1080, height: 1350 };

const characters = {
  ai: 'AI',
  cybersecurity: 'CyberSecurity',
  'data-science': 'DataScience',
  'software-engineering': 'SoftwareEngineering',
  'web-development': 'web',
};
for (const [id, source] of Object.entries(characters)) {
  for (const width of [256, 512, 768]) {
    const suffix = width === 768 ? '' : `-${width}`;
    await sharp(join(root, 'assests/Characters', `${source}.png`))
      .resize({ width })
      .webp({ quality: width === 768 ? 90 : 82 })
      .toFile(join(root, 'public/assets/characters', `${id}${suffix}.webp`));
  }
}
await writeFile(
  join(root, 'src/generated/ui-assets.json'),
  `${JSON.stringify(catalogue, null, 2)}\n`,
);
console.log(
  `Prepared ${Object.keys(catalogue).length} UI assets and responsive character artwork.`,
);

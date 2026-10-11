import type { CharacterDefinition, TrackId } from '@/features/characters/types';
import { TRACK_IDS } from '@/features/characters/types';

/**
 * Single source of truth for the five pirate identities.
 *
 * Visual identity only — palette, emblem and artwork. Result-card copy lives in
 * `@/content/tracks` so the two can be reviewed independently.
 *
 * Palettes are the exact track themes from
 * `assests/UI/gdgoc-pirate-personality-spec/shared-design-state.json`, and the
 * artwork dimensions are the real intrinsic size of the supplied PNGs in
 * `public/assets/characters/` (copied from `assests/Characters/`). Declaring
 * them here is what keeps the result-card export free of layout shift.
 */

/**
 * Intrinsic pixel size of every supplied character PNG.
 *
 * Measured, not assumed: all five shipped exports are 1024×1536 (2:3 portrait).
 * The shipped artwork is not square, so any square assumption in a card frame
 * will letterbox or overflow.
 */
export const CHARACTER_ARTWORK_SIZE = {
  width: 1024,
  height: 1536,
} as const;

export const CHARACTERS: Record<TrackId, CharacterDefinition> = {
  'software-engineering': {
    id: 'software-engineering',
    title: 'The Lead Engineer',
    titleAr: 'المهندس القائد',
    trackName: 'Software Engineering',
    trackNameAr: 'هندسة البرمجيات',
    tagline: 'The pirate who builds what keeps the expedition alive.',
    personalityAr: 'بتحب تفهم الحاجة شغالة إزاي من جوا، وتبني حلول تعيش وتستحمل.',
    palette: {
      vivid: '#F45361',
      deep: '#3D101E',
      wash: 'rgba(255, 77, 101, 0.32)',
      glow: 'rgba(255, 77, 101, 0.32)',
    },
    emblem: 'gear',
    motifs: ['Gear', 'Code scroll', 'Ship mechanisms', 'Strong structures'],
    artwork: {
      src: '/assets/characters/software-engineering.png',
      ...CHARACTER_ARTWORK_SIZE,
      alt: 'قرصان القائد بزي أحمر ومظلة سوداء عليها ترس، وحزام أدوات، ولفافة كود',
    },
    discoveryNoteAr: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },

  ai: {
    id: 'ai',
    title: 'The AI Wizard',
    titleAr: 'ساحر الذكاء',
    trackName: 'Artificial Intelligence',
    trackNameAr: 'الذكاء الاصطناعي',
    tagline: 'The pirate who imagines possibilities beyond the horizon.',
    personalityAr: 'فضولي، بتحب تجرب أفكار جديدة، وتشوف إزاي تخلي الحاجات أذكى.',
    palette: {
      vivid: '#66BAFF',
      deep: '#0C2C64',
      wash: 'rgba(53, 148, 255, 0.38)',
      glow: 'rgba(53, 148, 255, 0.38)',
    },
    emblem: 'robot',
    motifs: ['Robot companion', 'Blue energy', 'Futuristic interfaces', 'Distant stars'],
    artwork: {
      src: '/assets/characters/ai.png',
      ...CHARACTER_ARTWORK_SIZE,
      alt: 'قرصان ساحر بزي أزرق ونظارة، ماسك كرة ذكاء اصطناعي مضيئة',
    },
    discoveryNoteAr: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },

  'web-development': {
    id: 'web-development',
    title: 'The Navigator',
    titleAr: 'الملّاح',
    trackName: 'Web Development',
    trackNameAr: 'تطوير الويب',
    tagline: 'The pirate who turns ideas into experiences everyone can explore.',
    personalityAr: 'بتحب تحوّل الأفكار لحاجات الناس تقدر تشوفها وتستخدمها وتتفاعل معاها.',
    palette: {
      vivid: '#FFA35D',
      deep: '#56270D',
      wash: 'rgba(255, 134, 54, 0.32)',
      glow: 'rgba(255, 134, 54, 0.32)',
    },
    emblem: 'globe',
    motifs: ['Globe', 'Web interface', 'Compass', 'Connected routes'],
    artwork: {
      src: '/assets/characters/web-development.png',
      ...CHARACTER_ARTWORK_SIZE,
      alt: 'كابتن قرصان بزي برتقالي وشريطي برتقالي متطايرين',
    },
    discoveryNoteAr: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },

  'data-science': {
    id: 'data-science',
    title: 'The Cartographer',
    titleAr: 'رسّام الخرائط',
    trackName: 'Data Science',
    trackNameAr: 'علم البيانات',
    tagline: 'The pirate who finds meaning hidden inside the maps.',
    personalityAr:
      'بتحب تلاحظ التفاصيل، وتدور على patterns، وتطلع معنى من حاجات ممكن غيرك ميلاحظهاش.',
    palette: {
      vivid: '#C27BFF',
      deep: '#30124C',
      wash: 'rgba(184, 90, 255, 0.35)',
      glow: 'rgba(184, 90, 255, 0.35)',
    },
    emblem: 'chart',
    motifs: ['Charts', 'Map documents', 'Coordinates', 'Constellations'],
    artwork: {
      src: '/assets/characters/data-science.png',
      ...CHARACTER_ARTWORK_SIZE,
      alt: 'قرصان بنسجي بقبعة عريضة، ماسك لوحية بيانية مضيئة',
    },
    discoveryNoteAr: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },

  cybersecurity: {
    id: 'cybersecurity',
    title: 'The Guardian',
    titleAr: 'الحارس',
    trackName: 'Cybersecurity',
    trackNameAr: 'الأمن السيبراني',
    tagline: 'The pirate who protects the crew from hidden threats.',
    personalityAr: 'بتحب تكتشف الخطر بدري، وتفهم الثغرات، وتحمي اللي الفريق بيبنيه.',
    palette: {
      vivid: '#78DAA0',
      deep: '#123A27',
      wash: 'rgba(77, 223, 148, 0.32)',
      glow: 'rgba(77, 223, 148, 0.32)',
    },
    emblem: 'shield',
    motifs: ['Shield', 'Lock', 'Mask', 'Defensive barriers'],
    artwork: {
      src: '/assets/characters/cybersecurity.png',
      ...CHARACTER_ARTWORK_SIZE,
      alt: 'قرصان أخضر بقناع، ماسك ورقة كود خضراء مضيئة',
    },
    discoveryNoteAr: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },
};

export const CHARACTER_LIST: readonly CharacterDefinition[] = TRACK_IDS.map((id) => CHARACTERS[id]);

export const DEFAULT_DEMO_TRACK: TrackId = 'cybersecurity';

export function isTrackId(value: unknown): value is TrackId {
  return typeof value === 'string' && (TRACK_IDS as readonly string[]).includes(value);
}

export function getCharacter(id: TrackId): CharacterDefinition {
  return CHARACTERS[id];
}

/**
 * A secondary affinity is only rendered when content supplies one, so a
 * missing value must never fall back to a hard-coded pairing.
 */
export function getSecondaryCharacter(id: TrackId | null | undefined): CharacterDefinition | null {
  if (!id) return null;
  return CHARACTERS[id];
}

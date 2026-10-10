import type { CharacterDefinition, TrackId } from '@/features/characters/types';
import { TRACK_IDS } from '@/features/characters/types';

/**
 * Single source of truth for the five pirate identities.
 *
 * To ship the production artwork, drop the isolated transparent files into
 * `public/assets/characters/` and point `artwork.src` at them — nothing else in
 * the app needs to change. See README → "Adding the real character artwork".
 */
export const CHARACTERS: Record<TrackId, CharacterDefinition> = {
  'software-engineering': {
    id: 'software-engineering',
    title: 'The Shipwright',
    titleAr: 'بنّاء السفن',
    trackName: 'Software Engineering',
    tagline: 'The pirate who builds what keeps the expedition alive.',
    personalityAr: 'بتحب تفهم الحاجة شغالة إزاي من جوا، وتبني حلول تعيش وتستحمل.',
    palette: {
      vivid: '#d33a2c',
      deep: '#8e2318',
      wash: 'rgba(211, 58, 44, 0.14)',
    },
    emblem: 'gear',
    motifs: ['Gear', 'Code scroll', 'Ship mechanisms', 'Strong structures'],
    artwork: {
      src: '/assets/characters/software-engineering.png',
      width: 608,
      height: 1012,
      alt: 'قرصان أحمر بيمسك لفافة كود ومعمول gears معدنية',
    },
    discoveryNoteAr: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },

  ai: {
    id: 'ai',
    title: 'The Oracle',
    titleAr: 'العرّافة الآلية',
    trackName: 'Artificial Intelligence',
    tagline: 'The pirate who imagines possibilities beyond the horizon.',
    personalityAr: 'فضولي، بتحب تجرب أفكار جديدة، وتشوف إزاي تخلي الحاجات أذكى.',
    palette: {
      vivid: '#2e86de',
      deep: '#12508c',
      wash: 'rgba(46, 134, 222, 0.14)',
    },
    emblem: 'robot',
    motifs: ['Robot companion', 'Blue energy', 'Futuristic interfaces', 'Distant stars'],
    artwork: {
      src: '/assets/characters/ai.png',
      width: 576,
      height: 960,
      alt: 'قرصانة زرقاء مستقبلية مع روبوت صغير بيطفو جنبها',
    },
    discoveryNoteAr: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },

  'web-development': {
    id: 'web-development',
    title: 'The Navigator',
    titleAr: 'الملّاح',
    trackName: 'Web Development',
    tagline: 'The pirate who turns ideas into experiences everyone can explore.',
    personalityAr: 'بتحب تحوّل الأفكار لحاجات الناس تقدر تشوفها وتستخدمها وتتفاعل معاها.',
    palette: {
      vivid: '#e88b22',
      deep: '#94520a',
      wash: 'rgba(232, 139, 34, 0.16)',
    },
    emblem: 'globe',
    motifs: ['Globe', 'Web interface', 'Compass', 'Connected routes'],
    artwork: {
      src: '/assets/characters/web-development.png',
      width: 474,
      height: 962,
      alt: 'كابتن قرصان برتقالي بعلم الأرض وشاشة واجهة',
    },
    discoveryNoteAr: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },

  'data-science': {
    id: 'data-science',
    title: 'The Cartographer',
    titleAr: 'رسّام الخرائط',
    trackName: 'Data Science',
    tagline: 'The pirate who finds meaning hidden inside the maps.',
    personalityAr:
      'بتحب تلاحظ التفاصيل، وتدور على patterns، وتطلع معنى من حاجات ممكن غيرك ميلاحظهاش.',
    palette: {
      vivid: '#8e44c4',
      deep: '#56297f',
      wash: 'rgba(142, 68, 196, 0.14)',
    },
    emblem: 'chart',
    motifs: ['Charts', 'Map documents', 'Coordinates', 'Constellations'],
    artwork: {
      src: '/assets/characters/data-science.png',
      width: 532,
      height: 992,
      alt: 'قرصان بنفسجي بنظارة وخرائط ورسوم بيانية',
    },
    discoveryNoteAr: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },

  cybersecurity: {
    id: 'cybersecurity',
    title: 'The Guardian',
    titleAr: 'الحارس',
    trackName: 'Cybersecurity',
    tagline: 'The pirate who protects the crew from hidden threats.',
    personalityAr: 'بتحب تكتشف الخطر بدري، وتفهم الثغرات، وتحمي اللي الفريق بيبنيه.',
    palette: {
      vivid: '#22a850',
      deep: '#146238',
      wash: 'rgba(34, 168, 80, 0.14)',
    },
    emblem: 'shield',
    motifs: ['Shield', 'Lock', 'Mask', 'Defensive barriers'],
    artwork: {
      src: '/assets/characters/cybersecurity.png',
      width: 540,
      height: 972,
      alt: 'قرصان أخضر بقناع ودرع بلوحة قفل',
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
 * A secondary affinity is only rendered when the engine supplies one, so a
 * missing value must never fall back to a hard-coded pairing.
 */
export function getSecondaryCharacter(id: TrackId | null | undefined): CharacterDefinition | null {
  if (!id) return null;
  return CHARACTERS[id];
}

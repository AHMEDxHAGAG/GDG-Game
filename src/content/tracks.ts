import { TRACK_IDS, type TrackId } from '@/features/characters/types';

/**
 * Result copy rewritten in Egyptian Arabic. Persona identities and secondary
 * pairings come from the original references; rewritten prose is `authored`.
 * `spec` is reserved for content reproduced verbatim from an approved reference.
 */
export type ContentSource = 'spec' | 'authored';

export interface TrackTraits {
  readonly eyebrow: string;
  readonly personaTitleAr: string;
  readonly trackSubtitleAr: string;
  readonly taglineAr: string;
  readonly strengthTitleAr: string;
  readonly strengthAr: string;
  readonly traitsTitleAr: string;
  readonly traits: readonly [string, string, string, string];
  readonly secondaryTrackId: TrackId;
  readonly secondaryEyebrowAr: string;
  readonly secondaryDescriptionAr: string;
  readonly contentSource: ContentSource;
}

export const TRACK_CONTENT: Record<TrackId, TrackTraits> = {
  'software-engineering': {
    eyebrow: 'شخصيتك هي',
    personaTitleAr: 'المهندس القائد',
    trackSubtitleAr: 'مسار هندسة البرمجيات',
    taglineAr: 'بتحب تبني حاجة شغّالة وتظبط تفاصيلها.',
    strengthTitleAr: 'إيه اللي بيميزك؟',
    strengthAr: 'بتعرف تقسّم الفكرة المعقدة لخطوات وتحوّلها لنظام شغّال نقدر نعتمد عليه.',
    traitsTitleAr: 'طريقتك في الشغل',
    traits: [
      'بتفكّر خطوة بخطوة',
      'بتحب تفهم سبب المشكلة قبل ما تصلّحها',
      'بتهتم إن الحل يفضل شغّال مع الوقت',
      'بتعرف تقسّم الشغل وتشتغل مع فريق',
    ],
    secondaryTrackId: 'web-development',
    secondaryEyebrowAr: 'مسار تاني ممكن يعجبك',
    secondaryDescriptionAr:
      'لو بتحب تحوّل الأفكار لحاجات الناس تستخدمها، ممكن تطوير الويب يعجبك كمان.',
    contentSource: 'authored',
  },

  ai: {
    eyebrow: 'شخصيتك هي',
    personaTitleAr: 'ساحر الذكاء',
    trackSubtitleAr: 'مسار الذكاء الاصطناعي',
    taglineAr: 'بتحب تجرّب أفكار جديدة وتشوف ممكن تعمل إيه.',
    strengthTitleAr: 'إيه اللي بيميزك؟',
    strengthAr: 'بتحب تجمع بين الأفكار الجديدة والتكنولوجيا عشان تلاقي حلول تفيد الناس.',
    traitsTitleAr: 'طريقتك في الشغل',
    traits: [
      'بتدور على طرق جديدة لحل نفس المشكلة',
      'بتحب تجرّب وتتعلم من النتيجة',
      'بتسأل لو فيه حل غير اللي متعودين عليه',
      'بتتابع التكنولوجيا وبتفكّر ممكن تستخدمها في إيه',
    ],
    secondaryTrackId: 'data-science',
    secondaryEyebrowAr: 'مسار تاني ممكن يعجبك',
    secondaryDescriptionAr:
      'لو بتحب تفهم النماذج بتتعلم إزاي، علم البيانات ممكن يساعدك تفهم البيانات اللي بتتبني عليها.',
    contentSource: 'authored',
  },

  'web-development': {
    eyebrow: 'شخصيتك هي',
    personaTitleAr: 'الملّاح',
    trackSubtitleAr: 'مسار تطوير الويب',
    taglineAr: 'بتحوّل الأفكار لمواقع الناس تعرف تستخدمها.',
    strengthTitleAr: 'إيه اللي بيميزك؟',
    strengthAr: 'بتعرف تحوّل الفكرة لواجهة واضحة وسهلة في الاستخدام.',
    traitsTitleAr: 'طريقتك في الشغل',
    traits: [
      'بتفكّر في اللي هيستخدم الموقع من البداية',
      'بتهتم بالشكل والتفاصيل',
      'بتحب الشكل يبقى حلو والاستخدام يبقى سهل',
      'بتعرف تشرح شغلك ببساطة',
    ],
    secondaryTrackId: 'software-engineering',
    secondaryEyebrowAr: 'مسار تاني ممكن يعجبك',
    secondaryDescriptionAr:
      'لو حابب تفهم الكود اللي بيشغّل الموقع من ورا الواجهة، جرّب هندسة البرمجيات كمان.',
    contentSource: 'authored',
  },

  'data-science': {
    eyebrow: 'شخصيتك هي',
    personaTitleAr: 'رسّام الخرائط',
    trackSubtitleAr: 'مسار علم البيانات',
    taglineAr: 'بتدور وسط الأرقام على حاجة توضّح الصورة.',
    strengthTitleAr: 'إيه اللي بيميزك؟',
    strengthAr: 'بتعرف تطلع من البيانات معلومات تساعد الناس تاخد قرار أوضح.',
    traitsTitleAr: 'طريقتك في الشغل',
    traits: [
      'بتاخد بالك من تفاصيل ممكن غيرك يفوّتها',
      'بتدي نفسك وقت تفهم الأرقام كويس',
      'بتدور على الحاجات اللي بتتكرر في البيانات',
      'بتراجع الأرقام قبل ما تحكم',
    ],
    secondaryTrackId: 'ai',
    secondaryEyebrowAr: 'مسار تاني ممكن يعجبك',
    secondaryDescriptionAr:
      'فهمك للبيانات ممكن يفيدك لو حابب تجرّب نماذج ذكاء اصطناعي وتفهم بتتعلم إزاي.',
    contentSource: 'authored',
  },

  cybersecurity: {
    eyebrow: 'شخصيتك هي',
    personaTitleAr: 'الحارس',
    trackSubtitleAr: 'مسار الأمن السيبراني',
    taglineAr: 'بتلاحظ المخاطر بدري وتفكّر إزاي تتفاداها.',
    strengthTitleAr: 'إيه اللي بيميزك؟',
    strengthAr: 'بتعرف تلاحظ الثغرات وتفكّر إزاي تحمي شغل الفريق قبل ما تحصل مشكلة.',
    traitsTitleAr: 'طريقتك في الشغل',
    traits: [
      'بتسأل وبتتأكد قبل ما تثق',
      'بتفكّر إيه اللي ممكن يحصل غلط',
      'بتهتم بالصلاحيات والتفاصيل الصغيرة',
      'بتاخد خصوصية المعلومات بجدية',
    ],
    secondaryTrackId: 'software-engineering',
    secondaryEyebrowAr: 'مسار تاني ممكن يعجبك',
    secondaryDescriptionAr:
      'لو بتحب تفهم الأنظمة عشان تحميها، هندسة البرمجيات ممكن تساعدك تبنيها بشكل أأمن من البداية.',
    contentSource: 'authored',
  },
};

/** Eyebrow shown above the question counter, per the spec's quiz screen. */
export const QUIZ_COUNTER_TEMPLATE = (index: number, total: number): string =>
  `السؤال ${toArabicDigits(index)} من ${toArabicDigits(total)}`;

/**
 * Arabic-Indic digits, because the supplied screenshots use them
 * ("السؤال ٣ من ٨") and the interface is Arabic-first.
 */
export function toArabicDigits(value: number): string {
  return String(value).replace(/[0-9]/g, (digit) => '٠١٢٣٤٥٦٧٨٩'[Number(digit)] ?? digit);
}

/**
 * Uppercase Roman numerals, for the poster's rank line.
 *
 * The reference card sets its rank in Roman (`#1 · IV نقطة`) rather than
 * digits, which is what makes it read like a collector's card rather than a
 * results screen. Scores here are 0–40, so `MM` is never reached and the
 * subtractive forms (`IV`, `IX`) never apply — plain positional digits cover
 * every value the quiz can produce.
 */
const ROMAN: readonly string[] = [
  '',
  'I',
  'II',
  'III',
  'IV',
  'V',
  'VI',
  'VII',
  'VIII',
  'IX',
  'X',
  'XI',
  'XII',
  'XIII',
  'XIV',
  'XV',
  'XVI',
  'XVII',
  'XVIII',
  'XIX',
  'XX',
  'XXI',
  'XXII',
  'XXIII',
  'XXIV',
  'XXV',
  'XXVI',
  'XXVII',
  'XXVIII',
  'XXIX',
  'XXX',
  'XXXI',
  'XXXII',
  'XXXIII',
  'XXXIV',
  'XXXV',
  'XXXVI',
  'XXXVII',
  'XXXVIII',
  'XXXIX',
  'XL',
];

export function toRomanNumerals(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value >= ROMAN.length) return String(value);
  return ROMAN[value] ?? String(value);
}

/** True when every track's copy came from the client-approved spec. */
export function allContentIsSpecApproved(): boolean {
  return TRACK_IDS.every((id) => TRACK_CONTENT[id].contentSource === 'spec');
}

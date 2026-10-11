import { TRACK_IDS, type TrackId } from '@/features/characters/types';

/**
 * Result-card content for each persona.
 *
 * Provenance matters here, so every entry declares where its copy came from:
 *
 *  - `spec` — verbatim from
 *    `assests/UI/gdgoc-pirate-personality-spec/pages/result-card-*.json`.
 *    Only Software Engineering and Artificial Intelligence have approved
 *    references.
 *  - `authored` — written for this build to the same structure, because the
 *    spec supplies no reference for these tracks. These read as real content
 *    in the UI, but they are ours, not the client's.
 *
 * The flag is data, not a comment, so it can be asserted on and surfaced later
 * without anyone having to remember.
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
    taglineAr: 'أنت تبني، تنظم، وتحول الأفكار إلى واقع.',
    strengthTitleAr: 'قوتك الفريدة',
    strengthAr: 'تحويل الأفكار المعقدة إلى أنظمة عملية وموثوقة.',
    traitsTitleAr: 'خصائصك المميزة',
    traits: [
      'تفكر بشكل منطقي ومنهجي',
      'تستمتع بحل المشكلات',
      'تهتم ببناء حلول حقيقية ومستدامة',
      'تعمل بشكل ممتاز ضمن فريق',
    ],
    secondaryTrackId: 'web-development',
    secondaryEyebrowAr: 'المسار المقترح الثانوي',
    secondaryDescriptionAr:
      'لديك شغف بالبناء، وقد تستمتع بتحويل الأفكار إلى تجارب تفاعلية يستخدمها الجميع.',
    contentSource: 'spec',
  },

  ai: {
    eyebrow: 'شخصيتك هي',
    personaTitleAr: 'ساحر الذكاء',
    trackSubtitleAr: 'مسار الذكاء الاصطناعي',
    taglineAr: 'أنت تستكشف، تتخيل، وتصنع حلولاً أذكى.',
    strengthTitleAr: 'قوتك الفريدة',
    strengthAr: 'دمج الإبداع والتقنية لصناعة حلول ذكية ومبتكرة.',
    traitsTitleAr: 'خصائصك المميزة',
    traits: [
      'تبحث دائماً عن طرق جديدة',
      'تتحمس للتجربة والتعلم',
      'تفكر خارج الصندوق',
      'تهتم بتأثير التكنولوجيا على المستقبل',
    ],
    secondaryTrackId: 'data-science',
    secondaryEyebrowAr: 'المسار المقترح الثانوي',
    secondaryDescriptionAr: 'لديك فضول لفهم الأنماط واكتشاف المعرفة من البيانات.',
    contentSource: 'spec',
  },

  'web-development': {
    eyebrow: 'شخصيتك هي',
    personaTitleAr: 'الملّاح',
    trackSubtitleAr: 'مسار تطوير الويب',
    taglineAr: 'أنت تصنع، وتجعل كل فكرة في متناول الجميع.',
    strengthTitleAr: 'قوتك الفريدة',
    strengthAr: 'تحويل الأفكار إلى تجارب يستخدمها الناس بسهولة.',
    traitsTitleAr: 'خصائصك المميزة',
    traits: [
      'تصمم من منظور أول مستخدم',
      'تهتم بالتفاصيل البصرية',
      'تحب التخليط بين الجمال والوظيفة',
      'تقدر تشرح شغلك لأي حد',
    ],
    secondaryTrackId: 'software-engineering',
    secondaryEyebrowAr: 'المسار المقترح الثانوي',
    secondaryDescriptionAr:
      'بهمك بالواجهات يخليك قريب من الكود نفسه، فممكن تستمتع تبني الأنظمة اللي ورا اللي الناس بتشوفه.',
    contentSource: 'authored',
  },

  'data-science': {
    eyebrow: 'شخصيتك هي',
    personaTitleAr: 'رسّام الخرائط',
    trackSubtitleAr: 'مسار علم البيانات',
    taglineAr: 'أنت تلاحظ، وتقرأ، وتستخرج المعنى من الفوضى.',
    strengthTitleAr: 'قوتك الفريدة',
    strengthAr: 'تحويل الأرقام الغامضة إلى قرارات واضحة.',
    traitsTitleAr: 'خصائصك المميزة',
    traits: [
      'تلاحظ التفاصيل الصغيرة',
      'صبور في التفاصيل',
      'تحب رسم الأنماط',
      'تثق بالبيانات قبل الخرائط',
    ],
    secondaryTrackId: 'ai',
    secondaryEyebrowAr: 'المسار المقترح الثانوي',
    secondaryDescriptionAr:
      'فهمك للأنماط هيديك أساس ممتاز لو هتبني نماذج ذكاء اصطناعي تتعلم من البيانات نفسها.',
    contentSource: 'authored',
  },

  cybersecurity: {
    eyebrow: 'شخصيتك هي',
    personaTitleAr: 'الحارس',
    trackSubtitleAr: 'مسار الأمن السيبراني',
    taglineAr: 'أنت تنتبه، وتحمي، وتفكّر قبل ما تفتح الباب.',
    strengthTitleAr: 'قوتك الفريدة',
    strengthAr: 'كشف الخطر مبكراً وحماية كل ما يبنيه الفريق.',
    traitsTitleAr: 'خصائصك المميزة',
    traits: [
      'شكوك صحي في كل شيء',
      'تفكّر في أسوأ سيناريو',
      'تحب التحكم في التفاصيل',
      'حريص على سرية المعلومات',
    ],
    secondaryTrackId: 'software-engineering',
    secondaryEyebrowAr: 'المسار المقترح الثانوي',
    secondaryDescriptionAr:
      'عينك على المخاطر هتخليك متبني أنظمة متينة من الأول، وده أساس قوي في هندسة البرمجيات.',
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

/** True when every track's copy came from the client-approved spec. */
export function allContentIsSpecApproved(): boolean {
  return TRACK_IDS.every((id) => TRACK_CONTENT[id].contentSource === 'spec');
}

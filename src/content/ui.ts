import { site } from '@/config/site';
import { toArabicDigits, toRomanNumerals } from '@/content/tracks';
import { QUESTION_COUNT } from '@/features/quiz/types';
import type { RoomErrorCode } from '@/features/teams/types';

/**
 * All user-facing copy that is not track content or question content.
 *
 * Keeping it here means a copy edit never means hunting through JSX, and it
 * keeps components free of hardcoded strings.
 *
 * Numbers in visible strings go through `toArabicDigits` because the interface
 * is Arabic-first and the supplied screenshots use Arabic-Indic digits
 * ("السؤال ٣ من ٨").
 */

const questionCount = toArabicDigits(QUESTION_COUNT);

export const ui = {
  locale: {
    /** Locale chip in the landing header. Static — the app is Arabic-only. */
    code: 'AR',
  },

  brand: {
    mark: '</>',
    organization: 'GDGoC',
    campus: 'AASTMT ASWAN',
    organizationLong: site.organizationLong,
  },

  landing: {
    headlineLines: ['اكتشف', 'شخصيتك'],
    subheadline: 'أنهي مسار في GDGoC يناسبك؟',
    description: `جاوب على ${questionCount} أسئلة وشوف المسار الأقرب ليك.`,
    primaryCta: 'ابدأ الاختبار',
    secondaryCta: 'شوف المسارات',
    charactersLabel: 'خمس شخصيات لمسارات GDGoC',
    presentLink: 'شاشة العرض',
  },

  username: {
    label: 'اسمك على الكارت إيه؟',
    placeholder: 'اكتب الاسم اللي تحب يظهر',
    optional: 'اختياري',
    skip: 'من غير اسم',
    hint: 'الاسم هيظهر على الكارت بس.',
  },

  resume: {
    title: 'عندك اختبار لسه مخلصتوش',
    body: 'تحب تكمل من مكان ما وقفت، ولا تبدأ من الأول؟',
    continue: 'كمل الاختبار',
    restart: 'ابدأ من الأول',
    progress: (answered: number): string =>
      `جاوبت على ${toArabicDigits(answered)} من ${questionCount} أسئلة`,
  },

  quiz: {
    counter: (index: number, total: number): string =>
      `السؤال ${toArabicDigits(index)} من ${toArabicDigits(total)}`,
    progressLabel: 'وصلت لفين في الأسئلة',
    previous: 'اللي فات',
    next: 'كمّل',
    submit: 'شوف النتيجة',
    questionHeading: 'السؤال',
    optionsLegend: 'اختار إجابة واحدة',
    selectedMark: 'اخترت الإجابة دي',
    /** Announced when the quiz moves to a new question. */
    questionChanged: (index: number, total: number): string =>
      `السؤال ${toArabicDigits(index)} من ${toArabicDigits(total)}`,
    hint: 'مفيش صح وغلط. اختار الإجابة الأقرب ليك.',
  },

  analyzing: {
    headline: 'بنحسب نتيجتك…',
    description: 'بنرتّب المسارات حسب إجاباتك.',
    statusLabel: 'بنحسب نتيجتك، استنى لحظة.',
    footnote: 'النتيجة بتتحسب على جهازك. إجاباتك مش بتتبعت لحد.',
  },

  matches: {
    title: 'ترتيب شخصياتك',
    subtitle: 'اختار الشخصية اللي شايفها أقرب ليك',
    legend: 'الشخصيات مترتبة حسب إجاباتك',
    scoreLabel: (score: number): string => `${toArabicDigits(score)} نقطة`,
    /**
     * The poster's rank line. Roman numerals rather than digits, matching the
     * reference card — it is the one number on the card that reads as a keepsake
     * rather than a results screen.
     */
    posterRankLabel: (score: number): string =>
      `${toRomanNumerals(score)} نقطة`,
    select: 'اختار',
    /** Marks the top-ranked row before any choice is made. */
    best: 'أعلى نتيجة',
    /** Shown after the visitor has committed to a persona. */
    chosen: 'اختيارك',
    footnote: 'ده اقتراح حسب إجاباتك. تقدر تختار المسار اللي تحبه.',
    backToQuiz: 'ارجع للأسئلة',
    empty: 'لسه مفيش نتيجة. كمّل الاختبار الأول.',
  },

  result: {
    shareCta: 'شارك النتيجة',
    galleryCta: 'شوف المسارات',
    restartCta: 'جرّب تاني',
    backToMatchesCta: 'ارجع للترتيب',
    encouragement: 'النتيجة اقتراح، مش قرار. جرّب أي مسار يعجبك.',
  },

  card: {
    eyebrow: 'شخصيتك',
    usernamePrefix: 'اسمك:',
    traitsHeading: 'طريقتك في الشغل',
    strengthHeading: 'إيه اللي بيميزك؟',
    secondaryHeading: 'مسار تاني ممكن يعجبك',
    /** Latin-only, rendered with dir="ltr" on the exported poster. */
    exportWordmark: 'GDGoC · AASTMT ASWAN',
  },

  actions: {
    save: 'احفظ الكارت',
    saving: 'بنجهّز الكارت…',
    saved: 'الكارت اتحمّل',
    share: 'شارك شخصيتك',
    shareUnavailable: 'المتصفح ده مش بيدعم المشاركة. هننزّل الكارت كصورة.',
    exportFailed: 'معرفناش نجهّز الصورة. جرّب متصفح تاني، أو خد سكرين شوت للكارت.',
    tryAgain: 'جرّب تاني',
    copied: 'اللينك اتنسخ',
    copyFailed: 'معرفناش ننسخ اللينك',
  },

  gallery: {
    title: 'مسارات GDGoC',
    subtitle: 'شوف الشخصيات الخمسة والمسارات بتاعتها',
    close: 'ارجع لنتيجتي',
    previous: 'المسار اللي فات',
    next: 'المسار اللي بعده',
    swipeHint: 'اسحب عشان تشوف باقي المسارات',
    position: (index: number): string => `${toArabicDigits(index + 1)} من ${toArabicDigits(5)}`,
    browse: 'اختار شخصية',
  },

  present: {
    headline: 'شوف أنهي مسار يناسبك',
    sub: `جاوب على ${questionCount} أسئلة واعرف المسار الأقرب ليك.`,
    scan: 'Scan the QR Code',
    steps: [
      'افتح الكاميرا وامسح الكود',
      `جاوب على ${questionCount} أسئلة اختيار من متعدد`,
      'اختار الشخصية الأقرب ليك وشارك الكارت',
    ],
  },

  identity: {
    /** Above the visitor's name on the team hub. */
    labelled: 'باسم',
    loading: 'بنجيب بياناتك…',
  },

  teams: {
    createGroupsTitle: 'اعمل فريق',
    createGroupsSubtitle: 'كوّن فريق مع أصحابك، أو ادخل فريق موجود',

    askNameTitle: 'اسمك إيه؟',
    askNameBody: 'محتاجين اسم عشان نعرفك في الروم. من غير حساب ولا باسورد.',
    askNameLabel: 'اسمك',
    askNamePlaceholder: 'اكتب اسمك',
    askNameCta: 'تمام',

    createOptionTitle: 'اعمل روم',
    createOptionBody: 'اكتب اسم للروم وخد الكود وابعته لأصحابك.',
    createCta: 'اعمل روم',

    joinOptionTitle: 'ادخل روم',
    joinOptionBody: 'اكتب الكود اللي صاحبك بعتلك وادخل على طول.',
    joinCta: 'ادخل الروم',
    joinPlaceholder: 'الكود من ٦ حروف',
    joinHint: 'الكود بيبدأ بحرفين ورقم، زي A3F9B2.',

    nameLabel: 'اسم الروم',
    namePlaceholder: 'زي: طاقم القبطان',
    nameMax: 'أعلى ٢٤ حرف',

    noAccountNote: 'من غير حساب. الاسم بس، وبيتتسجل على جهازك.',

    createTeamCta: 'اعمل فريق',
    createTeamHint: 'كوّن فريق مع أصحابك وشارك المسارات بتاعتكم.',

    roomTitle: 'روم الفريق',
    memberCount: (filled: number, total: number): string =>
      `${toArabicDigits(filled)} من ${toArabicDigits(total)} في الروم`,
    emptySlots: 'لسه فيه مكان',
    ownerBadge: 'صاحب الروم',
    youBadge: 'أنت',
    shareCodeLabel: 'كود الروم',
    shareCodeHint: 'بعت الكود ده لحد أصحابك يدخل بيه.',
    copyCode: 'انسخ الكود',
    copied: 'الكود اتنسخ',
    copyFailed: 'معرفناش ننسخ الكود',
    renameCta: 'غيّر اسم الروم',
    renameSave: 'احفظ الاسم',
    renameCancel: 'إلغاء',
    leaveCta: 'اترك الروم',
    backToGroups: 'ارجع للفرق',

    notReadyTitle: 'خلّص الاختبار الأول',
    notReadyBody: 'لازم تختار شخصية من ترتيب المسارات قبل ما تعمل أو تدخل روم.',
    notReadyCta: 'ارجع للترتيب',

    notConfiguredTitle: 'الروم مش متاحة دلوقتي',
    notConfiguredBody:
      'مفيش مشروع Supabase متظبّط، فالاسم مش بيتسجل. سيب الاختبار عادي وكمل.',

    notFoundTitle: 'مالهاش روم',
    notFoundBody: 'مفيش روم بالكود ده. اتأكد منه وجرّب تاني.',
    badCodeBody: 'الكود لازم يكون ٦ حروف زي A3F9B2. اتأكد منه وجرّب تاني.',
    notFoundCta: 'ارجع للفرق',
  },

  teamErrors: {
    unknown_visitor: 'اكتب اسمك الأول عشان نعرفك.',
    invalid_name: 'الاسم قصير أوي. اكتب حرف على الأقل.',
    invalid_code: 'الكود لازم يكون ٦ حروف من أرقام وحروف إنجليزية.',
    room_not_found: 'مالهاش روم بالكود ده. اتأكد من الكود وجرّب تاني.',
    room_full: 'الروم كاملة — أربع ناس max. جرّب روم تانية.',
    already_joined: 'أنت داخل الروم دي خلاص.',
    not_room_owner: 'الاسم ده يغيره صاحب الروم بس.',
    unexpected: 'حصلت مشكلة. جرّب تاني.',
  } as Record<RoomErrorCode, string>,

  footer: {
    reset: 'امسح إجاباتي من الجهاز',
    resetDone: 'إجاباتك اتمسحت. تقدر تبدأ من الأول.',
  },

  errors: {
    genericTitle: 'حصلت مشكلة',
    genericBody: 'جرّب تاني. لو المشكلة لسه موجودة، امسح إجاباتك وابدأ من الأول.',
    retry: 'جرّب تاني',
    reset: 'ابدأ من الأول',
    notFound: 'الصفحة دي مش موجودة',
    notFoundBody: 'الصفحة اللي بتدور عليها مش موجودة. ارجع للرئيسية عشان تبدأ من الأول.',
    backHome: 'ارجع للرئيسية',
    missingResult: 'لسه مفيش نتيجة. كمّل الاختبار الأول.',
    missingResultCta: 'كمّل الاختبار',
  },
} as const;

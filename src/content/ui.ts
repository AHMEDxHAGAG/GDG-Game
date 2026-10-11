import { site } from '@/config/site';
import { toArabicDigits } from '@/content/tracks';
import { QUESTION_COUNT } from '@/features/quiz/types';

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
    subheadline: 'أي مسار في GDGoC يناسبك؟',
    description: `أجب على ${questionCount} أسئلة واكتشف الـ Builder الذي بداخلك`,
    primaryCta: 'ابدأ الاختبار',
    secondaryCta: 'شوف المسارات',
    charactersLabel: 'خمسة قراصنة يمثلون مسارات GDGoC الخمسة',
    presentLink: 'شاشة العرض',
  },

  username: {
    label: 'اسمك على الكارت إيه؟',
    placeholder: 'اسمك أو اللقب اللي تحبه',
    optional: 'اختياري',
    skip: 'مش هكتب',
    hint: 'الاسم بيظهر على الكارت بس — مش بنبعتله أي حاجة.',
  },

  resume: {
    title: 'عندك اختبار لسه مخلصتوش',
    body: 'تحب تكمل من حيث وقفت، ولا تبدأ من الأول؟',
    continue: 'كمل الاختبار',
    restart: 'ابدأ من الأول',
    progress: (answered: number): string =>
      `جاوبت على ${toArabicDigits(answered)} من ${questionCount} أسئلة`,
  },

  quiz: {
    counter: (index: number, total: number): string =>
      `السؤال ${toArabicDigits(index)} من ${toArabicDigits(total)}`,
    progressLabel: 'تقدّم الأسئلة',
    previous: 'السابق',
    next: 'التالي',
    submit: 'اكتشف شخصيتي',
    questionHeading: 'نص السؤال',
    optionsLegend: 'اختار إجابة واحدة',
    selectedMark: 'اخترتها',
    /** Announced when the quiz moves to a new question. */
    questionChanged: (index: number, total: number): string =>
      `السؤال ${toArabicDigits(index)} من ${toArabicDigits(total)}`,
    hint: 'مفيش إجابة صح وغلط — اختار الأنسب ليك.',
  },

  analyzing: {
    headline: 'جاري تحليل إجاباتك...',
    description: 'قريباً هتشوف الشخصيات اللي تناسبك ضمن عالم GDGoC',
    statusLabel: 'جاري تحليل الإجابات، برجاء الانتظار',
    footnote: 'بنحسب النتيجة على جهازك — مفيش حاجة بتتبعت لأي حد.',
  },

  matches: {
    title: 'ترتيب شخصياتك',
    subtitle: 'اختار الشخصية اللي حاسس إنها أقربلك',
    legend: 'شخصياتك مرتبة حسب قربها من إجاباتك',
    scoreLabel: (score: number): string => `${toArabicDigits(score)} نقطة`,
    select: 'اختار',
    /** Marks the top-ranked row before any choice is made. */
    best: 'أعلى نتيجة',
    /** Shown after the visitor has committed to a persona. */
    chosen: 'اخترتها',
    footnote: 'الترتيب ده ترجيح فريق GDGoC على إجاباتك، مش اختيار نهائي.',
    backToQuiz: 'ارجع للأسئلة',
    empty: 'مفيش ترتيب لسه — كمّل الاختبار الأول.',
  },

  result: {
    shareCta: 'مشاركة النتيجة',
    galleryCta: 'شوف المسارات',
    restartCta: 'جرب تاني',
    backToMatchesCta: 'ارجع للترتيب',
    encouragement: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
  },

  card: {
    eyebrow: 'شخصيتك',
    usernamePrefix: 'يا هلا يا',
    traitsHeading: 'خصائصك المميزة',
    strengthHeading: 'قوتك الفريدة',
    secondaryHeading: 'المسار المقترح الثانوي',
    /** Latin-only, rendered with dir="ltr" on the exported poster. */
    exportWordmark: 'GDGoC · AASTMT ASWAN',
  },

  actions: {
    save: 'احفظ الكارت',
    saving: 'بنجهّز الكارت…',
    saved: 'تم تحميل الكارت',
    share: 'شارك شخصيتك',
    shareUnavailable: 'المتصفح ده مش بيدعم المشاركة. هننزّل الكارت صورة بدل كده.',
    exportFailed:
      'مقدرناش نجهّز الصورة على الجهاز ده. جرّب من متصفح تاني، أو خد سكرين شوت من الكارت.',
    tryAgain: 'جرّب تاني',
    copied: 'تم نسخ الرابط',
    copyFailed: 'مقدرناش ننسخ الرابط',
  },

  gallery: {
    title: 'مسارات GDGoC',
    subtitle: 'خمس شخصيات، هدف واحد: نبني معًا مجتمع أقوى',
    close: 'ارجع لنتيجتي',
    browse: 'من فضلك اختار شخصية',
  },

  present: {
    headline: 'مين الـ Builder اللي جواك؟',
    sub: `جاوب على ${questionCount} أسئلة، واختار شخصيتك، وشارك الكارت.`,
    scan: 'Scan the QR Code',
    steps: [
      'افتح الكاميرا وقرا الكود',
      `جاوب على ${questionCount} أسئلة اختيار من متعدد`,
      'اختار شخصيتك من الترتيب، وشارك الكارت',
    ],
  },

  footer: {
    reset: 'امسح الإجابة من الجهاز',
    resetDone: 'اتمسحت. يلا نبدأ من جديد.',
  },

  errors: {
    genericTitle: 'حصلت مشكلة غير متوقعة',
    genericBody: 'جرّب تاني، ولو المشكلة فضلت قايمة امسح الإجابة وابدأ من الأول.',
    retry: 'جرّب تاني',
    reset: 'ابدأ من الأول',
    notFound: 'الصفحة دي مش موجودة',
    notFoundBody: 'ارجع للصفحة الرئيسية وابدأ الرحلة من جديد.',
    backHome: 'ارجع للرئيسية',
    missingResult: 'لسه مفيش نتيجة. كمّل الاختبار الأول.',
    missingResultCta: 'كمّل الاختبار',
  },
} as const;

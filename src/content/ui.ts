import { site } from '@/config/site';

/**
 * All user-facing copy that is not character data or mock dialogue.
 *
 * Keeping it here means a copy edit never means hunting through JSX, and it
 * keeps components free of hardcoded strings.
 */

export const ui = {
  welcome: {
    eyebrow: 'GDGoC · AASTMT Aswan',
    displayTitle: 'Pirate Identity Expedition',
    headline: 'أهلاً بيك في عالم القراصنة!',
    body: 'خمس شخصيات، خمس مغامرات، وكل قرصان ليه طريقته الخاصة.',
    prompt: 'جاهز تكتشف أنت أنهي قرصان؟',
    cta: 'يلا نبدأ المغامرة!',
    hint: 'مفيش إجابات صح وغلط — جاوب بطريقتك.',
    tagline: site.taglineAr,
    taglineEn: site.taglineEn,
  },

  nickname: {
    label: 'نندهلك بإيه يا قرصان؟',
    placeholder: 'اسمك أو اللقب اللي تحبه',
    optional: 'اختياري',
    skip: 'مش هحدد، سميّني اللي تحب',
    hint: 'مش محتاج اسم حقيقي — ولا بيانات تانية.',
  },

  resume: {
    title: 'عندك مغامرة لسه مخلصتهاش!',
    body: 'تحب نكمل من حيث وقفنا، ولا نبدأ من الأول؟',
    continue: 'كمل المغامرة',
    restart: 'ابدأ من الأول',
  },

  chat: {
    captainName: 'الكابتن',
    captainRole: 'قائد الرحلة',
    placeholder: 'اكتب ردك يا قرصان...',
    caption: 'جاوب براحتك، مفيش إجابة صح أو غلط.',
    send: 'إرسال',
    sendHint: 'Enter للإرسال · Shift+Enter لسطر جديد',
    thinking: 'الكابتن بيفكر…',
    thinkingLabel: 'الكابتن بيفكر في ردّه',
    engineNoteMock: 'نسخة تجريبية: مواقف الرحلة مكتوبة، والكابتن بيرد بعبارات عامة من غير ما يحلل كلامك.',
    lockNotice: 'استنى الكابتن يخلص…',
    restart: 'ابدأ من جديد',
    you: 'أنت',
    transcriptLabel: 'حوار الرحلة',
  },

  error: {
    title: 'البدلة ضعفت شوية',
    retry: 'جرب تاني',
    giveUp: 'ارجع لبداية الرحلة',
  },

  boarding: {
    title: 'المركب بتتحرك…',
    body: 'الكابتن بيجهّز الخريطة وبينده على الطاقم. ثانية واحدة ونبدأ.',
    skip: 'ادخل على طول',
  },

  reveal: {
    suspense: ['استنى كده يا قرصان...', 'الكابتن بيراجع رحلتك...', 'واضح إن ليك مكان مميز وسط الطاقم!'],
    chosen: 'THE CAPTAIN HAS CHOSEN…',
    skip: 'تخطّي الكشف',
    resultHeading: 'YOUR PIRATE IDENTITY',
    demoBanner: 'نتيجة تجريبية — الرحلة دي مش بيتم تحليل ردودك فيها.',
    whyHeading: 'ليه الشخصية دي؟',
    sampleExplanationLabel: 'نص توضيحي تجريبي',
    secondaryHeading: 'ممكن يعجبك كمان',
    encouragement: 'دي مجرد بداية المغامرة. تقدر تستكشف أي Track يعجبك!',
    replay: 'إعادة الكشف',
    gallery: 'شوف القراصنة الخمسة',
  },

  actions: {
    share: 'شارك قرصانك',
    save: 'احفظ كارت الشخصية',
    saving: 'بنجهّز الكارت…',
    saved: 'تم تحميل الكارت',
    shareUnavailable: 'المتصفح ده مش بيدعم المشاركة. هننزّل الكارت صورة بدل كده.',
    exportFailed:
      'مقدرناش نجهّز الصورة على الجهاز ده. جرّب من متصفح تاني، أو خد سكرين شوت من الكارت.',
    tryAgain: 'جرّب المغامرة تاني',
  },

  gallery: {
    title: 'قراصنة GDGoC الخمسة',
    body: 'كل Track بيتمثل في شخصية قرصان. اتعرّف عليهم، وشوف مين أقربلها.',
    close: 'ارجع لنتيجتي',
  },

  dev: {
    title: 'أدوات المطور',
    previewLabel: 'معاينة نتيجة:',
    note: 'المعاينة بتتجاوز المحادثة تمامًا — للتطوير فقط.',
    open: 'أدوات',
  },

  present: {
    headline: 'مين القرصان اللي جواك؟',
    sub: 'جاوب على كام موقف مع الكابتن، واكتشف شخصيتك!',
    scan: 'Scan the QR Code',
    steps: [
      'افتح الكاميرا وقرا الكود',
      'جاوب بالعربي أو بالإنجليزي — زي ما تحب',
      'خُد سكرين شوت وشاركها مع أصحابك',
    ],
  },

  footer: {
    reset: 'امسح الرحلة من الجهاز',
    resetDone: 'اتمسحت. يلا نبدأ من جديد.',
  },
} as const;

import type { QuizQuestion } from '@/features/quiz/types';

/**
 * The ten-question personality bank.
 *
 * Design rules this file is built to satisfy — all enforced by
 * `content/questions.test.ts`, not just asserted here:
 *
 *  1. Exactly four options per question, one `primary` each, all four primaries
 *     distinct.
 *  2. Each question names the one track it deliberately omits (`absentTrack`),
 *     and every track is omitted exactly twice. Result: over the whole bank
 *     each track is the primary of exactly 8 options and the secondary of
 *     exactly 8. The quiz cannot favour any track — only the answers can.
 *  3. Secondary affinities follow a fixed neighbour graph:
 *        SE  → WEB, SEC      AI → DATA, WEB     WEB → SE, DATA
 *        DATA → AI,  SEC     SEC → SE,  AI
 *     This matches the spec's own pairings (SE's secondary is WEB, AI's is DATA)
 *     and keeps Software Engineering and Cybersecurity broadly reachable.
 *  4. No option is a "correct" answer. All four are plausible first-person
 *     reactions; they differ only in what they lean towards.
 *
 * Question 3 reproduces the four option texts of the approved spec screenshot
 * verbatim. Its only change is that the data option carries `cybersecurity` as
 * its secondary — the spec flags that its example omits security entirely, and
 * this is the smallest fix that makes security representable while keeping
 * every approved word.
 */
export const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'q1',
    text: 'لسه في أول أسبوع في الجامعة، ومعاك وقت فراغ كبير. أول حاجة هتعملها إيه؟',
    absentTrack: 'cybersecurity',
    options: [
      {
        id: 'q1-build',
        text: 'أبدأ أتعلم لغة برمجة من الصفر وأبني حاجة صغيرة شغّالة من أول يوم.',
        primary: 'software-engineering',
        secondary: 'web-development',
      },
      {
        id: 'q1-ai',
        text: 'أجرّب أدوات الذكاء الاصطناعي وأشوف إيه اللي تقدر تعمله بيه فعلاً.',
        primary: 'ai',
        secondary: 'data-science',
      },
      {
        id: 'q1-web',
        text: 'أعمل صفحة بسيطة فيها اسمي ومعلوماتي وأنشرها على الإنترنت.',
        primary: 'web-development',
        secondary: 'software-engineering',
      },
      {
        id: 'q1-data',
        text: 'أبدأ أنظّم ملفاتي وأشوف البيانات اللي قدامي فيها إيه.',
        primary: 'data-science',
        secondary: 'ai',
      },
    ],
  },
  {
    id: 'q2',
    text: 'محتاج تتعلم موضوع جديد وصعب. إيه الطريقة اللي بتفهم بيها أسرع؟',
    absentTrack: 'data-science',
    options: [
      {
        id: 'q2-theory',
        text: 'أقرأ الشرح النظري الأول، وبعدين أكتب كود بنفسي لحد ما الموضوع يثبت.',
        primary: 'software-engineering',
        secondary: 'web-development',
      },
      {
        id: 'q2-examples',
        text: 'أدوّر على أمثلة عملية وتجارب ناس فاتحينها، وأبني منها صورة واضحة.',
        primary: 'ai',
        secondary: 'data-science',
      },
      {
        id: 'q2-course',
        text: 'أدوّر على كورس عملي وأتعلم بالتمرين على أمثلة جاهزة أعدّل فيها بنفسي.',
        primary: 'web-development',
        secondary: 'data-science',
      },
      {
        id: 'q2-clear',
        text: 'أدوّر على شرح مبسّط يوضّح المفهوم، وأتأكد إن الفهم مظبوط قبل ما أكمّل.',
        primary: 'cybersecurity',
        secondary: 'software-engineering',
      },
    ],
  },
  {
    id: 'q3',
    text: 'يواجه فريقك مشكلة في المنصة الجامعية التي يستخدمها مئات الطلاب، ما هو أول شيء تفكر في القيام به؟',
    absentTrack: 'cybersecurity',
    options: [
      {
        id: 'q3-engineer',
        text: 'أبني حلاً تقنياً موثوقاً يصلح المشكلة من جذورها.',
        primary: 'software-engineering',
        secondary: 'web-development',
      },
      {
        id: 'q3-ai',
        text: 'أستخدم الذكاء الاصطناعي لتقديم حلول ذكية ومبتكرة.',
        primary: 'ai',
        secondary: 'data-science',
      },
      {
        id: 'q3-web',
        text: 'أصمم واجهة سهلة الاستخدام تجعل التجربة أفضل للطلاب.',
        primary: 'web-development',
        secondary: 'software-engineering',
      },
      {
        id: 'q3-data',
        text: 'أحلل البيانات لأفهم سبب المشكلة وأجد الأنماط فيها.',
        primary: 'data-science',
        secondary: 'cybersecurity',
      },
    ],
  },
  {
    id: 'q4',
    text: 'الموعد النهائي بعد يوم، والميزانية خلصت. إيه أول قرار هتاخده؟',
    absentTrack: 'software-engineering',
    options: [
      {
        id: 'q4-assist',
        text: 'أجرّب نموذج ذكاء اصطناعي يسرّع الشغل بدل ما أضيّع وقت في التفاصيل.',
        primary: 'ai',
        secondary: 'data-science',
      },
      {
        id: 'q4-simplify',
        text: 'أبسّط الشغل وأشيل أي حاجة مش ضرورية عشان أسلّم حاجة شغّالة.',
        primary: 'web-development',
        secondary: 'software-engineering',
      },
      {
        id: 'q4-evidence',
        text: 'أرجع للبيانات وأشوف إيه اللي طلع معايا قبل ما أقرر.',
        primary: 'data-science',
        secondary: 'ai',
      },
      {
        id: 'q4-safeguard',
        text: 'أراجع الصلاحيات والنسخ الاحتياطي الأول، عشان أضمن إن مفيش مخاطرة.',
        primary: 'cybersecurity',
        secondary: 'software-engineering',
      },
    ],
  },
  {
    id: 'q5',
    text: 'عايز تعمل حاجة الناس هتستخدمها فعلاً. إيه أول خطوة؟',
    absentTrack: 'ai',
    options: [
      {
        id: 'q5-backend',
        text: 'أكتب الكود اللي ورا الفكرة الأول، وبعدين أتأكد إنه شغّال.',
        primary: 'software-engineering',
        secondary: 'cybersecurity',
      },
      {
        id: 'q5-interface',
        text: 'أصمم شكل الصفحة وأتأكد إن أي حد يقدر يستخدمها من أول مرة.',
        primary: 'web-development',
        secondary: 'software-engineering',
      },
      {
        id: 'q5-who',
        text: 'أبدأ من البيانات: مين المستخدم وإيه اللي محتاج بالظبط.',
        primary: 'data-science',
        secondary: 'cybersecurity',
      },
      {
        id: 'q5-harden',
        text: 'أفترض إن في حد هيستغل أي ثغرة، وأقفل المداخل من أول يوم.',
        primary: 'cybersecurity',
        secondary: 'ai',
      },
    ],
  },
  {
    id: 'q6',
    text: 'نظام شغّال من زمان فجأة بدأ يعطي نتائج غلط، وما الأحمر بتاعه بيقول حاجة مفيدة.',
    absentTrack: 'web-development',
    options: [
      {
        id: 'q6-read-code',
        text: 'أرجع للكود وأفحصه سطر سطر لحد ما ألاقي السبب.',
        primary: 'software-engineering',
        secondary: 'web-development',
      },
      {
        id: 'q6-compare',
        text: 'أجرّب نموذج تاني وأقارن نتايجه بالقديم، وأشوف الفرق.',
        primary: 'ai',
        secondary: 'web-development',
      },
      {
        id: 'q6-collect',
        text: 'أجمع كل البيانات اللي طلعت من غير ما أتوقع، وأدوّر على الأنماط.',
        primary: 'data-science',
        secondary: 'ai',
      },
      {
        id: 'q6-access',
        text: 'أفترض إن حد دخل على حساب غيره، وأراجع سجل الدخول من الأول.',
        primary: 'cybersecurity',
        secondary: 'software-engineering',
      },
    ],
  },
  {
    id: 'q7',
    text: 'في مشروع جماعي، وزميلك مختلف تماماً عنك في طريقة الشغل. إيه بتعمل؟',
    absentTrack: 'data-science',
    options: [
      {
        id: 'q7-split',
        text: 'أقسّم الشغل لمهام واضحة، وكل واحد يلتزم بمهمة بتاعه.',
        primary: 'software-engineering',
        secondary: 'cybersecurity',
      },
      {
        id: 'q7-tool',
        text: 'أجرّب أداة ذكاء اصطناعي تساعدنا نلخص الشغل ونقسمه بسرعة.',
        primary: 'ai',
        secondary: 'web-development',
      },
      {
        id: 'q7-ship',
        text: 'أبني حاجة بسيطة شغّالة الأول، وبعدين نطوّرها مع بعض.',
        primary: 'web-development',
        secondary: 'data-science',
      },
      {
        id: 'q7-ownership',
        text: 'أحدّد إيه مسؤولية كل واحد من الأول، عشان نعرف لو حصل أي خطأ.',
        primary: 'cybersecurity',
        secondary: 'ai',
      },
    ],
  },
  {
    id: 'q8',
    text: 'عندك مشكلة بتظهر وتختفي، ومش قادر تعيدها في أي وقت. بتعمل إيه؟',
    absentTrack: 'software-engineering',
    options: [
      {
        id: 'q8-rephrase',
        text: 'أجرّب أعيد صياغة المشكلة وأقارن إجابات النموذج بأجوبة بشرية.',
        primary: 'ai',
        secondary: 'web-development',
      },
      {
        id: 'q8-replay',
        text: 'أعيد تجربة الخطوات بالظبط زي ما المستخدم عملها، وأشوف بيقف فين.',
        primary: 'web-development',
        secondary: 'data-science',
      },
      {
        id: 'q8-cluster',
        text: 'أجمع كل الحالات اللي المشكلة ظهرت فيها وأدوّر على العامل المشترك.',
        primary: 'data-science',
        secondary: 'ai',
      },
      {
        id: 'q8-who-accessed',
        text: 'أشوف مين وصل للنظام آخر مرة، وأتأكد إن مفيش حد دخل من غيره.',
        primary: 'cybersecurity',
        secondary: 'software-engineering',
      },
    ],
  },
  {
    id: 'q9',
    text: 'لو تقدر تشوف التكنولوجيا بعد ١٠ سنين، هتتمنى إيه اللي حصل؟',
    absentTrack: 'ai',
    options: [
      {
        id: 'q9-scale',
        text: 'أنظمة معمارية كبيرة تقدر تتحمل ضغط الملايين من المستخدمين.',
        primary: 'software-engineering',
        secondary: 'cybersecurity',
      },
      {
        id: 'q9-access',
        text: 'مواقع وتطبيقات تقدر أي حد يستخدمها من غير ما يتعلّم حاجة صعبة.',
        primary: 'web-development',
        secondary: 'data-science',
      },
      {
        id: 'q9-evidence',
        text: 'كل قرار يتاخد على أساس أرقام واضحة مش على تخمين.',
        primary: 'data-science',
        secondary: 'cybersecurity',
      },
      {
        id: 'q9-safe',
        text: 'الأمان في كل حاجة رقمية يبقى الأساس مش إضافة.',
        primary: 'cybersecurity',
        secondary: 'ai',
      },
    ],
  },
  {
    id: 'q10',
    text: 'بعد ما تكبر، عايز الناس تتكلم عنك إيه؟',
    absentTrack: 'web-development',
    options: [
      {
        id: 'q10-built',
        text: 'إنك بنيت حاجات الناس بتستخدمها لسه شغّالة.',
        primary: 'software-engineering',
        secondary: 'cybersecurity',
      },
      {
        id: 'q10-idea',
        text: 'إنك جبت فكرة جديدة للحاجة، وناس تانية اتعلّمت منها.',
        primary: 'ai',
        secondary: 'web-development',
      },
      {
        id: 'q10-insight',
        text: 'إنك كشفت حاجة محدش كان شايفها، وحوّلتها لقرار اتاخد.',
        primary: 'data-science',
        secondary: 'cybersecurity',
      },
      {
        id: 'q10-prevented',
        text: 'إنك كنت السبب إن خرق أمني كبير ما حصلش.',
        primary: 'cybersecurity',
        secondary: 'ai',
      },
    ],
  },
];

export const QUESTION_BY_ID: ReadonlyMap<string, QuizQuestion> = new Map(
  QUESTIONS.map((question) => [question.id, question]),
);

/** Arabic ordinal labels for the ranked-matches screen. */
export const RANK_LABELS_AR: readonly string[] = [
  'الأول',
  'الثاني',
  'الثالث',
  'الرابع',
  'الخامس',
];

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
 * Wording uses Egyptian Arabic; option ids and scoring affinities stay fixed.
 */
export const QUESTIONS: readonly QuizQuestion[] = [
  {
    id: 'q1',
    text: 'لسه في أول أسبوع في الجامعة، ومعاك وقت فراغ كبير. أول حاجة هتعملها إيه؟',
    absentTrack: 'cybersecurity',
    options: [
      {
        id: 'q1-build',
        text: 'أتعلّم أساسيات لغة برمجة وأعمل بيها حاجة صغيرة.',
        primary: 'software-engineering',
        secondary: 'web-development',
      },
      {
        id: 'q1-ai',
        text: 'أجرّب أدوات الذكاء الاصطناعي وأشوف ممكن أستخدمها في إيه.',
        primary: 'ai',
        secondary: 'data-science',
      },
      {
        id: 'q1-web',
        text: 'أعمل صفحة بسيطة عني وأنشرها على الإنترنت.',
        primary: 'web-development',
        secondary: 'software-engineering',
      },
      {
        id: 'q1-data',
        text: 'أنظّم ملفاتي وأشوف البيانات اللي عندي ممكن تفيدني في إيه.',
        primary: 'data-science',
        secondary: 'ai',
      },
    ],
  },
  {
    id: 'q2',
    text: 'محتاج تتعلّم موضوع جديد وصعب. إيه الطريقة اللي بتفهم بيها أسرع؟',
    absentTrack: 'data-science',
    options: [
      {
        id: 'q2-theory',
        text: 'أفهم الأساسيات الأول، وبعدين أكتب كود بنفسي لحد ما أفهمه كويس.',
        primary: 'software-engineering',
        secondary: 'web-development',
      },
      {
        id: 'q2-examples',
        text: 'أشوف أمثلة وتجارب ناس تانية وأجرّبها بنفسي.',
        primary: 'ai',
        secondary: 'data-science',
      },
      {
        id: 'q2-course',
        text: 'أتابع كورس عملي وأعدّل على أمثلته بإيدي.',
        primary: 'web-development',
        secondary: 'data-science',
      },
      {
        id: 'q2-clear',
        text: 'أدوّر على شرح بسيط وأتأكد إني فاهم كل خطوة قبل ما أكمّل.',
        primary: 'cybersecurity',
        secondary: 'software-engineering',
      },
    ],
  },
  {
    id: 'q3',
    text: 'فريقك لقى مشكلة في منصة الجامعة اللي بيستخدمها مئات الطلبة. أول حاجة هتفكر تعملها إيه؟',
    absentTrack: 'cybersecurity',
    options: [
      {
        id: 'q3-engineer',
        text: 'أصلّح السبب الأساسي بكود نقدر نعتمد عليه.',
        primary: 'software-engineering',
        secondary: 'web-development',
      },
      {
        id: 'q3-ai',
        text: 'أشوف الذكاء الاصطناعي ممكن يساعدنا نحلها إزاي.',
        primary: 'ai',
        secondary: 'data-science',
      },
      {
        id: 'q3-web',
        text: 'أظبط الواجهة عشان تبقى أسهل للطلبة في الاستخدام.',
        primary: 'web-development',
        secondary: 'software-engineering',
      },
      {
        id: 'q3-data',
        text: 'أحلّل البيانات وأدوّر على نمط يوضّح سبب المشكلة.',
        primary: 'data-science',
        secondary: 'cybersecurity',
      },
    ],
  },
  {
    id: 'q4',
    text: 'التسليم بكرة والميزانية خلصت. إيه أول حاجة هتعملها؟',
    absentTrack: 'software-engineering',
    options: [
      {
        id: 'q4-assist',
        text: 'أجرّب نموذج ذكاء اصطناعي يساعدني أخلّص الشغل أسرع.',
        primary: 'ai',
        secondary: 'data-science',
      },
      {
        id: 'q4-simplify',
        text: 'أشيل التفاصيل اللي مش ضرورية وأسلّم حاجة شغّالة.',
        primary: 'web-development',
        secondary: 'software-engineering',
      },
      {
        id: 'q4-evidence',
        text: 'أراجع البيانات والنتايج اللي عندي قبل ما أقرر.',
        primary: 'data-science',
        secondary: 'ai',
      },
      {
        id: 'q4-safeguard',
        text: 'أراجع الصلاحيات والنسخ الاحتياطي عشان أتأكد إن الشغل في أمان.',
        primary: 'cybersecurity',
        secondary: 'software-engineering',
      },
    ],
  },
  {
    id: 'q5',
    text: 'عايز تعمل حاجة الناس تستخدمها فعلًا. هتبدأ بإيه؟',
    absentTrack: 'ai',
    options: [
      {
        id: 'q5-backend',
        text: 'أكتب الكود اللي هيشغّل الفكرة وأتأكد إنه شغّال كويس.',
        primary: 'software-engineering',
        secondary: 'cybersecurity',
      },
      {
        id: 'q5-interface',
        text: 'أصمّم الصفحة بحيث أي حد يعرف يستخدمها بسهولة.',
        primary: 'web-development',
        secondary: 'software-engineering',
      },
      {
        id: 'q5-who',
        text: 'أشوف البيانات بتقول إيه عن المستخدمين واحتياجاتهم.',
        primary: 'data-science',
        secondary: 'cybersecurity',
      },
      {
        id: 'q5-harden',
        text: 'أشوف إيه اللي ممكن يتستغل وأقفل الثغرات من البداية.',
        primary: 'cybersecurity',
        secondary: 'ai',
      },
    ],
  },
  {
    id: 'q6',
    text: 'نظام كان شغّال كويس، وفجأة نتايجه بقت غلط ومش واضح السبب. هتبدأ منين؟',
    absentTrack: 'web-development',
    options: [
      {
        id: 'q6-read-code',
        text: 'أراجع الكود خطوة خطوة لحد ما ألاقي السبب.',
        primary: 'software-engineering',
        secondary: 'web-development',
      },
      {
        id: 'q6-compare',
        text: 'أجرّب نموذج تاني وأقارن نتايجه بالنموذج القديم.',
        primary: 'ai',
        secondary: 'web-development',
      },
      {
        id: 'q6-collect',
        text: 'أجمع النتايج الغريبة وأدوّر على حاجة مشتركة بينها.',
        primary: 'data-science',
        secondary: 'ai',
      },
      {
        id: 'q6-access',
        text: 'أراجع سجل الدخول وأشوف لو حد استخدم حساب مش بتاعه.',
        primary: 'cybersecurity',
        secondary: 'software-engineering',
      },
    ],
  },
  {
    id: 'q7',
    text: 'بتشتغل في مشروع جماعي، وزميلك طريقته في الشغل مختلفة عنك. هتعمل إيه؟',
    absentTrack: 'data-science',
    options: [
      {
        id: 'q7-split',
        text: 'أقسّم الشغل لمهام واضحة وكل واحد يمسك المهمة بتاعته.',
        primary: 'software-engineering',
        secondary: 'cybersecurity',
      },
      {
        id: 'q7-tool',
        text: 'أجرّب أداة ذكاء اصطناعي تساعدنا نلخّص الشغل ونقسّمه.',
        primary: 'ai',
        secondary: 'web-development',
      },
      {
        id: 'q7-ship',
        text: 'أعمل نسخة بسيطة شغّالة وبعدين نطوّرها مع بعض.',
        primary: 'web-development',
        secondary: 'data-science',
      },
      {
        id: 'q7-ownership',
        text: 'أحدد مسؤولية كل واحد عشان نعرف نرجع لمين لو حصلت مشكلة.',
        primary: 'cybersecurity',
        secondary: 'ai',
      },
    ],
  },
  {
    id: 'q8',
    text: 'في مشكلة بتظهر وتختفي، ومش عارف تكررها عشان تفهمها. هتعمل إيه؟',
    absentTrack: 'software-engineering',
    options: [
      {
        id: 'q8-rephrase',
        text: 'أغيّر صياغة السؤال للنموذج وأقارن إجاباته بإجابات الناس.',
        primary: 'ai',
        secondary: 'web-development',
      },
      {
        id: 'q8-replay',
        text: 'أجرّب نفس خطوات المستخدم وأشوف المشكلة بتظهر فين.',
        primary: 'web-development',
        secondary: 'data-science',
      },
      {
        id: 'q8-cluster',
        text: 'أجمع الحالات اللي حصلت فيها المشكلة وأدوّر على حاجة مشتركة.',
        primary: 'data-science',
        secondary: 'ai',
      },
      {
        id: 'q8-who-accessed',
        text: 'أراجع آخر ناس دخلوا النظام وأتأكد إن كل واحد دخل بصلاحياته.',
        primary: 'cybersecurity',
        secondary: 'software-engineering',
      },
    ],
  },
  {
    id: 'q9',
    text: 'لو بصّيت على التكنولوجيا كمان ١٠ سنين، تحب تلاقي إيه اتغيّر؟',
    absentTrack: 'ai',
    options: [
      {
        id: 'q9-scale',
        text: 'أنظمة كبيرة تستحمل ملايين المستخدمين من غير ما تقع.',
        primary: 'software-engineering',
        secondary: 'cybersecurity',
      },
      {
        id: 'q9-access',
        text: 'مواقع وتطبيقات أي حد يعرف يستخدمها من غير تعقيد.',
        primary: 'web-development',
        secondary: 'data-science',
      },
      {
        id: 'q9-evidence',
        text: 'القرارات تبقى مبنية على أرقام واضحة بدل التخمين.',
        primary: 'data-science',
        secondary: 'cybersecurity',
      },
      {
        id: 'q9-safe',
        text: 'الأمان يبقى جزء أساسي من أي نظام، مش حاجة بنضيفها في الآخر.',
        primary: 'cybersecurity',
        secondary: 'ai',
      },
    ],
  },
  {
    id: 'q10',
    text: 'تحب الناس تفتكر إيه عن شغلك؟',
    absentTrack: 'web-development',
    options: [
      {
        id: 'q10-built',
        text: 'إني عملت حاجات الناس لسه بتستخدمها وبتعتمد عليها.',
        primary: 'software-engineering',
        secondary: 'cybersecurity',
      },
      {
        id: 'q10-idea',
        text: 'إني جرّبت فكرة جديدة وناس تانية اتعلّمت منها.',
        primary: 'ai',
        secondary: 'web-development',
      },
      {
        id: 'q10-insight',
        text: 'إني لاحظت حاجة كانت مش واضحة وساعدت الناس تاخد قرار أحسن.',
        primary: 'data-science',
        secondary: 'cybersecurity',
      },
      {
        id: 'q10-prevented',
        text: 'إني منعت اختراق كان ممكن يسبب مشكلة كبيرة.',
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
export const RANK_LABELS_AR: readonly string[] = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس'];

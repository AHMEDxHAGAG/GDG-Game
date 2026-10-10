import type { ConversationPhase } from '@/features/conversation/types';

export interface ScriptedTurn {
  readonly id: string;
  readonly phase: ConversationPhase;
  /** Captain dialogue. Newlines are preserved as line breaks in the bubble. */
  readonly text: string;
}

/**
 * The scripted mock voyage.
 *
 * One continuous adventure: the crew sails toward the legendary Charts' Cache,
 * and each scenario is the next beat of the same story rather than an isolated
 * quiz item. Written as free conversation — no options, no right answers.
 *
 * The mock engine never reads these lines against the player's answer; they are
 * emitted in order. That is deliberate: see `docs/AI_INTEGRATION.md`.
 */
export const MOCK_SCRIPT: readonly ScriptedTurn[] = [
  {
    id: 'intro',
    phase: 'intro',
    text: [
      'أهلاً يا قرصان! أنا الكابتن بتاع الرحلة دي.',
      'إحنا ماشيين ناحية كنز معروف عند الكبار بس، اسمه Charts’ Cache.',
      'عشان نعرف مين اللي هيشتغل معانا، محتاج نتكلم الأول.',
      'اقرا براحتك يا سيدي، مفيش إجابة صح وغلط.',
    ].join('\n'),
  },
  {
    id: 'scene-island',
    phase: 'question',
    text: [
      'أول حاجة وصلناها جزيرة غريبة… والقراصنة اللي راحوا قبلنا اختفوا.',
      'قدامك خريطة قديمة عليها آثار أقدام، وجهاز صغير بيلمع على الأرض.',
      'إيه أول حاجة هتعملها؟ وليه؟',
    ].join('\n'),
  },
  {
    id: 'scene-broken-ship',
    phase: 'question',
    text: [
      'من غير ما تحس، السفينة عطلت في نص البحر.',
      'معاك أدوات قليلة، والطاقم واقف مستني قرار منك.',
      'إزاي هتبدأ تتعامل مع العطل ده؟',
    ].join('\n'),
  },
  {
    id: 'scene-coded-message',
    phase: 'question',
    text: [
      'طلعت من دولاب الكابتن رسالة قديمة، كلها رموز وأرقام ومش مفهومة.',
      'الكابتن مقتنع إن فيها سر مهم، بس محدش في الطاقم عرف يفكها.',
      'هتحاول تفهم الرسالة دي إزاي؟',
    ].join('\n'),
  },
  {
    id: 'scene-crossroads',
    phase: 'question',
    text: [
      'وصلنا طريقين. اتنين من الطاقم، كل واحد عايز يمشي في اتجاه مختلف.',
      'والاتنين عندهم سبب مقنع… والحل بقى في دماغك انت.',
      'هتتعامل مع الموقف ده إزاي؟',
    ].join('\n'),
  },
  {
    id: 'scene-invention',
    phase: 'question',
    text: [
      'دلوقتي الكابتن قال لك حاجة: تخترع أي أداة واحدة تساعد الطاقم في الرحلة.',
      'مش لازم أداة حقيقية… المهم تكون مفيدة فعلاً.',
      'هتعمل إيه؟ وإيه اللي يخليها مفيدة؟',
    ].join('\n'),
  },
  {
    id: 'scene-suspicion',
    phase: 'question',
    text: [
      'قربنا من الكنز… بس لاحظت حاجة غريبة على سطح السفينة.',
      'محدش غيرك واخد باله، والطاقم مشغولين بالكنز.',
      'هتتصرف إزاي؟',
    ].join('\n'),
  },
  {
    id: 'scene-final-call',
    phase: 'question',
    text: [
      'فاضل خطوة واحدة بس.',
      'عندنا طريق سريع ومجهول… وطريق أطول وواضح.',
      'هتقرر بناءً على إيه؟',
    ].join('\n'),
  },
  {
    id: 'closing',
    phase: 'completed',
    text: [
      'استنى كده يا قرصان…',
      'الكابتن بيراجع رحلتك.',
      'واضح إن ليك مكان مميز وسط الطاقم!',
    ].join('\n'),
  },
];

/**
 * Neutral acknowledgements shown after each answer.
 *
 * These are deliberately content-free. They narrate that the answer was
 * recorded without claiming to have understood, analysed, or judged it — the
 * mock engine performs no inference of any kind.
 */
export const MOCK_ACKNOWLEDGEMENTS: readonly string[] = [
  'تمام… الكابتن سجّل كلامك في دفتر الرحلة.',
  'اتكتبت على لفافة الخريطة. اللي بعدك هو اللي هيفسّرها.',
  'تمام يا قرصان. الدفتر مسجّل.',
  'الطاقم سمعك. الرحلة ماشية.',
  'تمام، الكابتن بسجّل… وبيسجّل كويس.',
  'سجّلتها. الرحلة لسه طويلة، فمفيش داعي تستعجل.',
  'تمام، نمشي. الجاي أحلى.',
];

export const MOCK_PROGRESS_LABEL = (asked: number, expected: number): string =>
  `الموقف ${asked} من ${expected}`;

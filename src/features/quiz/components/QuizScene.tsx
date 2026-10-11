'use client';

import { useEffect, useId, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, RotateCcw } from 'lucide-react';

import { ui } from '@/content/ui';
import { QUESTIONS } from '@/content/questions';
import { toArabicDigits } from '@/content/tracks';
import { getCharacter } from '@/config/characters';
import { QUESTION_COUNT } from '@/features/quiz/types';
import { useQuiz } from '@/features/quiz/state/QuizProvider';
import { scoreAnswers } from '@/features/quiz/scoring/scoreAnswers';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { ParchmentPanel } from '@/components/shared/ParchmentPanel';
import { PirateButton } from '@/components/shared/PirateButton';
import { CharacterArtwork } from '@/components/characters/CharacterArtwork';

/**
 * The MCQ screen.
 *
 * Contract, taken from
 * `assests/UI/gdgoc-pirate-personality-spec/pages/personality-quiz.json`:
 * four parchment option cards per question, exactly one selectable (radio
 * behaviour), a visible selected state, Next disabled until an answer exists,
 * and Back restoring the previous selection. There is no free-text input and
 * no composer anywhere on this screen.
 */
export function QuizScene(): React.JSX.Element {
  const router = useRouter();
  const {
    state,
    isHydrated,
    enterPhase,
    selectOption,
    nextQuestion,
    previousQuestion,
    submit,
    restart,
  } = useQuiz();
  const legendId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  // Tracks whether the question index changed, so focus only moves on a real
  // navigation rather than on every selection re-render.
  const lastIndex = useRef<number | null>(null);

  const index = state.questionIndex;
  const question = QUESTIONS[index];
  const isLast = index === QUESTIONS.length - 1;
  const selected = question ? state.answers[question.id] : undefined;

  // This route owns its own provider, so it declares what it is once hydration
  // has run. Without it the provider hydrates to `landing` and every
  // `question/select` is silently dropped by the reducer's phase guard.
  useEffect(() => {
    if (isHydrated) enterPhase('quiz');
  }, [isHydrated, enterPhase]);

  // Announce the question by moving focus to its heading.
  useEffect(() => {
    if (lastIndex.current === index) return;
    lastIndex.current = index;
    headingRef.current?.focus();
  }, [index]);

  if (!isHydrated) {
    return (
      <NauticalBackground>
        <main className="grid min-h-[100dvh] place-items-center" aria-busy="true">
          <span className="sr-only">…</span>
        </main>
      </NauticalBackground>
    );
  }

  /**
   * `/quiz` deliberately does not gate on prior state.
   *
   * Each route mounts its own provider, so the reducer phase here reflects
   * whatever was stored — and pressing "start" on the landing screen leaves
   * nothing stored yet. A direct visit to `/quiz` with no answers is simply
   * question 1, which is the right thing to render. (The routes that genuinely
   * need history — `/analyzing`, `/matches`, `/result` — do guard, because
   * they cannot be shown without a scoring run behind them.)
   */
  if (question === undefined) {
    return (
      <NauticalBackground>
        <main
          className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center"
          data-scene="quiz-empty"
        >
          <h1 className="text-2xl font-extrabold text-text-primary">{ui.errors.genericTitle}</h1>
          <PirateButton
            onClick={() => {
              restart();
              router.push('/');
            }}
            icon={<RotateCcw className="size-4" />}
          >
            {ui.errors.retry}
          </PirateButton>
        </main>
      </NauticalBackground>
    );
  }

  const scores = scoreAnswers(state.answers);
  const captain = getCharacter(
    scores.answeredCount > 0 ? scores.ranking[0]!.trackId : 'web-development',
  );

  const handleNext = () => {
    if (isLast) {
      submit();
      router.push('/analyzing');
      return;
    }
    nextQuestion();
  };

  return (
    <NauticalBackground scene="cabin" withLantern>
      <div className="flex min-h-[100dvh] flex-col">
        <main
          className="quiz-layout mx-auto flex w-full max-w-[42.5rem] flex-1 flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] sm:px-6"
          data-scene="quiz"
        >
          <QuestionProgress index={index} total={QUESTIONS.length} />

          {/* Parchment question. The captain overlaps its right edge but sits
              outside the text inset, per the spec. */}
          <div className="quiz-question relative mt-3">
            <ParchmentPanel className="relative z-10 p-4 pt-5 sm:p-5" torn>
              {/* `ps` is the logical start, which in this RTL document is the
                  image-right — the side the captain overlaps. The extra inset
                  is what keeps long Arabic lines clear of him. */}
              <h1
                ref={headingRef}
                tabIndex={-1}
                aria-describedby={legendId}
                className="quiz-question-title text-right ps-[80px] text-ink outline-none sm:ps-[112px]"
                style={{ fontSize: 'clamp(1.05rem, 4.2vw, 1.3rem)', lineHeight: 1.65 }}
              >
                {question.text}
              </h1>
            </ParchmentPanel>

            {/* The leading character follows all current answers, including edits. */}
            <CharacterArtwork
              key={captain.id}
              decorative
              character={captain}
              className="quiz-captain animate-float-idle pointer-events-none absolute -top-6 -start-2 z-20 h-[112px] w-auto opacity-95 sm:-top-8 sm:h-[144px] lg:h-[176px]"
            />
          </div>

          <fieldset className="mt-4 min-w-0 border-0 p-0" aria-describedby={legendId}>
            <legend id={legendId} className="sr-only">
              {ui.quiz.optionsLegend}
            </legend>

            <ul className="flex flex-col gap-2.5 sm:gap-3">
              {question.options.map((option) => {
                const isSelected = selected === option.id;
                // Deliberately no per-option track artwork: an emblem beside
                // each answer tells the visitor which persona that answer feeds,
                // so the cards stop reading as statements and start reading as a
                // score sheet. The mapping is what the quiz is for, not a hint.
                const track = getCharacter(option.primary);
                return (
                  <li key={option.id}>
                    <OptionCard
                      optionId={option.id}
                      text={option.text}
                      checked={isSelected}
                      onSelect={() => selectOption(question.id, option.id)}
                      accent={track.palette.vivid}
                      name={`${question.id}-option`}
                    />
                  </li>
                );
              })}
            </ul>
          </fieldset>

          <p className="mt-3 text-center text-[0.78rem] text-text-secondary">{ui.quiz.hint}</p>

          {/* Footer sits in flow, not fixed, so it can never cover an option on
              a short screen. */}
          <div className="mt-4 flex flex-wrap gap-3 pb-2 sm:mt-5">
            <PirateButton
              variant="secondary"
              onClick={previousQuestion}
              disabled={index === 0}
              className="flex-1 basis-32"
              icon={<ArrowRight className="size-4" />}
              data-testid="quiz-previous"
            >
              {ui.quiz.previous}
            </PirateButton>
            <PirateButton
              onClick={handleNext}
              disabled={selected === undefined}
              className="flex-1 basis-32"
              icon={<ArrowLeft className="size-4" />}
              data-testid="quiz-next"
            >
              {isLast ? ui.quiz.submit : ui.quiz.next}
            </PirateButton>
          </div>

          <p className="mt-1 text-center">
            <Link
              href="/"
              className="text-[0.72rem] text-text-secondary/80 underline decoration-dotted underline-offset-4 hover:text-text-primary"
            >
              {ui.quiz.counter(index + 1, QUESTION_COUNT)}
            </Link>
          </p>
        </main>
      </div>
    </NauticalBackground>
  );
}

/**
 * One selectable parchment card.
 *
 * A real `<input type="radio">` sits under the visible content, so keyboard
 * arrow-key navigation, grouping and the announced checked state all come from
 * the platform rather than a hand-rolled ARIA implementation.
 */
function OptionCard({
  optionId,
  text,
  checked,
  onSelect,
  accent,
  name,
}: {
  optionId: string;
  text: string;
  checked: boolean;
  onSelect: () => void;
  accent: string;
  name: string;
}): React.JSX.Element {
  const inputId = `${name}-${optionId}`;
  return (
    <label
      htmlFor={inputId}
      data-checked={checked}
      className={`answer-strip group relative flex min-h-[4.25rem] w-full cursor-pointer items-center gap-[12px] rounded-md border-2 px-[12px] py-3 transition-colors ${
        checked
          ? 'border-transparent bg-parchment-50 shadow-[0_0_0_3px_var(--option-accent),0_4px_14px_rgba(9,11,23,0.5)]'
          : 'border-parchment-600/50 bg-parchment-200 hover:border-parchment-500 hover:bg-parchment-100'
      }`}
      style={{ ['--option-accent' as string]: accent }}
    >
      <input
        id={inputId}
        type="radio"
        name={name}
        value={optionId}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />

      <span
        className="min-w-0 flex-1 text-right text-ink"
        style={{ fontSize: 'clamp(0.95rem, 3.6vw, 1.0625rem)', lineHeight: 1.6 }}
      >
        {text}
      </span>

      {/* Selection is signalled by shape and text, never colour alone. */}
      <span
        aria-hidden="true"
        className={`grid size-[24px] shrink-0 place-items-center rounded-full border-2 ${
          checked ? 'border-transparent' : 'border-parchment-600/60'
        }`}
        style={checked ? { backgroundColor: accent } : undefined}
      >
        {checked ? <Check className="size-[16px] text-ink" strokeWidth={3} /> : null}
      </span>

      {checked ? <span className="sr-only">{ui.quiz.selectedMark}</span> : null}
    </label>
  );
}

/** Stepper + counter, with real progressbar semantics. */
export function QuestionProgress({
  index,
  total,
}: {
  index: number;
  total: number;
}): React.JSX.Element {
  return (
    <div className="flex flex-col items-center gap-2">
      <p
        className="text-[0.95rem] font-extrabold text-text-primary"
        aria-live="polite"
        data-testid="quiz-counter"
      >
        {ui.quiz.counter(index + 1, total)}
      </p>
      <div
        role="progressbar"
        aria-label={ui.quiz.progressLabel}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-valuenow={index + 1}
        aria-valuetext={ui.quiz.questionChanged(index + 1, total)}
        className="flex w-full max-w-[22rem] items-center gap-1.5"
      >
        {Array.from({ length: total }, (_, step) => {
          const done = step < index;
          const current = step === index;
          return (
            <span
              key={step}
              aria-hidden="true"
              className={`h-2 flex-1 rounded-full transition-colors ${
                done ? 'bg-accent-red-high' : current ? 'bg-accent-gold' : 'bg-progress-inactive/60'
              }`}
            />
          );
        })}
      </div>
      <span className="sr-only">{toArabicDigits(index + 1)}</span>
    </div>
  );
}

import type { TrackId } from '@/features/characters/types';

/**
 * One selectable answer.
 *
 * Every option carries exactly two weights: a `primary` track it strongly
 * leans towards, and a `secondary` track it also suits but less. There is no
 * right answer — the four options are four equally valid reactions.
 */
export interface QuizOption {
  readonly id: string;
  /** Arabic answer text, written first-person and action-led. */
  readonly text: string;
  readonly primary: TrackId;
  readonly secondary: TrackId;
}

export interface QuizQuestion {
  readonly id: string;
  /** Arabic question text. */
  readonly text: string;
  /**
   * The single track deliberately not offered as an answer to this question.
   *
   * This is what keeps the bank fair: each track is absent from exactly two of
   * the ten questions, so every track ends up with an identical number of
   * options pointing at it. See `content/questions.test.ts`.
   */
  readonly absentTrack: TrackId;
  readonly options: readonly [QuizOption, QuizOption, QuizOption, QuizOption];
}

/** `questionId → optionId`. One entry per answered question. */
export type QuizAnswers = Readonly<Record<string, string>>;

/** Weights a single selected option contributes. */
export const PRIMARY_WEIGHT = 3;
export const SECONDARY_WEIGHT = 1;

/** Ten questions × (3 + 1) = 40 points spread across the five tracks. */
export const TOTAL_POINTS = 40;

export const QUESTION_COUNT = 10;

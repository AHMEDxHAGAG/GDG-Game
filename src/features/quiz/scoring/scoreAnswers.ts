import { QUESTIONS, QUESTION_BY_ID } from '@/content/questions';
import { TRACK_IDS, trackIndex, type TrackId } from '@/features/characters/types';
import {
  PRIMARY_WEIGHT,
  SECONDARY_WEIGHT,
  TOTAL_POINTS,
  type QuizAnswers,
} from '@/features/quiz/types';

/** One ranked track, ready for the matches screen. */
export interface RankedMatch {
  readonly trackId: TrackId;
  /** 1-based, best first. */
  readonly rank: number;
  readonly score: number;
  /** How many of the ten answers leaned this way as their primary. */
  readonly primaryHits: number;
  readonly secondaryHits: number;
  /** Score as a fraction of the 40-point pool, for the meter. */
  readonly ratio: number;
}

export interface QuizScores {
  readonly scores: Readonly<Record<TrackId, number>>;
  readonly primaryHits: Readonly<Record<TrackId, number>>;
  readonly secondaryHits: Readonly<Record<TrackId, number>>;
  /** Every track, best first. Always `TRACK_IDS.length` long. */
  readonly ranking: readonly RankedMatch[];
  /** How many questions carried a recognised answer. */
  readonly answeredCount: number;
  /** True when every question in the bank has a recognised answer. */
  readonly complete: boolean;
}

function emptyCounts(): Record<TrackId, number> {
  return {
    'software-engineering': 0,
    ai: 0,
    'web-development': 0,
    'data-science': 0,
    cybersecurity: 0,
  };
}

/**
 * Turns answers into a full, deterministic ranking.
 *
 * There is no inference here and nothing async: given the same answers this
 * always returns the same ranking, on any device, with no network. Answers
 * that reference an unknown question or option are ignored rather than
 * throwing, so a half-finished or tampered session can still render something
 * sensible.
 */
export function scoreAnswers(answers: QuizAnswers): QuizScores {
  const scores = emptyCounts();
  const primaryHits = emptyCounts();
  const secondaryHits = emptyCounts();
  let answeredCount = 0;

  for (const question of QUESTIONS) {
    const optionId = answers[question.id];
    if (optionId === undefined) continue;

    const option = question.options.find((candidate) => candidate.id === optionId);
    // Unknown question id or option id — skip rather than trust it.
    if (option === undefined) continue;

    answeredCount += 1;
    scores[option.primary] += PRIMARY_WEIGHT;
    primaryHits[option.primary] += 1;
    scores[option.secondary] += SECONDARY_WEIGHT;
    secondaryHits[option.secondary] += 1;
  }

  const ranking = rankTracks(scores, primaryHits, secondaryHits);

  return {
    scores,
    primaryHits,
    secondaryHits,
    ranking,
    answeredCount,
    complete: answeredCount === QUESTIONS.length,
  };
}

/**
 * Sorts the five tracks and stamps 1-based ranks.
 *
 * Tie-break order, most meaningful first:
 *   1. total score
 *   2. primary hits — "you picked this track head-on N times" is the most
 *      explainable signal we have, and it is what resolves ~12 % of random
 *      playthroughs that tie on score
 *   3. secondary hits
 *   4. `TRACK_IDS` order — a fixed, arbitrary last resort that guarantees the
 *      comparator is total, so the output can never depend on engine sort
 *      stability
 */
export function rankTracks(
  scores: Readonly<Record<TrackId, number>>,
  primaryHits: Readonly<Record<TrackId, number>>,
  secondaryHits: Readonly<Record<TrackId, number>>,
): readonly RankedMatch[] {
  return [...TRACK_IDS]
    .sort((a, b) => {
      if (scores[b] !== scores[a]) return scores[b] - scores[a];
      if (primaryHits[b] !== primaryHits[a]) return primaryHits[b] - primaryHits[a];
      if (secondaryHits[b] !== secondaryHits[a]) return secondaryHits[b] - secondaryHits[a];
      return trackIndex(a) - trackIndex(b);
    })
    .map((trackId, index) => ({
      trackId,
      rank: index + 1,
      score: scores[trackId],
      primaryHits: primaryHits[trackId],
      secondaryHits: secondaryHits[trackId],
      ratio: scores[trackId] / TOTAL_POINTS,
    }));
}

/** Builds an answers map from option ids keyed by question id. */
export function answersFromOptions(questionIdToOptionId: Readonly<Record<string, string>>): QuizAnswers {
  const answers: Record<string, string> = {};
  for (const question of QUESTIONS) {
    const optionId = questionIdToOptionId[question.id];
    if (optionId === undefined) continue;
    if (QUESTION_BY_ID.get(question.id)?.options.some((o) => o.id === optionId)) {
      answers[question.id] = optionId;
    }
  }
  return answers;
}

/** Convenience for tests and dev tools: answer every question the same way. */
export function pickSameOption(index: number): QuizAnswers {
  const answers: Record<string, string> = {};
  for (const question of QUESTIONS) {
    const option = question.options[index % question.options.length];
    if (option) answers[question.id] = option.id;
  }
  return answers;
}

/** True when the quiz has enough answers to rank. */
export function isScorable(answers: QuizAnswers): boolean {
  return QUESTIONS.every((question) => {
    const optionId = answers[question.id];
    return optionId !== undefined && QUESTION_BY_ID.get(question.id)?.options.some((o) => o.id === optionId);
  });
}

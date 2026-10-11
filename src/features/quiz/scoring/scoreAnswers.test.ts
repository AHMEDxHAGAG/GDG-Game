import { describe, expect, it } from 'vitest';

import { QUESTIONS } from '@/content/questions';
import { TRACK_IDS, type TrackId } from '@/features/characters/types';
import {
  answersFromOptions,
  isScorable,
  pickSameOption,
  rankTracks,
  scoreAnswers,
} from '@/features/quiz/scoring/scoreAnswers';
import { PRIMARY_WEIGHT, SECONDARY_WEIGHT, TOTAL_POINTS, type QuizAnswers } from '@/features/quiz/types';

/** Deterministic PRNG so the fuzz cases below are reproducible run to run. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomAnswers(rand: () => number): QuizAnswers {
  const answers: Record<string, string> = {};
  for (const question of QUESTIONS) {
    const option = question.options[Math.floor(rand() * question.options.length)];
    if (option) answers[question.id] = option.id;
  }
  return answers;
}

function totalOf(scores: Readonly<Record<TrackId, number>>): number {
  return TRACK_IDS.reduce((sum, track) => sum + scores[track], 0);
}

describe('scoreAnswers arithmetic', () => {
  it('splits every answer into a primary and a secondary weight', () => {
    const result = scoreAnswers({ q1: 'q1-build' });
    expect(result.scores['software-engineering']).toBe(PRIMARY_WEIGHT);
    expect(result.scores['web-development']).toBe(SECONDARY_WEIGHT);
    expect(result.scores.ai).toBe(0);
    expect(result.primaryHits['software-engineering']).toBe(1);
    expect(result.secondaryHits['web-development']).toBe(1);
  });

  it('always distributes exactly the full point pool on a complete answer set', () => {
    const rand = mulberry32(7);
    for (let trial = 0; trial < 500; trial++) {
      const result = scoreAnswers(randomAnswers(rand));
      expect(result.complete).toBe(true);
      expect(result.answeredCount).toBe(10);
      expect(totalOf(result.scores)).toBe(TOTAL_POINTS);
    }
  });

  it('keeps no track out of reach — every track can score highly', () => {
    for (const track of TRACK_IDS) {
      // Answer with this track's primary option wherever it is offered.
      const chosen: Record<string, string> = {};
      for (const question of QUESTIONS) {
        const option = question.options.find((o) => o.primary === track) ?? question.options[0];
        if (option) chosen[question.id] = option.id;
      }
      const result = scoreAnswers(chosen);
      expect(result.ranking[0]?.trackId).toBe(track);
      expect(result.ranking[0]?.score).toBeGreaterThanOrEqual(24);
      expect(result.ranking[0]?.primaryHits).toBe(8);
    }
  });

  it('keeps a zero score rare and honest rather than impossible', () => {
    // A zero IS reachable: you pick 10 of 40 options, and each track only
    // appears in 8 of them, so a playthrough can genuinely lean away from a
    // track entirely. Measured rate is ~0.2-0.5% per track. That is correct
    // behaviour, not a bug — the matches screen must render it plainly, so
    // what we pin here is that it stays rare and never breaks the ranking.
    const rand = mulberry32(99);
    const playthroughs = 2000;
    const zeroCount = new Map<TrackId, number>(TRACK_IDS.map((t) => [t, 0]));

    for (let trial = 0; trial < playthroughs; trial++) {
      const result = scoreAnswers(randomAnswers(rand));
      expect(result.ranking).toHaveLength(TRACK_IDS.length);
      for (const track of TRACK_IDS) {
        if (result.scores[track] === 0) {
          zeroCount.set(track, (zeroCount.get(track) ?? 0) + 1);
        }
      }
    }

    for (const track of TRACK_IDS) {
      const rate = (zeroCount.get(track) ?? 0) / playthroughs;
      expect(rate).toBeLessThan(0.02);
    }
  });
});

describe('ranking', () => {
  it('returns all five tracks in rank order', () => {
    const result = scoreAnswers(pickSameOption(0));
    expect(result.ranking).toHaveLength(TRACK_IDS.length);
    expect(result.ranking.map((m) => m.rank)).toEqual([1, 2, 3, 4, 5]);
    expect(new Set(result.ranking.map((m) => m.trackId))).toEqual(new Set(TRACK_IDS));
  });

  it('is sorted by descending score', () => {
    const rand = mulberry32(11);
    for (let trial = 0; trial < 300; trial++) {
      const { ranking } = scoreAnswers(randomAnswers(rand));
      for (let i = 1; i < ranking.length; i++) {
        expect(ranking[i - 1]!.score).toBeGreaterThanOrEqual(ranking[i]!.score);
      }
    }
  });

  it('breaks score ties with primary hits, then secondary hits, then fixed order', () => {
    const flat = {
      'software-engineering': 6,
      ai: 6,
      'web-development': 6,
      'data-science': 6,
      cybersecurity: 6,
    } as const;
    const noHits = {
      'software-engineering': 0,
      ai: 0,
      'web-development': 0,
      'data-science': 0,
      cybersecurity: 0,
    } as const;

    // Total tie with no hits → falls through to TRACK_IDS order.
    expect(rankTracks(flat, noHits, noHits).map((m) => m.trackId)).toEqual([...TRACK_IDS]);

    // Primary hits decide before fixed order.
    const primaryWins = rankTracks(
      flat,
      { ...noHits, cybersecurity: 2, ai: 1 },
      noHits,
    );
    expect(primaryWins[0]?.trackId).toBe('cybersecurity');
    expect(primaryWins[1]?.trackId).toBe('ai');

    // Secondary hits decide when both score and primaries tie.
    const secondaryWins = rankTracks(flat, noHits, { ...noHits, 'web-development': 3 });
    expect(secondaryWins[0]?.trackId).toBe('web-development');
  });

  it('is deterministic — 1000 identical runs agree', () => {
    const answers = pickSameOption(2);
    const first = JSON.stringify(scoreAnswers(answers).ranking);
    for (let i = 0; i < 1000; i++) {
      expect(JSON.stringify(scoreAnswers(answers).ranking)).toBe(first);
    }
  });

  it('does not depend on the order answers were entered', () => {
    const entries = Object.entries(pickSameOption(3));
    const forward = scoreAnswers(Object.fromEntries(entries));
    const reversed = scoreAnswers(Object.fromEntries([...entries].reverse()));
    expect(reversed.ranking).toEqual(forward.ranking);
  });

  it('normalises every score against the 40-point pool', () => {
    const result = scoreAnswers(pickSameOption(0));
    for (const match of result.ranking) {
      expect(match.ratio).toBeCloseTo(match.score / TOTAL_POINTS, 10);
      expect(match.ratio).toBeGreaterThanOrEqual(0);
      expect(match.ratio).toBeLessThanOrEqual(1);
    }
  });
});

describe('resilience to bad input', () => {
  it('scores nothing for an empty answer set', () => {
    const result = scoreAnswers({});
    expect(result.answeredCount).toBe(0);
    expect(result.complete).toBe(false);
    expect(totalOf(result.scores)).toBe(0);
    // Still returns a full, stable ordering rather than throwing.
    expect(result.ranking).toHaveLength(TRACK_IDS.length);
  });

  it('ignores unknown question ids and unknown option ids', () => {
    const result = scoreAnswers({
      'not-a-question': 'q1-build',
      q1: 'not-an-option',
      q2: 'q2-theory',
    });
    expect(result.answeredCount).toBe(1);
    expect(result.scores['software-engineering']).toBe(PRIMARY_WEIGHT);
  });

  it('scores a partial answer set without claiming completeness', () => {
    const result = scoreAnswers({ q1: 'q1-build', q2: 'q2-examples' });
    expect(result.complete).toBe(false);
    expect(result.answeredCount).toBe(2);
    expect(totalOf(result.scores)).toBe(2 * (PRIMARY_WEIGHT + SECONDARY_WEIGHT));
  });
});

describe('helpers', () => {
  it('answersFromOptions drops anything the bank does not recognise', () => {
    const answers = answersFromOptions({
      q1: 'q1-build',
      q9: 'nope',
      q10: 'q10-built',
      zzz: 'q1-build',
    });
    expect(Object.keys(answers).sort()).toEqual(['q1', 'q10']);
  });

  it('isScorable is false until every question is answered', () => {
    const partial = Object.fromEntries(QUESTIONS.slice(0, 9).map((q) => [q.id, q.options[0]!.id]));
    expect(isScorable(partial)).toBe(false);
    expect(isScorable(pickSameOption(0))).toBe(true);
  });

  it('isScorable rejects an answer set with a bad option id', () => {
    const broken: Record<string, string> = {};
    for (const question of QUESTIONS) broken[question.id] = question.options[0]!.id;
    broken.q5 = 'not-an-option';
    expect(isScorable(broken)).toBe(false);
  });
});

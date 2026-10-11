import { describe, expect, it } from 'vitest';

import { QUESTIONS, QUESTION_BY_ID, RANK_LABELS_AR } from '@/content/questions';
import { PRIMARY_WEIGHT, QUESTION_COUNT, SECONDARY_WEIGHT, TOTAL_POINTS } from '@/features/quiz/types';
import { TRACK_IDS, type TrackId } from '@/features/characters/types';

const trackSet = new Set<string>(TRACK_IDS);

/** Question 3 reproduces the approved spec screenshot; these are its exact words. */
const SPEC_Q3_TEXTS: readonly string[] = [
  'أبني حلاً تقنياً موثوقاً يصلح المشكلة من جذورها.',
  'أستخدم الذكاء الاصطناعي لتقديم حلول ذكية ومبتكرة.',
  'أصمم واجهة سهلة الاستخدام تجعل التجربة أفضل للطلاب.',
  'أحلل البيانات لأفهم سبب المشكلة وأجد الأنماط فيها.',
];

describe('question bank shape', () => {
  it('holds ten questions', () => {
    expect(QUESTIONS).toHaveLength(QUESTION_COUNT);
    expect(QUESTION_COUNT).toBe(10);
  });

  it('gives every question a unique id and four unique option ids', () => {
    const questionIds = QUESTIONS.map((q) => q.id);
    expect(new Set(questionIds).size).toBe(questionIds.length);

    const optionIds = QUESTIONS.flatMap((q) => q.options.map((o) => o.id));
    expect(new Set(optionIds).size).toBe(optionIds.length);
    expect(optionIds).toHaveLength(QUESTION_COUNT * 4);
  });

  it('indexes every question by id', () => {
    for (const question of QUESTIONS) {
      expect(QUESTION_BY_ID.get(question.id)).toBe(question);
    }
    expect(QUESTION_BY_ID.size).toBe(QUESTION_COUNT);
  });

  it('gives every option non-empty Arabic text', () => {
    for (const question of QUESTIONS) {
      expect(question.text.length).toBeGreaterThan(10);
      for (const option of question.options) {
        expect(option.text.trim().length).toBeGreaterThan(10);
      }
    }
  });

  it('supplies an Arabic ordinal label for each of the five ranks', () => {
    expect(RANK_LABELS_AR).toHaveLength(TRACK_IDS.length);
    expect(new Set(RANK_LABELS_AR).size).toBe(TRACK_IDS.length);
  });
});

describe('weight validity', () => {
  it('references only real tracks', () => {
    for (const question of QUESTIONS) {
      expect(trackSet.has(question.absentTrack)).toBe(true);
      for (const option of question.options) {
        expect(trackSet.has(option.primary)).toBe(true);
        expect(trackSet.has(option.secondary)).toBe(true);
      }
    }
  });

  it('never lets an option name the same track twice', () => {
    for (const question of QUESTIONS) {
      for (const option of question.options) {
        expect(option.primary).not.toBe(option.secondary);
      }
    }
  });

  it('gives each question four distinct primaries, none of them the absent track', () => {
    for (const question of QUESTIONS) {
      const primaries = question.options.map((o) => o.primary);
      expect(new Set(primaries).size).toBe(4);
      expect(primaries).not.toContain(question.absentTrack);
    }
  });

  it('weights the primary above the secondary', () => {
    expect(PRIMARY_WEIGHT).toBeGreaterThan(SECONDARY_WEIGHT);
    expect(PRIMARY_WEIGHT + SECONDARY_WEIGHT).toBe(4);
  });
});

describe('fairness invariants', () => {
  const primaries = new Map<TrackId, number>();
  const secondaries = new Map<TrackId, number>();
  const absences = new Map<TrackId, number>();

  for (const track of TRACK_IDS) {
    primaries.set(track, 0);
    secondaries.set(track, 0);
    absences.set(track, 0);
  }

  for (const question of QUESTIONS) {
    absences.set(question.absentTrack, (absences.get(question.absentTrack) ?? 0) + 1);
    for (const option of question.options) {
      primaries.set(option.primary, (primaries.get(option.primary) ?? 0) + 1);
      secondaries.set(option.secondary, (secondaries.get(option.secondary) ?? 0) + 1);
    }
  }

  it('omits each track from exactly two questions', () => {
    for (const track of TRACK_IDS) {
      expect(absences.get(track)).toBe(2);
    }
    expect([...absences.values()].reduce((a, b) => a + b)).toBe(QUESTION_COUNT);
  });

  it('makes each track the primary of exactly eight options', () => {
    for (const track of TRACK_IDS) {
      expect(primaries.get(track)).toBe(8);
    }
    expect([...primaries.values()].reduce((a, b) => a + b)).toBe(QUESTION_COUNT * 4);
  });

  it('makes each track the secondary of exactly eight options', () => {
    for (const track of TRACK_IDS) {
      expect(secondaries.get(track)).toBe(8);
    }
    expect([...secondaries.values()].reduce((a, b) => a + b)).toBe(QUESTION_COUNT * 4);
  });

  it('weighs every option in the bank', () => {
    // The bank holds 40 options, each worth PRIMARY + SECONDARY. This is the
    // bank's total weight — not the answerable pool.
    //
    // The *answerable* pool is what a single playthrough distributes: 10
    // answers × 4 points = TOTAL_POINTS. That a complete answer set always
    // sums to TOTAL_POINTS is a scoring invariant, asserted in
    // `scoreAnswers.test.ts`, not here.
    const bankWeight = [...primaries.values()].reduce((sum, n) => sum + n * PRIMARY_WEIGHT, 0) +
      [...secondaries.values()].reduce((sum, n) => sum + n * SECONDARY_WEIGHT, 0);

    expect(bankWeight).toBe(QUESTION_COUNT * 4 * (PRIMARY_WEIGHT + SECONDARY_WEIGHT));
    expect(bankWeight).toBe(160);
    expect(TOTAL_POINTS).toBe(QUESTION_COUNT * (PRIMARY_WEIGHT + SECONDARY_WEIGHT));
    expect(TOTAL_POINTS).toBe(40);
  });
});

describe('approved spec content', () => {
  it("reproduces question 3's option texts verbatim", () => {
    const q3 = QUESTION_BY_ID.get('q3');
    expect(q3).toBeDefined();
    expect(q3?.options.map((o) => o.text)).toEqual(SPEC_Q3_TEXTS);
  });

  it('makes cybersecurity reachable from question 3 via a secondary weight', () => {
    // The spec flags that its worked example omits security entirely. This is
    // the one deliberate deviation from the approved screenshot.
    const q3 = QUESTION_BY_ID.get('q3');
    expect(q3?.absentTrack).toBe('cybersecurity');
    const secondaryTracks = q3?.options.map((o) => o.secondary) ?? [];
    expect(secondaryTracks).toContain('cybersecurity');
  });
});

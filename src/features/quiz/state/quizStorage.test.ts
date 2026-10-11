import { describe, expect, it } from 'vitest';

import { QUESTIONS } from '@/content/questions';
import { storageKeys } from '@/config/site';
import { rankTracks } from '@/features/quiz/scoring/scoreAnswers';
import { createInitialQuizState, type QuizState } from '@/features/quiz/state/quizReducer';
import {
  SCHEMA_VERSION,
  SESSION_TTL_MS,
  clearQuizSession,
  deserializeQuizSession,
  loadQuizSession,
  loadRememberedUsername,
  purgeLegacySession,
  saveQuizSession,
  saveRememberedUsername,
  serializeQuizSession,
} from '@/features/quiz/state/quizStorage';

const NOW = 1_700_000_000_000;

function sampleState(overrides: Partial<QuizState> = {}): QuizState {
  return {
    ...createInitialQuizState(NOW),
    hydrated: true,
    username: 'Lila',
    startedAt: NOW,
    ...overrides,
  };
}

const SAMPLE_RANKING = rankTracks(
  { 'software-engineering': 12, ai: 9, 'web-development': 7, 'data-science': 6, cybersecurity: 6 },
  { 'software-engineering': 3, ai: 2, 'web-development': 1, 'data-science': 1, cybersecurity: 1 },
  { 'software-engineering': 1, ai: 1, 'web-development': 1, 'data-science': 1, cybersecurity: 1 },
);

describe('round trip', () => {
  it('restores a run in progress', () => {
    const answers = Object.fromEntries(
      QUESTIONS.slice(0, 3).map((q) => [q.id, q.options[0]!.id]),
    );
    const state = sampleState({ answers, questionIndex: 2 });
    const restored = deserializeQuizSession(serializeQuizSession(state, NOW), NOW);

    expect(restored).not.toBeNull();
    expect(restored?.username).toBe('Lila');
    expect(restored?.answers).toEqual(answers);
    expect(restored?.questionIndex).toBe(2);
    expect(restored?.phase).toBe('quiz');
  });

  it('restores a completed run with its ranking', () => {
    const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options[0]!.id]));
    const state = sampleState({
      answers,
      questionIndex: QUESTIONS.length - 1,
      ranking: SAMPLE_RANKING,
      selectedTrackId: 'web-development',
    });
    const restored = deserializeQuizSession(serializeQuizSession(state, NOW), NOW);

    expect(restored?.phase).toBe('result');
    expect(restored?.selectedTrackId).toBe('web-development');
    expect(restored?.ranking).toHaveLength(5);
  });

  it('derives the phase instead of trusting a stored one', () => {
    const answers = Object.fromEntries(QUESTIONS.map((q) => [q.id, q.options[0]!.id]));

    const scored = deserializeQuizSession(
      serializeQuizSession(sampleState({ answers, ranking: SAMPLE_RANKING }), NOW),
      NOW,
    );
    expect(scored?.phase).toBe('matches');

    const untouched = deserializeQuizSession(serializeQuizSession(sampleState(), NOW), NOW);
    expect(untouched?.phase).toBe('landing');
  });

  it('never persists the runtime-only hydrate flag', () => {
    const raw = serializeQuizSession(sampleState({ hydrated: true }), NOW);
    expect(raw).not.toContain('"hydrated"');
    expect(deserializeQuizSession(raw, NOW)?.hydrated).toBe(false);
  });
});

describe('rejection', () => {
  it('returns null for nothing, garbage and non-objects', () => {
    expect(deserializeQuizSession(null, NOW)).toBeNull();
    expect(deserializeQuizSession('', NOW)).toBeNull();
    expect(deserializeQuizSession('{not json', NOW)).toBeNull();
    expect(deserializeQuizSession('"a string"', NOW)).toBeNull();
    expect(deserializeQuizSession('42', NOW)).toBeNull();
    expect(deserializeQuizSession('null', NOW)).toBeNull();
  });

  it('discards the retired version 1 chat payload', () => {
    const legacy = JSON.stringify({
      version: 1,
      savedAt: NOW,
      state: {
        phase: 'conversation',
        sessionId: 'sess_old',
        nickname: 'Lila',
        messages: [{ id: 'm1', role: 'captain', text: 'يا هلا', createdAt: NOW }],
        enginePhase: 'intro',
        progress: { asked: 0, expected: 7 },
        engineState: { cursor: 3 },
        result: null,
        startedAt: NOW,
        updatedAt: NOW,
      },
    });
    expect(deserializeQuizSession(legacy, NOW)).toBeNull();
  });

  it('rejects a mismatched version', () => {
    const future = JSON.stringify({
      version: SCHEMA_VERSION + 1,
      savedAt: NOW,
      state: {
        sessionId: 'sess_x',
        username: null,
        questionIndex: 0,
        answers: {},
        ranking: null,
        selectedTrackId: null,
        startedAt: null,
        updatedAt: NOW,
      },
    });
    expect(deserializeQuizSession(future, NOW)).toBeNull();
  });

  it('rejects out-of-range indices and unknown tracks', () => {
    const base = {
      version: SCHEMA_VERSION,
      savedAt: NOW,
      state: {
        sessionId: 'sess_x',
        username: null,
        questionIndex: 0,
        answers: {},
        ranking: null,
        selectedTrackId: null,
        startedAt: null,
        updatedAt: NOW,
      },
    };
    expect(
      deserializeQuizSession(JSON.stringify({ ...base, state: { ...base.state, questionIndex: 99 } }), NOW),
    ).toBeNull();
    expect(
      deserializeQuizSession(
        JSON.stringify({ ...base, state: { ...base.state, selectedTrackId: 'quantum' } }),
        NOW,
      ),
    ).toBeNull();
  });

  it('expires a session past its TTL but keeps one just inside it', () => {
    const state = sampleState();
    const raw = serializeQuizSession(state, NOW);

    expect(deserializeQuizSession(raw, NOW + SESSION_TTL_MS - 1)).not.toBeNull();
    expect(deserializeQuizSession(raw, NOW + SESSION_TTL_MS + 1)).toBeNull();
  });

  it('drops answers the bank no longer recognises', () => {
    const answers = {
      q1: QUESTIONS[0]!.options[0]!.id,
      'retired-question': 'whatever',
      q2: 'an-option-that-was-deleted',
    };
    const raw = JSON.stringify({
      version: SCHEMA_VERSION,
      savedAt: NOW,
      state: {
        sessionId: 'sess_x',
        username: null,
        questionIndex: 0,
        answers,
        ranking: null,
        selectedTrackId: null,
        startedAt: null,
        updatedAt: NOW,
      },
    });
    const restored = deserializeQuizSession(raw, NOW);
    expect(restored?.answers).toEqual({ q1: QUESTIONS[0]!.options[0]!.id });
  });

  it('drops a selection that the stored ranking does not contain', () => {
    const trimmed = SAMPLE_RANKING.filter((m) => m.trackId !== 'cybersecurity');
    const raw = JSON.stringify({
      version: SCHEMA_VERSION,
      savedAt: NOW,
      state: {
        sessionId: 'sess_x',
        username: null,
        questionIndex: 0,
        answers: {},
        ranking: trimmed,
        selectedTrackId: 'cybersecurity',
        startedAt: null,
        updatedAt: NOW,
      },
    });
    const restored = deserializeQuizSession(raw, NOW);
    expect(restored?.selectedTrackId).toBeNull();
    expect(restored?.phase).toBe('matches');
  });
});

describe('storage access', () => {
  it('saves and loads through localStorage', () => {
    const state = sampleState({ answers: { q1: QUESTIONS[0]!.options[0]!.id } });
    saveQuizSession(state);
    const loaded = loadQuizSession(NOW);
    expect(loaded?.answers).toEqual(state.answers);
  });

  it('does not persist a pristine landing screen', () => {
    window.localStorage.clear();
    saveQuizSession(createInitialQuizState(NOW));
    expect(window.localStorage.getItem(storageKeys.session)).toBeNull();
  });

  it('clears the session and the legacy key together', () => {
    window.localStorage.setItem(storageKeys.legacySession, '{"version":1}');
    window.localStorage.setItem(storageKeys.username, 'Lila');
    saveQuizSession(sampleState());
    clearQuizSession();
    expect(window.localStorage.getItem(storageKeys.session)).toBeNull();
    expect(window.localStorage.getItem(storageKeys.legacySession)).toBeNull();
    expect(window.localStorage.getItem(storageKeys.username)).toBeNull();
  });

  it('purges the retired chat key on boot', () => {
    window.localStorage.setItem(storageKeys.legacySession, '{"version":1}');
    purgeLegacySession();
    expect(window.localStorage.getItem(storageKeys.legacySession)).toBeNull();
  });
});

describe('remembered username', () => {
  it('round trips and treats blank as absent', () => {
    saveRememberedUsername('Lila');
    expect(loadRememberedUsername()).toBe('Lila');

    saveRememberedUsername('   ');
    expect(loadRememberedUsername()).toBeNull();

    saveRememberedUsername(null);
    expect(loadRememberedUsername()).toBeNull();
  });
});

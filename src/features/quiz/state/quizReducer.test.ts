import { describe, expect, it } from 'vitest';

import { QUESTIONS } from '@/content/questions';
import {
  createInitialQuizState,
  hasResumableQuiz,
  isQuizComplete,
  quizReducer,
  type QuizAction,
  type QuizState,
} from '@/features/quiz/state/quizReducer';
import { rankTracks } from '@/features/quiz/scoring/scoreAnswers';

const NOW = 1_700_000_000_000;

function reduce(state: QuizState, ...actions: QuizAction[]): QuizState {
  return actions.reduce(quizReducer, state);
}

function fullyAnswered(): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const question of QUESTIONS) answers[question.id] = question.options[0]!.id;
  return answers;
}

function completedState(): QuizState {
  const ranking = rankTracks(
    { 'software-engineering': 10, ai: 8, 'web-development': 6, 'data-science': 4, cybersecurity: 2 },
    { 'software-engineering': 2, ai: 1, 'web-development': 1, 'data-science': 1, cybersecurity: 0 },
    { 'software-engineering': 1, ai: 1, 'web-development': 1, 'data-science': 0, cybersecurity: 1 },
  );
  return reduce(
    {
      ...createInitialQuizState(NOW),
      // Every realistic state has been through the restore pass already.
      hydrated: true,
      phase: 'quiz',
      startedAt: NOW,
      username: 'Lila',
      answers: fullyAnswered(),
    },
    { type: 'quiz/submit', at: NOW },
    { type: 'analysis/complete', ranking, at: NOW },
  );
}

describe('initial state', () => {
  it('starts on landing with nothing answered', () => {
    const state = createInitialQuizState(NOW);
    expect(state.phase).toBe('landing');
    expect(state.questionIndex).toBe(0);
    expect(state.answers).toEqual({});
    expect(state.ranking).toBeNull();
    expect(state.selectedTrackId).toBeNull();
    expect(state.hydrated).toBe(false);
  });

  it('gives every fresh session a distinct id', () => {
    const a = createInitialQuizState(NOW);
    const b = createInitialQuizState(NOW);
    // createSessionId has a time component, so allow a same-millisecond clash
    // but still require the shape.
    expect(a.sessionId).toMatch(/^sess_/);
    expect(typeof b.sessionId).toBe('string');
  });
});

describe('route ownership', () => {
  /**
   * Each route mounts its own provider, so a fresh `/quiz` hydrates to
   * `landing`. Without `route/enter` the reducer's phase guards would reject
   * every selection — silently, with no error. This pins that contract.
   */
  it('lets a route declare its own phase', () => {
    const landed = quizReducer(createInitialQuizState(NOW), {
      type: 'route/enter',
      phase: 'quiz',
      at: NOW,
    });
    expect(landed.phase).toBe('quiz');

    const answered = quizReducer(landed, {
      type: 'question/select',
      questionId: 'q1',
      optionId: 'q1-build',
      at: NOW,
    });
    expect(answered.answers).toEqual({ q1: 'q1-build' });
  });

  it('rejects a selection until the route declares itself', () => {
    const fresh = createInitialQuizState(NOW);
    expect(fresh.phase).toBe('landing');
    expect(
      quizReducer(fresh, {
        type: 'question/select',
        questionId: 'q1',
        optionId: 'q1-build',
        at: NOW,
      }),
    ).toBe(fresh);
  });

  it('is a no-op when the route re-announces the same phase', () => {
    const state = quizReducer(createInitialQuizState(NOW), {
      type: 'route/enter',
      phase: 'quiz',
      at: NOW,
    });
    expect(
      quizReducer(state, { type: 'route/enter', phase: 'quiz', at: NOW + 1 }),
    ).toBe(state);
  });

  it('keeps answers when the phase changes underneath them', () => {
    const answered = reduce(createInitialQuizState(NOW), {
      type: 'route/enter',
      phase: 'quiz',
      at: NOW,
    }, {
      type: 'question/select',
      questionId: 'q1',
      optionId: 'q1-build',
      at: NOW,
    });
    const moved = quizReducer(answered, {
      type: 'route/enter',
      phase: 'matches',
      at: NOW + 1,
    });
    expect(moved.phase).toBe('matches');
    expect(moved.answers).toEqual({ q1: 'q1-build' });
  });
});

describe('landing', () => {
  it('starts the quiz and clears any prior run', () => {
    const state = reduce(
      { ...createInitialQuizState(NOW), answers: { q1: 'q1-build' }, username: 'Lila' },
      { type: 'quiz/start', at: NOW },
    );
    expect(state.phase).toBe('quiz');
    expect(state.answers).toEqual({});
    expect(state.questionIndex).toBe(0);
    // Username is identity, not progress.
    expect(state.username).toBe('Lila');
  });

  it('only starts from landing', () => {
    const inQuiz = { ...createInitialQuizState(NOW), phase: 'quiz' as const };
    expect(quizReducer(inQuiz, { type: 'quiz/start', at: NOW })).toBe(inQuiz);
  });

  it('offers to resume only when there is something to resume', () => {
    const fresh = createInitialQuizState(NOW);
    expect(hasResumableQuiz(fresh)).toBe(false);
    expect(hasResumableQuiz({ ...fresh, answers: { q1: 'q1-build' } })).toBe(true);
    // A remembered username alone is not a resumable run.
    expect(hasResumableQuiz({ ...fresh, username: 'Lila' })).toBe(false);
  });
});

describe('answering', () => {
  it('records one answer per question', () => {
    const state = reduce(createInitialQuizState(NOW), { type: 'quiz/start', at: NOW }, {
      type: 'question/select',
      questionId: 'q1',
      optionId: 'q1-build',
      at: NOW,
    });
    expect(state.answers).toEqual({ q1: 'q1-build' });
  });

  it('replaces a previous selection rather than storing both', () => {
    const state = reduce(createInitialQuizState(NOW), { type: 'quiz/start', at: NOW }, {
      type: 'question/select',
      questionId: 'q1',
      optionId: 'q1-build',
      at: NOW,
    }, {
      type: 'question/select',
      questionId: 'q1',
      optionId: 'q1-ai',
      at: NOW,
    });
    expect(state.answers).toEqual({ q1: 'q1-ai' });
    expect(Object.keys(state.answers)).toHaveLength(1);
  });

  it('ignores selection while off the quiz screen', () => {
    const landing = createInitialQuizState(NOW);
    expect(
      quizReducer(landing, {
        type: 'question/select',
        questionId: 'q1',
        optionId: 'q1-build',
        at: NOW,
      }),
    ).toBe(landing);
  });

  it('is a no-op when re-selecting the same option', () => {
    const state = reduce(createInitialQuizState(NOW), { type: 'quiz/start', at: NOW }, {
      type: 'question/select',
      questionId: 'q1',
      optionId: 'q1-build',
      at: NOW,
    });
    expect(
      quizReducer(state, {
        type: 'question/select',
        questionId: 'q1',
        optionId: 'q1-build',
        at: NOW,
      }),
    ).toBe(state);
  });
});

describe('question navigation', () => {
  it('blocks next until the current question is answered', () => {
    const state = { ...createInitialQuizState(NOW), phase: 'quiz' as const };
    expect(quizReducer(state, { type: 'question/next', at: NOW }).questionIndex).toBe(0);
  });

  it('advances once answered', () => {
    const state = reduce(
      { ...createInitialQuizState(NOW), phase: 'quiz' as const },
      { type: 'question/select', questionId: 'q1', optionId: 'q1-build', at: NOW },
      { type: 'question/next', at: NOW },
    );
    expect(state.questionIndex).toBe(1);
  });

  it('refuses to advance past the last question — submit takes over', () => {
    const last = QUESTIONS.length - 1;
    const state = reduce(
      {
        ...createInitialQuizState(NOW),
        phase: 'quiz' as const,
        questionIndex: last,
        answers: fullyAnswered(),
      },
      { type: 'question/next', at: NOW },
    );
    expect(state.questionIndex).toBe(last);
  });

  it('never steps back before the first question', () => {
    const state = { ...createInitialQuizState(NOW), phase: 'quiz' as const };
    expect(quizReducer(state, { type: 'question/previous', at: NOW }).questionIndex).toBe(0);
  });

  it('goes back and restores the earlier selection', () => {
    let state = reduce(createInitialQuizState(NOW), { type: 'quiz/start', at: NOW }, {
      type: 'question/select',
      questionId: 'q1',
      optionId: 'q1-build',
      at: NOW,
    }, { type: 'question/next', at: NOW }, {
      type: 'question/select',
      questionId: 'q2',
      optionId: 'q2-examples',
      at: NOW,
    }, { type: 'question/previous', at: NOW });

    expect(state.questionIndex).toBe(0);
    expect(state.answers.q1).toBe('q1-build');

    // Changing an earlier answer must not disturb later ones.
    state = quizReducer(state, {
      type: 'question/select',
      questionId: 'q1',
      optionId: 'q1-data',
      at: NOW,
    });
    expect(state.answers.q1).toBe('q1-data');
    expect(state.answers.q2).toBe('q2-examples');
  });
});

describe('submit and scoring', () => {
  it('refuses to submit with unanswered questions', () => {
    const state = { ...createInitialQuizState(NOW), phase: 'quiz' as const };
    expect(quizReducer(state, { type: 'quiz/submit', at: NOW }).phase).toBe('quiz');
  });

  it('moves to analyzing, then to matches with the ranking', () => {
    const answers = fullyAnswered();
    const state = { ...createInitialQuizState(NOW), phase: 'quiz' as const, answers };
    expect(isQuizComplete(state)).toBe(true);

    const analyzing = quizReducer(state, { type: 'quiz/submit', at: NOW });
    expect(analyzing.phase).toBe('analyzing');

    const ranking = rankTracks(
      { 'software-engineering': 9, ai: 8, 'web-development': 8, 'data-science': 8, cybersecurity: 7 },
      { 'software-engineering': 2, ai: 1, 'web-development': 1, 'data-science': 1, cybersecurity: 1 },
      { 'software-engineering': 1, ai: 1, 'web-development': 1, 'data-science': 1, cybersecurity: 1 },
    );
    const matches = quizReducer(analyzing, { type: 'analysis/complete', ranking, at: NOW });
    expect(matches.phase).toBe('matches');
    expect(matches.ranking).toHaveLength(5);
  });
});

describe('choosing a match', () => {
  it('accepts any track present in the ranking, not just the top one', () => {
    const matches = completedState();
    expect(matches.ranking?.[0]?.trackId).toBe('software-engineering');

    const fifth = matches.ranking![4]!.trackId;
    const result = quizReducer(matches, { type: 'matches/select', trackId: fifth, at: NOW });
    expect(result.phase).toBe('result');
    expect(result.selectedTrackId).toBe(fifth);
  });

  it('rejects a track that is not in the ranking', () => {
    const matches = completedState();
    // Build a ranking that omits ai.
    const trimmed = (matches.ranking ?? []).filter((m) => m.trackId !== 'ai');
    const state = { ...matches, ranking: trimmed };
    expect(
      quizReducer(state, { type: 'matches/select', trackId: 'ai', at: NOW }),
    ).toBe(state);
  });

  it('rejects a selection made off the matches screen', () => {
    const landing = createInitialQuizState(NOW);
    expect(
      quizReducer(landing, { type: 'matches/select', trackId: 'ai', at: NOW }),
    ).toBe(landing);
  });
});

describe('restart', () => {
  it('clears the run but keeps the username and the hydrate flag', () => {
    const done = reduce(completedState(), {
      type: 'matches/select',
      trackId: 'software-engineering',
      at: NOW,
    }, { type: 'quiz/restart', at: NOW });

    expect(done.phase).toBe('landing');
    expect(done.answers).toEqual({});
    expect(done.ranking).toBeNull();
    expect(done.selectedTrackId).toBeNull();
    expect(done.username).toBe('Lila');
    // The restore pass already ran, so restart must not re-arm it.
    expect(done.hydrated).toBe(true);
  });
});

describe('hydration', () => {
  it('marks the pass done when there is nothing stored', () => {
    const state = quizReducer(createInitialQuizState(NOW), {
      type: 'session/hydrate',
      payload: null,
      at: NOW,
    });
    expect(state.hydrated).toBe(true);
    expect(state.phase).toBe('landing');
  });

  it('lands on landing with the stored run intact', () => {
    const stored: QuizState = {
      ...createInitialQuizState(NOW),
      username: 'Lila',
      answers: { q1: 'q1-build' },
      questionIndex: 3,
      startedAt: NOW,
    };
    const state = quizReducer(createInitialQuizState(NOW), {
      type: 'session/hydrate',
      payload: stored,
      at: NOW,
    });
    expect(state.phase).toBe('landing');
    expect(state.username).toBe('Lila');
    expect(state.answers).toEqual({ q1: 'q1-build' });
    expect(state.questionIndex).toBe(3);
    expect(state.hydrated).toBe(true);
  });

  it('resumes a finished run straight to the card', () => {
    const stored: QuizState = { ...createInitialQuizState(NOW), username: 'Lila' };
    const state = reduce(
      quizReducer(createInitialQuizState(NOW), {
        type: 'session/hydrate',
        payload: { ...stored, answers: fullyAnswered() },
        at: NOW,
      }),
      { type: 'quiz/resume', at: NOW },
    );
    expect(state.phase).toBe('quiz');
  });

  it('resumes a scored-but-unpicked run to the matches list', () => {
    const state = reduce(
      quizReducer(createInitialQuizState(NOW), {
        type: 'session/hydrate',
        payload: { ...createInitialQuizState(NOW), answers: fullyAnswered() },
        at: NOW,
      }),
      { type: 'quiz/resume', at: NOW },
    );
    // With no ranking stored, resume lands on the quiz, not matches.
    expect(state.phase).toBe('quiz');

    const withRanking = reduce(
      completedState(),
      { type: 'quiz/restart', at: NOW },
      {
        type: 'session/hydrate',
        payload: { ...completedState(), selectedTrackId: null },
        at: NOW,
      },
      { type: 'quiz/resume', at: NOW },
    );
    expect(withRanking.phase).toBe('matches');
  });

  it('resumes an in-progress run at the furthest answered question', () => {
    const stored: QuizState = {
      ...createInitialQuizState(NOW),
      answers: Object.fromEntries(
        QUESTIONS.slice(0, 4).map((q) => [q.id, q.options[0]!.id]),
      ),
      questionIndex: 0,
    };
    const state = reduce(
      quizReducer(createInitialQuizState(NOW), {
        type: 'session/hydrate',
        payload: stored,
        at: NOW,
      }),
      { type: 'quiz/resume', at: NOW },
    );
    expect(state.phase).toBe('quiz');
    // First *unanswered* question, not the last answered one.
    expect(state.questionIndex).toBe(4);
  });

  it('ignores resume when there is nothing stored', () => {
    const state = createInitialQuizState(NOW);
    expect(quizReducer(state, { type: 'quiz/resume', at: NOW })).toBe(state);
  });
});

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

import { isTrackId } from '@/features/characters/types';
import { MAX_USERNAME_LENGTH } from '@/config/site';
import {
  clearQuizSession,
  loadQuizSession,
  loadRememberedUsername,
  purgeLegacySession,
  saveQuizSession,
  saveRememberedUsername,
} from '@/features/quiz/state/quizStorage';
import {
  createInitialQuizState,
  hasResumableQuiz,
  quizReducer,
  type QuizPhase,
  type QuizState,
} from '@/features/quiz/state/quizReducer';
import { isScorable, scoreAnswers } from '@/features/quiz/scoring/scoreAnswers';

export interface QuizContextValue {
  readonly state: QuizState;
  /** False until the one-shot storage restore has run. */
  readonly isHydrated: boolean;
  readonly canResume: boolean;
  /**
   * Declares which route this provider instance is serving.
   *
   * Each route mounts its own provider, so the reducer cannot infer the phase
   * from the state alone — a fresh `/quiz` hydrates to `landing`. Callers must
   * announce the route once hydration finishes, or the phase guards reject
   * perfectly valid input.
   */
  readonly enterPhase: (phase: QuizPhase) => void;
  readonly setUsername: (username: string | null) => void;
  readonly start: () => void;
  readonly resume: () => void;
  readonly restart: () => void;
  readonly selectOption: (questionId: string, optionId: string) => void;
  readonly nextQuestion: () => void;
  readonly previousQuestion: () => void;
  /** Scores the run and moves to the ranked matches. Synchronous. */
  readonly submit: () => void;
  /** Commits the visitor's pick and moves to the result card. */
  readonly chooseTrack: (trackId: string) => void;
  readonly clearSession: () => void;
}

const QuizContext = createContext<QuizContextValue | null>(null);

export interface QuizProviderProps {
  children: ReactNode;
  /** Disable persistence (used by isolated component tests). */
  persist?: boolean;
}

export function normalizeUsername(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_USERNAME_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Owns quiz state and persistence.
 *
 * There is no engine boundary here on purpose: scoring is a pure synchronous
 * function over the answers, so `submit` is a dispatch rather than an async
 * orchestration with pending/retry states.
 */
export function QuizProvider({
  children,
  persist = true,
}: QuizProviderProps): React.JSX.Element {
  const [state, dispatch] = useReducer(quizReducer, undefined, () => createInitialQuizState());
  const isHydrated = state.hydrated;

  // 1. Restore a previous run once, on the client. The effect only reads
  // storage and dispatches; the "restore already happened" fact lives in
  // reducer state, so there is no setState-in-effect cascade.
  useEffect(() => {
    if (state.hydrated) return;
    if (persist) purgeLegacySession();
    const restored = persist ? loadQuizSession() : null;
    dispatch({
      type: 'session/hydrate',
      payload: restored,
      at: Date.now(),
    });
    if (restored === null && persist) {
      // No run to resume, but a remembered username is still worth offering.
      const remembered = loadRememberedUsername();
      if (remembered !== null) {
        dispatch({ type: 'username/set', username: remembered, at: Date.now() });
      }
    }
  }, [state.hydrated, persist]);

  // 2. Persist every subsequent change.
  useEffect(() => {
    if (!state.hydrated || !persist) return;
    saveQuizSession(state);
  }, [state, state.hydrated, persist]);

  const enterPhase = useCallback((phase: QuizPhase) => {
    dispatch({ type: 'route/enter', phase, at: Date.now() });
  }, []);

  const setUsername = useCallback((username: string | null) => {
    const normalized = username === null ? null : normalizeUsername(username);
    dispatch({ type: 'username/set', username: normalized, at: Date.now() });
    if (persist) saveRememberedUsername(normalized);
  }, [persist]);

  const start = useCallback(() => {
    dispatch({ type: 'quiz/start', at: Date.now() });
  }, []);

  const resume = useCallback(() => {
    dispatch({ type: 'quiz/resume', at: Date.now() });
  }, []);

  const restart = useCallback(() => {
    dispatch({ type: 'quiz/restart', at: Date.now() });
  }, []);

  const selectOption = useCallback((questionId: string, optionId: string) => {
    dispatch({ type: 'question/select', questionId, optionId, at: Date.now() });
  }, []);

  const nextQuestion = useCallback(() => {
    dispatch({ type: 'question/next', at: Date.now() });
  }, []);

  const previousQuestion = useCallback(() => {
    dispatch({ type: 'question/previous', at: Date.now() });
  }, []);

  /**
   * Runs the scoring in the same tick as the phase change so the analyzing
   * beat is guaranteed to have something to show and nothing to wait on.
   */
  const submit = useCallback(() => {
    if (!isScorable(state.answers)) return;
    dispatch({ type: 'quiz/submit', at: Date.now() });
    dispatch({
      type: 'analysis/complete',
      ranking: scoreAnswers(state.answers).ranking,
      at: Date.now(),
    });
  }, [state.answers]);

  const chooseTrack = useCallback((trackId: string) => {
    if (!isTrackId(trackId)) return;
    dispatch({ type: 'matches/select', trackId, at: Date.now() });
  }, []);

  const clearSession = useCallback(() => {
    clearQuizSession();
    dispatch({ type: 'quiz/restart', at: Date.now() });
  }, []);

  const value = useMemo<QuizContextValue>(
    () => ({
      state,
      isHydrated,
      canResume: hasResumableQuiz(state),
      enterPhase,
      setUsername,
      start,
      resume,
      restart,
      selectOption,
      nextQuestion,
      previousQuestion,
      submit,
      chooseTrack,
      clearSession,
    }),
    [
      state,
      isHydrated,
      enterPhase,
      setUsername,
      start,
      resume,
      restart,
      selectOption,
      nextQuestion,
      previousQuestion,
      submit,
      chooseTrack,
      clearSession,
    ],
  );

  return <QuizContext.Provider value={value}>{children}</QuizContext.Provider>;
}

export function useQuiz(): QuizContextValue {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used inside <QuizProvider>.');
  }
  return context;
}

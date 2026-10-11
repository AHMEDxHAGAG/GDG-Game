import { QUESTIONS } from '@/content/questions';
import { TRACK_IDS, type TrackId } from '@/features/characters/types';
import { createSessionId } from '@/lib/ids';
import type { RankedMatch } from '@/features/quiz/scoring/scoreAnswers';
import type { QuizAnswers } from '@/features/quiz/types';

/**
 * Quiz lifecycle.
 *
 * ```
 * landing ─▶ quiz ⇄ quiz ─▶ analyzing ─▶ matches ─▶ result
 *               │                          │
 *               └────── restart ───────────┘
 * ```
 *
 * `analyzing` is a presentation beat only — scoring is synchronous, so there
 * is nothing to wait on and nothing to fail.
 */
export type QuizPhase = 'landing' | 'quiz' | 'analyzing' | 'matches' | 'result';

export interface QuizState {
  readonly phase: QuizPhase;
  readonly sessionId: string;
  /** Printed on the exported card. Null when the visitor skipped it. */
  readonly username: string | null;
  /** 0-based index into `QUESTIONS`. */
  readonly questionIndex: number;
  readonly answers: QuizAnswers;
  /** Populated once the quiz is scored; null before that. */
  readonly ranking: readonly RankedMatch[] | null;
  /** The user's pick from the matches screen — not necessarily rank 1. */
  readonly selectedTrackId: TrackId | null;
  readonly startedAt: number | null;
  readonly updatedAt: number;
  /**
   * True once the one-shot restore pass has run. Runtime-only and never
   * persisted: a fresh page load always has to re-read storage before it may
   * write to it again.
   */
  readonly hydrated: boolean;
}

export type QuizAction =
  | { type: 'session/hydrate'; payload: QuizState | null; at: number }
  | { type: 'route/enter'; phase: QuizPhase; at: number }
  | { type: 'username/set'; username: string | null; at: number }
  | { type: 'quiz/start'; at: number }
  | { type: 'quiz/resume'; at: number }
  | { type: 'question/select'; questionId: string; optionId: string; at: number }
  | { type: 'question/next'; at: number }
  | { type: 'question/previous'; at: number }
  | { type: 'quiz/submit'; at: number }
  | { type: 'analysis/complete'; ranking: readonly RankedMatch[]; at: number }
  | { type: 'matches/select'; trackId: TrackId; at: number }
  | { type: 'quiz/restart'; at: number };

export function createInitialQuizState(now = Date.now()): QuizState {
  return {
    phase: 'landing',
    sessionId: createSessionId(),
    username: null,
    questionIndex: 0,
    answers: {},
    ranking: null,
    selectedTrackId: null,
    startedAt: null,
    updatedAt: now,
    hydrated: false,
  };
}

/** True when every question has an answer — the only case the app will score. */
export function isQuizComplete(state: QuizState): boolean {
  return QUESTIONS.every((question) => state.answers[question.id] !== undefined);
}

/** True when the landing screen should offer "continue" instead of "start". */
export function hasResumableQuiz(state: QuizState): boolean {
  return (
    Object.keys(state.answers).length > 0 ||
    state.ranking !== null ||
    state.selectedTrackId !== null
  );
}

export function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'session/hydrate': {
      // Nothing stored: mark the pass done so it never repeats.
      if (action.payload === null) return { ...state, hydrated: true };
      // Land back on landing with the stored run intact, so the screen can
      // offer continue-vs-restart. Restoring into the middle of the quiz
      // directly would hide the choice from someone who just wants to start
      // over.
      return {
        ...action.payload,
        phase: 'landing',
        hydrated: true,
        updatedAt: action.at,
      };
    }

    case 'route/enter': {
      // Every route mounts its own provider, so the route has to declare what
      // it is. Without this, `/quiz` hydrates to `landing` and every
      // `question/select` is silently dropped by its phase guard.
      if (state.phase === action.phase) return state;
      return { ...state, phase: action.phase, updatedAt: action.at };
    }

    case 'username/set':
      return { ...state, username: action.username, updatedAt: action.at };

    case 'quiz/start': {
      if (state.phase !== 'landing') return state;
      // A fresh run keeps the username already typed on the landing screen —
      // it is identity, not progress.
      return {
        ...state,
        phase: 'quiz',
        questionIndex: 0,
        answers: {},
        ranking: null,
        selectedTrackId: null,
        startedAt: action.at,
        updatedAt: action.at,
      };
    }

    case 'quiz/resume': {
      if (state.phase !== 'landing') return state;
      if (!hasResumableQuiz(state)) return state;

      // Finished runs jump straight back to the card they produced.
      if (state.selectedTrackId !== null) {
        return { ...state, phase: 'result', updatedAt: action.at };
      }
      // Scored but not yet picked: back to the ranked list.
      if (state.ranking !== null) {
        return { ...state, phase: 'matches', updatedAt: action.at };
      }
      // Otherwise carry on at the first question still waiting for an answer.
      // Resuming *on* the last answered one would make the visitor press Next
      // just to get back to where they stopped.
      const furthestAnswered = QUESTIONS.reduce(
        (lastIndex, question, index) =>
          state.answers[question.id] !== undefined ? index : lastIndex,
        -1,
      );
      return {
        ...state,
        phase: 'quiz',
        questionIndex: Math.min(furthestAnswered + 1, QUESTIONS.length - 1),
        startedAt: state.startedAt ?? action.at,
        updatedAt: action.at,
      };
    }

    case 'question/select': {
      if (state.phase !== 'quiz') return state;
      // Re-selecting is allowed until submit, and replaces the previous pick.
      if (state.answers[action.questionId] === action.optionId) return state;
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.optionId },
        updatedAt: action.at,
      };
    }

    case 'question/next': {
      if (state.phase !== 'quiz') return state;
      const question = QUESTIONS[state.questionIndex];
      // Next is blocked until the current question is answered.
      if (question === undefined || state.answers[question.id] === undefined) return state;
      // The last question does not advance — the UI calls `quiz/submit`.
      if (state.questionIndex >= QUESTIONS.length - 1) return state;
      return { ...state, questionIndex: state.questionIndex + 1, updatedAt: action.at };
    }

    case 'question/previous': {
      if (state.phase !== 'quiz') return state;
      if (state.questionIndex <= 0) return state;
      return { ...state, questionIndex: state.questionIndex - 1, updatedAt: action.at };
    }

    case 'quiz/submit': {
      if (state.phase !== 'quiz') return state;
      if (!isQuizComplete(state)) return state;
      return { ...state, phase: 'analyzing', updatedAt: action.at };
    }

    case 'analysis/complete': {
      if (state.phase !== 'analyzing') return state;
      return {
        ...state,
        phase: 'matches',
        ranking: action.ranking,
        updatedAt: action.at,
      };
    }

    case 'matches/select': {
      // Only a track that is actually in the ranking may be selected, so a
      // tampered route or stale link cannot invent a card.
      if (state.phase !== 'matches') return state;
      if (!(TRACK_IDS as readonly string[]).includes(action.trackId)) return state;
      if (!state.ranking?.some((match) => match.trackId === action.trackId)) return state;
      return {
        ...state,
        phase: 'result',
        selectedTrackId: action.trackId,
        updatedAt: action.at,
      };
    }

    case 'quiz/restart':
      // A restart is not a fresh page load: the restore pass already ran, so
      // it must not run again.
      return {
        ...createInitialQuizState(action.at),
        // Identity is not progress — keep the name the visitor already gave.
        username: state.username,
        hydrated: state.hydrated,
      };

    default:
      return state;
  }
}

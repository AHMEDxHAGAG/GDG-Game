import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateGroupsScene } from '@/features/teams/components/CreateGroupsScene';
import { VisitorProvider } from '@/features/teams/visitor';
import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { createInitialQuizState } from '@/features/quiz/state/quizReducer';
import { loadQuizSession, saveQuizSession } from '@/features/quiz/state/quizStorage';
import { scoreAnswers } from '@/features/quiz/scoring/scoreAnswers';
import { QUESTIONS } from '@/content/questions';
import { ui } from '@/content/ui';
import { claimVisitor, createRoom, joinRoom } from '@/features/teams/api';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('@/lib/supabase/env', () => ({ isSupabaseConfigured: true }));
vi.mock('@/features/teams/api', () => ({ claimVisitor: vi.fn(), createRoom: vi.fn(), joinRoom: vi.fn() }));
vi.mock('@/components/shared/NauticalBackground', () => ({
  NauticalBackground: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

beforeEach(() => {
  vi.mocked(claimVisitor).mockReset().mockImplementation(async (_id, _token, name) => ({
    ok: true, data: { displayName: name },
  }));
  vi.mocked(createRoom).mockReset().mockResolvedValue({ ok: false, error: 'room_full' });
  vi.mocked(joinRoom).mockReset().mockResolvedValue({ ok: false, error: 'room_full' });
  const answers = Object.fromEntries(QUESTIONS.map((question) => [question.id, question.options[0]!.id]));
  saveQuizSession({ ...createInitialQuizState(), answers, ranking: scoreAnswers(answers).ranking,
    selectedTrackId: 'ai', hydrated: true });
});

async function acceptName() {
  render(<VisitorProvider><QuizProvider><CreateGroupsScene /></QuizProvider></VisitorProvider>);
  fireEvent.change(await screen.findByTestId('ask-name-input'), { target: { value: ' Mona ' } });
  fireEvent.click(screen.getByRole('button', { name: ui.teams.askNameCta }));
  await screen.findByTestId('create-groups-name');
}

describe('team hub identity', () => {
  it('updates the persisted quiz username when accepting a team name', async () => {
    await acceptName();
    await waitFor(() => expect(loadQuizSession()?.username).toBe('Mona'));
  });

  it.each(['create', 'join'] as const)('registers before %s and stops on failure', async (mode) => {
    await acceptName();
    vi.mocked(claimVisitor).mockResolvedValue({ ok: false, error: 'unknown_visitor' });
    fireEvent.click(screen.getByRole('button', { name: new RegExp(mode === 'create' ? ui.teams.createOptionTitle : ui.teams.joinOptionTitle) }));
    fireEvent.change(screen.getByTestId(mode === 'create' ? 'room-name-input' : 'room-code-input'), {
      target: { value: mode === 'create' ? 'Crew' : 'ABC123' },
    });
    fireEvent.click(screen.getByRole('button', { name: mode === 'create' ? ui.teams.createCta : ui.teams.joinCta }));
    await screen.findByTestId('create-groups-error');
    expect(claimVisitor).toHaveBeenCalled();
    expect(createRoom).not.toHaveBeenCalled();
    expect(joinRoom).not.toHaveBeenCalled();
  });

  it('flushes registration before an immediate first-time join', async () => {
    await acceptName();
    fireEvent.click(screen.getByRole('button', { name: new RegExp(ui.teams.joinOptionTitle) }));
    fireEvent.change(screen.getByTestId('room-code-input'), { target: { value: 'ABC123' } });
    fireEvent.click(screen.getByRole('button', { name: ui.teams.joinCta }));
    await waitFor(() => expect(joinRoom).toHaveBeenCalledTimes(1));
    expect(vi.mocked(claimVisitor).mock.invocationCallOrder[0]).toBeLessThan(vi.mocked(joinRoom).mock.invocationCallOrder[0]!);
  });
});

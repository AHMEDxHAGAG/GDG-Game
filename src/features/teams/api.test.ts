import { beforeEach, describe, expect, it, vi } from 'vitest';
import { claimVisitor, createRoom, joinRoom, leaveRoom, loadRoom, renameRoom } from '@/features/teams/api';

const { rpc, executed } = vi.hoisted(() => ({ rpc: vi.fn(), executed: vi.fn() }));
vi.mock('@/lib/supabase/client', () => ({ getSupabaseClient: () => ({ rpc }) }));

beforeEach(() => {
  rpc.mockReset();
  executed.mockReset();
  // Like PostgREST, this builder does nothing until its then method is consumed.
  rpc.mockImplementation((name, args) => ({
    then(resolve: (outcome: unknown) => void) {
      executed(name, args);
      resolve({ data: name === 'claim_visitor' ? { display_name: 'Ahmed' } : {
        id: 'room', name: 'Crew', owner_id: 'visitor', join_code: 'ABC123', members: [],
      }, error: null });
    },
  }));
});

describe('credential-based room RPCs', () => {
  it('consumes the lazy claim builder', async () => {
    expect(await claimVisitor('visitor', 'secret', 'Ahmed')).toEqual({ ok: true, data: { displayName: 'Ahmed' } });
    expect(executed).toHaveBeenCalledExactlyOnceWith('claim_visitor', {
      p_visitor_id: 'visitor', p_visitor_token: 'secret', p_name: 'Ahmed',
    });
  });

  it('sends credentials on every mutation', async () => {
    await createRoom('visitor', 'secret', 'Crew', 'ai');
    await joinRoom('visitor', 'secret', 'abc123', 'ai');
    await renameRoom('visitor', 'secret', 'room', 'New Crew');
    await leaveRoom('visitor', 'secret', 'room');
    expect(executed).toHaveBeenCalledTimes(4);
    for (const [, args] of executed.mock.calls) {
      expect(args).toMatchObject({ p_visitor_id: 'visitor', p_visitor_token: 'secret' });
    }
  });

  it('never sends the secret credential on public roster reads', async () => {
    expect((await loadRoom('abc123', 'visitor')).ok).toBe(true);
    expect(executed).toHaveBeenCalledExactlyOnceWith('get_room', { p_code: 'ABC123' });
  });
});

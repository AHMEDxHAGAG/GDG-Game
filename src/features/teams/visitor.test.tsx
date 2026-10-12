import { act, render, screen, waitFor } from '@testing-library/react';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VisitorProvider, useVisitor, type VisitorContextValue } from '@/features/teams/visitor';
import { claimVisitor } from '@/features/teams/api';
import { storageKeys } from '@/config/site';

vi.mock('@/lib/supabase/env', () => ({ isSupabaseConfigured: true }));
vi.mock('@/features/teams/api', () => ({ claimVisitor: vi.fn() }));

let visitor: VisitorContextValue;
function Probe() {
  const value = useVisitor();
  useEffect(() => { visitor = value; }, [value]);
  return <span>{value.isReady ? 'ready' : 'loading'}</span>;
}

beforeEach(() => {
  vi.mocked(claimVisitor).mockReset().mockImplementation(async (_id, _token, name) => ({
    ok: true, data: { displayName: name },
  }));
});
afterEach(() => vi.useRealTimers());

async function mount() {
  const mounted = render(<VisitorProvider><Probe /></VisitorProvider>);
  await screen.findByText('ready');
  return mounted;
}

describe('visitor registration', () => {
  it('executes the settled name write with the secret token', async () => {
    await mount();
    vi.useFakeTimers();
    act(() => { visitor.saveName('First'); visitor.saveName(' Ahmed '); });
    await act(async () => { await vi.advanceTimersByTimeAsync(700); });
    expect(claimVisitor).toHaveBeenCalledExactlyOnceWith(visitor.visitorId, visitor.visitorToken, 'Ahmed');
  });

  it('flushes a pending debounce and waits for successful registration', async () => {
    await mount();
    let finish!: (value: Awaited<ReturnType<typeof claimVisitor>>) => void;
    vi.mocked(claimVisitor).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    act(() => visitor.saveName('Mona'));
    const registered = visitor.ensureRegistered();
    let done = false;
    void registered.then(() => { done = true; });
    await waitFor(() => expect(claimVisitor).toHaveBeenCalledTimes(1));
    expect(done).toBe(false);
    await act(async () => finish({ ok: true, data: { displayName: 'Mona' } }));
    expect(await registered).toEqual({ ok: true, data: { displayName: 'Mona' } });
  });

  it('reports a failed registration instead of letting the caller join', async () => {
    await mount();
    vi.mocked(claimVisitor).mockResolvedValueOnce({ ok: false, error: 'unknown_visitor' });
    act(() => visitor.saveName('Mona'));
    expect(await visitor.ensureRegistered()).toEqual({ ok: false, error: 'unknown_visitor' });
  });

  it('handles rejected network requests without an unhandled rejection', async () => {
    await mount();
    vi.mocked(claimVisitor).mockRejectedValueOnce(new Error('offline'));
    act(() => visitor.saveName('Mona'));
    expect(await visitor.ensureRegistered()).toEqual({ ok: false, error: 'unexpected' });
  });

  it('cancels the pending debounce on unmount', async () => {
    const mounted = await mount();
    vi.useFakeTimers();
    act(() => visitor.saveName('Mona'));
    mounted.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    expect(claimVisitor).not.toHaveBeenCalled();
  });

  it('renders without looping when storage writes fail', async () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    await mount();
    expect(visitor.visitorId).not.toBe('');
  });

  it('serializes claims so an older response cannot overwrite a new name', async () => {
    localStorage.setItem(storageKeys.username, 'Old');
    let finish!: (value: Awaited<ReturnType<typeof claimVisitor>>) => void;
    vi.mocked(claimVisitor).mockImplementationOnce(() => new Promise((resolve) => { finish = resolve; }));
    render(<VisitorProvider><Probe /></VisitorProvider>);
    await waitFor(() => expect(claimVisitor).toHaveBeenCalledTimes(1));
    act(() => visitor.saveName('New'));
    const registered = visitor.ensureRegistered();
    expect(claimVisitor).toHaveBeenCalledTimes(1);
    await act(async () => finish({ ok: true, data: { displayName: 'Old' } }));
    await act(async () => { await registered; });
    expect(visitor.name).toBe('New');
    expect(vi.mocked(claimVisitor).mock.calls.map((args) => args[2])).toEqual(['Old', 'New']);
  });
});

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';

import { isSupabaseConfigured } from '@/lib/supabase/env';
import { storageKeys, MAX_USERNAME_LENGTH } from '@/config/site';
import { claimVisitor } from '@/features/teams/api';
import type { RoomResult } from '@/features/teams/types';
import { readVisitorIdentity, serverIdentity } from '@/features/teams/visitorIdentity';

/**
 * Who the visitor is, with no login.
 *
 * Public IDs identify roster members; a separate random device token authorizes
 * mutations. Both live in localStorage (or memory when storage is unavailable),
 * but only IDs are returned in public rosters. No login or OAuth is required.
 */

export interface VisitorContextValue {
  /** The stable device id. Empty during the server render, real on the client. */
  readonly visitorId: string;
  /** Secret device credential. Never render it or send it to a roster read. */
  readonly visitorToken: string;
  /** The visitor's name as stored server-side, or `null` until they give one. */
  readonly name: string | null;
  /** False until the stored name has been read back. Always true when offline. */
  readonly isReady: boolean;
  /** True when there is no project to talk to and nothing can be recorded. */
  readonly isOffline: boolean;
  /** Renames the visitor. Optimistic, debounced, and safe to call per keystroke. */
  readonly saveName: (name: string) => void;
  /** Flushes pending name writes and verifies registration before create/join. */
  readonly ensureRegistered: () => Promise<RoomResult<{ displayName: string }>>;
}

const VisitorContext = createContext<VisitorContextValue | null>(null);

/*
 * localStorage is an external mutable store, so it is read through
 * `useSyncExternalStore` rather than a `useState` + `useEffect` pair. That gets
 * two things for free: the id is correct on the very first client render
 * instead of one render late, and a second tab writing a different id
 * propagates without either tab noticing stale state.
 */

/** No `storage` listener on this side; other tabs are what we care about. */
function subscribeToVisitorId(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  return () => window.removeEventListener('storage', onChange);
}

/** No localStorage on the server, so there is no id to report yet. */
const getServerIdentity = () => serverIdentity;

export function normalizeVisitorName(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_USERNAME_LENGTH);
  return trimmed.length > 0 ? trimmed : null;
}

export function VisitorProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const isOffline = !isSupabaseConfigured;

  const { visitorId, visitorToken } = useSyncExternalStore(
    subscribeToVisitorId,
    readVisitorIdentity,
    getServerIdentity,
  );

  const [name, setName] = useState<string | null>(null);
  // Track the hydrated identity so another tab switching devices re-hydrates.
  const [loadedId, setLoadedId] = useState('');
  const latestName = useRef<string | null>(null);
  const nameRevision = useRef(0);
  const timer = useRef<number | undefined>(undefined);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  // Serialize claims so an older name cannot overwrite a newer one server-side.
  const register = useCallback((value: string) => {
    const request = queue.current.then(async (): Promise<RoomResult<{ displayName: string }>> => {
      try {
        return await claimVisitor(visitorId, visitorToken, value);
      } catch {
        return { ok: false, error: 'unexpected' };
      }
    });
    queue.current = request;
    return request;
  }, [visitorId, visitorToken]);

  useEffect(() => {
    if (isOffline || visitorId === '') return;
    let disposed = false;
    const revision = nameRevision.current;
    void (async () => {
      const remembered = readRememberedName();
      const outcome = remembered === null ? null : await register(remembered);
      if (disposed) return;
      const restored = outcome?.ok ? outcome.data.displayName : remembered;
      if (revision === nameRevision.current) {
        latestName.current = restored;
        setName(restored);
      }
      setLoadedId(visitorId);
    })();

    return () => {
      disposed = true;
    };
  }, [isOffline, visitorId, register]);

  /*
   * Rename, debounced.
   *
   * Callers pass the raw field value on every keystroke, so writing straight
   * through would be one RPC per character. The timer collapses a burst into
   * one call and is short enough that the name is stored long before anyone
   * could leave the screen.
   *
   * The local name is updated immediately, so the field and the roster agree
   * while the visitor is still typing.
   */
  const saveName = useCallback(
    (raw: string) => {
      const normalized = normalizeVisitorName(raw);
      nameRevision.current += 1;
      latestName.current = normalized;
      setName(normalized);
      if (normalized !== null) writeRememberedName(normalized);

      window.clearTimeout(timer.current);
      if (normalized === null) return;

      timer.current = window.setTimeout(() => {
        void register(normalized);
      }, 700);
    },
    [register],
  );

  useEffect(() => () => window.clearTimeout(timer.current), [visitorId]);

  const ensureRegistered = useCallback(async (): Promise<RoomResult<{ displayName: string }>> => {
    window.clearTimeout(timer.current);
    const value = latestName.current;
    if (value === null) return { ok: false, error: 'invalid_name' };
    return register(value);
  }, [register]);

  const value = useMemo<VisitorContextValue>(
    () => ({
      visitorId, visitorToken, name, isReady: isOffline || loadedId === visitorId,
      isOffline, saveName, ensureRegistered,
    }),
    [visitorId, visitorToken, name, isOffline, loadedId, saveName, ensureRegistered],
  );

  return <VisitorContext.Provider value={value}>{children}</VisitorContext.Provider>;
}

export function useVisitor(): VisitorContextValue {
  const context = useContext(VisitorContext);
  if (!context) throw new Error('useVisitor must be used inside <VisitorProvider>.');
  return context;
}

/*
 * The name is mirrored into the quiz's own storage, which is what the result
 * card prints. One name, entered once, used by both.
 */
function readRememberedName(): string | null {
  try {
    const value = window.localStorage.getItem(storageKeys.username);
    return value && value.trim().length > 0 ? value : null;
  } catch {
    return null;
  }
}

function writeRememberedName(value: string): void {
  try {
    window.localStorage.setItem(storageKeys.username, value);
  } catch {
    /* ignore */
  }
}

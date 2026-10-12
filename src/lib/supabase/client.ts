'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL, isSupabaseConfigured } from './env';

/**
 * The Supabase client, or `null` when Supabase is not configured.
 *
 * There is no sign-in, so the auth machinery is switched off deliberately:
 * `persistSession: false` keeps Supabase from writing auth keys into
 * localStorage, and `detectSessionInUrl: false` stops it parsing the URL for a
 * session nobody ever creates. The app's public visitor ID and separate secret
 * device token — see `features/teams/visitor.tsx` — live under their own storage
 * key. Only mutations send the token; public roster reads never do.
 *
 * Every call goes through the room RPCs, which is all the anonymous role is
 * permitted to do.
 */
let cached: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured) return null;
  cached ??= createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return cached;
}

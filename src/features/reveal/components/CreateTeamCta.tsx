'use client';

import { useRouter } from 'next/navigation';
import { Users } from 'lucide-react';

import { ui } from '@/content/ui';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { CREATE_GROUPS_ROUTE } from '@/lib/routes';
import { PirateButton } from '@/components/shared/PirateButton';

/**
 * The bottom popup on the result screen.
 *
 * It sits over the card rather than below the action stack because the card is
 * the artifact people screenshot, and burying the way into teams under four
 * other buttons is how a whole feature goes unnoticed. The bar is pinned to
 * the viewport so it is reachable without scrolling past the traits list, and
 * it is the one element on this screen drawn at full width in the primary
 * style — every other action here is secondary.
 *
 * It renders nothing at all when Supabase is unconfigured, rather than
 * offering a button that leads to a dead end.
 */
export function CreateTeamCta(): React.JSX.Element | null {
  const router = useRouter();

  if (!isSupabaseConfigured) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6"
      data-testid="create-team-cta"
    >
      <div className="pointer-events-auto mx-auto w-full max-w-[27rem] rounded-lg border-2 border-accent-gold/50 bg-background/92 p-2 shadow-[0_-4px_24px_rgb(9_11_23/0.75)] backdrop-blur-sm">
        {/*
          A real <button> that navigates, rather than a <Link> wrapping one:
          nesting an interactive element inside another is invalid and breaks
          both keyboard and screen-reader behaviour.
        */}
        <PirateButton
          fullWidth
          onClick={() => router.push(CREATE_GROUPS_ROUTE)}
          className="min-h-[3.25rem] text-[1.0625rem]"
          icon={<Users className="size-5" aria-hidden="true" />}
        >
          {ui.teams.createTeamCta}
        </PirateButton>
        <p className="mt-1 px-1 text-center text-[0.72rem] leading-snug text-text-secondary">
          {ui.teams.createTeamHint}
        </p>
      </div>
    </div>
  );
}
'use client';

import { getSecondaryCharacter } from '@/config/characters';
import type { TrackId } from '@/features/characters/types';
import { ui } from '@/content/ui';
import { TrackEmblem } from '@/components/characters/TrackEmblem';
import { ParchmentPanel } from '@/components/shared/ParchmentPanel';

export function SecondaryAffinity({ trackId }: { trackId: TrackId }): React.JSX.Element {
  const character = getSecondaryCharacter(trackId);
  if (!character) return <></>;
  return (
    <ParchmentPanel className="flex items-center gap-3 p-3">
      <span
        className="grid size-11 shrink-0 place-items-center rounded-full border-2 bg-parchment-50/85"
        style={{ borderColor: character.palette.deep, color: character.palette.deep }}
      >
        <TrackEmblem emblem={character.emblem} color={character.palette.deep} className="size-[62%]" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[0.72rem] font-bold text-ink-faint">
          {ui.reveal.secondaryHeading}
        </span>
        <span className="block truncate text-[0.92rem] font-extrabold" dir="ltr">
          {character.title} · {character.trackName}
        </span>
      </span>
    </ParchmentPanel>
  );
}

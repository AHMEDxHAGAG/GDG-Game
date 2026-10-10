'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

import { ui } from '@/content/ui';
import { CHARACTER_LIST, getCharacter } from '@/config/characters';
import type { TrackId } from '@/features/characters/types';
import { CharacterPortrait } from '@/components/characters/CharacterPortrait';
import { PirateButton } from '@/components/shared/PirateButton';

export interface CharacterGalleryProps {
  activeId?: TrackId | null;
  onSelect?: (track: TrackId) => void;
  onClose: () => void;
}

/**
 * "Meet the five pirates" overlay shown from the result screen.
 * In dev it doubles as the five-result preview (selecting a card previews it).
 */
export function CharacterGallery({ activeId, onSelect, onClose }: CharacterGalleryProps): React.JSX.Element {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ui.gallery.title}
      className="fixed inset-0 z-50 flex flex-col bg-ink/60 p-4 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="surface-parchment mx-auto flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-lg border-2 border-parchment-700/60"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b-2 border-parchment-700/40 px-4 py-3">
          <div>
            <h2 className="text-lg font-extrabold">{ui.gallery.title}</h2>
            <p className="text-[0.8rem] text-ink-soft">{ui.gallery.body}</p>
          </div>
          <PirateButton variant="ghost" onClick={onClose} aria-label={ui.gallery.close} icon={<X className="size-4" />}>
            {ui.gallery.close}
          </PirateButton>
        </div>
        <ul className="grid max-h-[70dvh] grid-cols-1 gap-2 overflow-y-auto p-4 sm:grid-cols-2">
          {CHARACTER_LIST.map((character) => {
            const active = character.id === activeId;
            return (
              <li key={character.id}>
                <button
                  type="button"
                  onClick={() => onSelect?.(character.id)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-md border-2 bg-parchment-50/80 p-3 text-start transition-transform active:translate-y-[1px] ${
                    active ? 'border-ink' : 'border-parchment-700/40'
                  }`}
                  style={{ borderColor: active ? character.palette.deep : undefined }}
                >
                  <CharacterPortrait character={getCharacter(character.id)} className="h-20 w-14 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.95rem] font-extrabold" dir="ltr">{character.title}</span>
                    <span className="block text-[0.85rem] font-bold" style={{ color: character.palette.deep }}>
                      {character.titleAr} · <span dir="ltr">{character.trackName}</span>
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-[0.78rem] text-ink-soft">{character.personalityAr}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

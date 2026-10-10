'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

import { ui } from '@/content/ui';
import type { CharacterDefinition } from '@/features/characters/types';
import { useExpedition } from '@/features/expedition/state/ExpeditionProvider';
import { PirateButton } from '@/components/shared/PirateButton';
import type { ResultCardHandle } from '@/features/reveal/components/ResultCard';

export type ShareState = 'idle' | 'working' | 'saved' | 'failed';

export function useResultExport(
  cardRef: React.RefObject<ResultCardHandle | null>,
  character: CharacterDefinition,
): { shareState: ShareState; share: () => Promise<void>; exportPng: () => Promise<void> } {
  const [shareState, setShareState] = useState<ShareState>('idle');

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pirate-${character.id}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setShareState('saved');
  };

  const exportPng = async (): Promise<void> => {
    const node = cardRef.current;
    if (!node) return;
    setShareState('working');
    try {
      const blob = await node.exportPng();
      if (!blob) throw new Error('export-empty');
      downloadBlob(blob);
    } catch {
      setShareState('failed');
    }
  };

  const share = async (): Promise<void> => {
    const node = cardRef.current;
    if (!node) return;
    setShareState('working');
    try {
      const blob = await node.exportPng();
      const file = blob
        ? new File([blob], `pirate-${character.id}.png`, { type: 'image/png' })
        : null;
      const nav = navigator as Navigator & {
        canShare?: (data: { files: File[] }) => boolean;
      };
      if (
        file &&
        typeof navigator.share === 'function' &&
        nav.canShare?.({ files: [file] }) !== false
      ) {
        try {
          await navigator.share({
            title: ui.actions.share,
            text: `${character.titleAr} · ${character.trackName}`,
            files: [file],
          });
          setShareState('saved');
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            setShareState('idle');
            return;
          }
        }
      }
      if (!blob) throw new Error('share-unavailable');
      downloadBlob(blob);
    } catch {
      setShareState('failed');
    }
  };

  return { shareState, share, exportPng };
}

export function ResultActions({
  shareState,
  onShare,
  onExport,
  onGallery,
}: {
  shareState: ShareState;
  onShare: () => void;
  onExport: () => void;
  onGallery: () => void;
}): React.JSX.Element {
  const { restart } = useExpedition();
  return (
    <div className="mt-4 grid w-full gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <PirateButton fullWidth onClick={onShare} disabled={shareState === 'working'}>
          {shareState === 'working' ? ui.actions.saving : ui.actions.share}
        </PirateButton>
        <PirateButton
          fullWidth
          variant="secondary"
          onClick={onExport}
          disabled={shareState === 'working'}
        >
          {shareState === 'working' ? ui.actions.saving : ui.actions.save}
        </PirateButton>
      </div>
      {shareState === 'saved' ? (
        <p role="status" className="text-center text-[0.8rem] font-bold text-ink-soft">
          {ui.actions.saved}
        </p>
      ) : null}
      {shareState === 'failed' ? (
        <p role="alert" className="text-center text-[0.8rem] font-bold text-treasure">
          {ui.actions.exportFailed}
        </p>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row">
        <PirateButton fullWidth variant="secondary" onClick={onGallery}>
          {ui.reveal.gallery}
        </PirateButton>
        <PirateButton
          fullWidth
          variant="ghost"
          onClick={restart}
          icon={<RotateCcw className="size-4" />}
        >
          {ui.actions.tryAgain}
        </PirateButton>
      </div>
    </div>
  );
}

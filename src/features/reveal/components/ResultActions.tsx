'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';

import { ui } from '@/content/ui';
import type { CharacterDefinition } from '@/features/characters/types';
import { PirateButton } from '@/components/shared/PirateButton';
import { resultFileName, type ResultCardHandle } from '@/features/reveal/components/ResultCard';

export type ShareState = 'idle' | 'working' | 'saved' | 'failed';

export interface ResultExport {
  shareState: ShareState;
  share: () => Promise<void>;
  exportPng: () => Promise<void>;
}

export function useResultExport(
  cardRef: React.RefObject<ResultCardHandle | null>,
  character: CharacterDefinition,
  username: string | null,
): ResultExport {
  const [shareState, setShareState] = useState<ShareState>('idle');
  const fileName = resultFileName(username, character);

  const downloadBlob = (blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    // Give the browser long enough to start the download before revoking.
    window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
    setShareState('saved');
  };

  const exportPng = async (): Promise<void> => {
    if (!cardRef.current) return;
    setShareState('working');
    try {
      const blob = await cardRef.current.exportPng();
      if (!blob) throw new Error('export-empty');
      downloadBlob(blob);
    } catch {
      setShareState('failed');
    }
  };

  const share = async (): Promise<void> => {
    if (!cardRef.current) return;
    setShareState('working');
    try {
      const blob = await cardRef.current.exportPng();
      const file = blob ? new File([blob], fileName, { type: 'image/png' }) : null;
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
            title: ui.card.exportWordmark,
            text: `${character.titleAr} · ${character.trackName}`,
            files: [file],
          });
          setShareState('saved');
          return;
        } catch (error) {
          // The visitor dismissing the share sheet is not a failure.
          if (error instanceof DOMException && error.name === 'AbortError') {
            setShareState('idle');
            return;
          }
          // Any other share error falls through to the download fallback.
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
  onBackToMatches,
  onTracks,
  onRestart,
}: {
  shareState: ShareState;
  onShare: () => void;
  onExport: () => void;
  onBackToMatches: () => void;
  onTracks: () => void;
  onRestart: () => void;
}): React.JSX.Element {
  const busy = shareState === 'working';
  return (
    <div className="mt-4 grid w-full gap-2">
      <div className="flex flex-col gap-2 sm:flex-row">
        <PirateButton
          fullWidth
          onClick={onShare}
          disabled={busy}
          icon={<Share2 className="size-4" />}
          data-testid="result-share"
        >
          {busy ? ui.actions.saving : ui.actions.share}
        </PirateButton>
        <PirateButton
          fullWidth
          variant="secondary"
          onClick={onExport}
          disabled={busy}
          data-testid="result-save"
        >
          {busy ? ui.actions.saving : ui.actions.save}
        </PirateButton>
      </div>

      {shareState === 'saved' ? (
        <p role="status" className="text-center text-[0.8rem] font-bold text-accent-gold">
          {ui.actions.saved}
        </p>
      ) : null}
      {shareState === 'failed' ? (
        <p role="alert" className="text-center text-[0.8rem] font-bold text-accent-red-high">
          {ui.actions.exportFailed}
        </p>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <PirateButton fullWidth variant="secondary" onClick={onBackToMatches}>
          {ui.result.backToMatchesCta}
        </PirateButton>
        <PirateButton fullWidth variant="secondary" onClick={onTracks}>
          {ui.result.galleryCta}
        </PirateButton>
      </div>
      <PirateButton fullWidth variant="ghost" onClick={onRestart}>
        {ui.result.restartCta}
      </PirateButton>
    </div>
  );
}

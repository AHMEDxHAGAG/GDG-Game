'use client';

import { useState } from 'react';

import { ui } from '@/content/ui';
import { CHARACTER_LIST } from '@/config/characters';
import { site } from '@/config/site';
import { useExpedition } from '@/features/expedition/state/ExpeditionProvider';

export function DevTools(): React.JSX.Element | null {
  const { previewTrack } = useExpedition();
  const [open, setOpen] = useState(false);
  if (!site.showDevTools) return null;
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-3 left-3 z-40 rounded-md border-2 border-dashed border-ink/40 bg-parchment-50/90 px-2 py-1 text-[0.7rem] font-bold text-ink-soft"
      >
        {ui.dev.open}
      </button>
    );
  }
  return (
    <div className="fixed bottom-3 left-3 z-40 w-52 rounded-md border-2 border-ink/60 bg-parchment-50/95 p-2 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-[0.72rem] font-extrabold">{ui.dev.title}</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-1 text-[0.72rem] font-bold text-ink-faint"
          aria-label="Close"
        >
          ×
        </button>
      </div>
      <p className="mt-1 text-[0.68rem] text-ink-faint">{ui.dev.note}</p>
      <label className="mt-1 block text-[0.68rem] font-bold" htmlFor="dev-track">
        {ui.dev.previewLabel}
      </label>
      <select
        id="dev-track"
        className="mt-0.5 w-full rounded border border-ink/40 bg-parchment-100 px-1 py-1 text-[0.75rem] font-bold"
        defaultValue=""
        onChange={(event) => {
          if (event.target.value) previewTrack(event.target.value);
        }}
      >
        <option value="">—</option>
        {CHARACTER_LIST.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title} · {c.trackName}
          </option>
        ))}
      </select>
    </div>
  );
}

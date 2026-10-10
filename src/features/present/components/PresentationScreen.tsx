'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import QRCode from 'qrcode';

import { ui } from '@/content/ui';
import { CHARACTER_LIST } from '@/config/characters';
import { SITE_URL, site } from '@/config/site';
import { CharacterPortrait } from '@/components/characters/CharacterPortrait';
import { ExpeditionBrand, NauticalBackground } from '@/components/shared/NauticalBackground';

/**
 * Reads the runtime origin without an effect.
 *
 * `useSyncExternalStore` gives us a hydration-safe value: the server snapshot
 * is empty (so SSR and the first client render agree, no hydration mismatch),
 * and the client snapshot supplies `window.location.origin` immediately after
 * hydration — without a `setState` in an effect.
 */
function useRuntimeOrigin(): string {
  return useSyncExternalStore(
    () => () => {},
    () => (typeof window === 'undefined' ? '' : window.location.origin),
    () => '',
  );
}

function useJoinUrl(): string {
  const origin = useRuntimeOrigin();
  return SITE_URL || origin || 'GDGoC · AASTMT Aswan';
}

/**
 * Projector / invitation screen (`/present`).
 *
 * Static 16:9 composition: title + QR + steps + the five pirates. No live
 * stats, no tracking — organisers display it while attendees join on phones.
 */
export function PresentationScreen(): React.JSX.Element {
  const joinUrl = useJoinUrl();
  // The QR is stored keyed by the URL it was generated from, so a stale entry
  // can never be rendered against a different destination — no reset needed.
  const [qr, setQr] = useState<{ url: string; dataUrl: string } | null>(null);

  useEffect(() => {
    if (!joinUrl.startsWith('http')) return;
    let cancelled = false;
    QRCode.toDataURL(joinUrl, {
      width: 480,
      margin: 2,
      color: { dark: '#24201a', light: '#fbf3df' },
    })
      .then((dataUrl) => {
        if (!cancelled) setQr({ url: joinUrl, dataUrl });
      })
      .catch(() => {
        // Leave `qr` untouched: the derived lookup below simply won't match,
        // so the textual fallback renders instead.
      });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

  const qrDataUrl = qr && qr.url === joinUrl ? qr.dataUrl : null;

  return (
    <NauticalBackground withCompass>
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-6 py-6" data-scene="present">
        <header className="flex items-center justify-between">
          <ExpeditionBrand tone="dark" />
          <p dir="ltr" className="text-xs font-bold tracking-[0.25em] text-ink-faint uppercase">
            {site.taglineEn}
          </p>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-ink-soft uppercase">
              {ui.welcome.eyebrow}
            </p>
            <h1 className="mt-3 font-display text-[clamp(2.4rem,6vw,4.5rem)] leading-[0.95] text-ink">
              <span dir="ltr" className="block">Pirate Identity</span>
              <span dir="ltr" className="block">Expedition</span>
            </h1>
            <p className="mt-4 text-3xl font-extrabold text-treasure">{ui.present.headline}</p>
            <p className="mt-2 max-w-md text-lg leading-relaxed font-semibold text-ink-soft">{ui.present.sub}</p>

            <ol className="mt-6 space-y-2">
              {ui.present.steps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-[1rem] font-bold">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-ink/60 bg-parchment-100 text-sm font-extrabold">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col items-center">
            <div className="rounded-lg border-4 border-ink/70 bg-parchment-50 p-4 shadow-[0_4px_0_rgba(36,32,26,0.35)]">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt={`QR code: ${joinUrl}`} width={240} height={240} className="size-60" />
              ) : (
                <div className="grid size-60 place-items-center p-6 text-center text-sm font-bold text-ink-soft">
                  <span dir="ltr">{joinUrl}</span>
                </div>
              )}
            </div>
            <p dir="ltr" className="mt-3 text-lg font-extrabold tracking-wide">
              {ui.present.scan}
            </p>
            <p dir="ltr" className="max-w-xs truncate text-sm font-bold text-ink-soft">
              {joinUrl}
            </p>
          </div>
        </main>

        <footer>
          <ul className="grid grid-cols-5 gap-2">
            {CHARACTER_LIST.map((character) => (
              <li
                key={character.id}
                className="flex flex-col items-center rounded-md border-2 bg-parchment-50/70 px-1 py-2 text-center"
                style={{ borderColor: `${character.palette.deep}55` }}
              >
                <CharacterPortrait character={character} className="h-20 w-14" />
                <span dir="ltr" className="mt-1 text-[0.65rem] font-extrabold tracking-wide">
                  {character.title}
                </span>
                <span dir="ltr" className="text-[0.6rem] font-bold" style={{ color: character.palette.deep }}>
                  {character.trackName}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-xs text-ink-faint">
            {site.organizationLong} — {site.campusLong}
          </p>
        </footer>
      </div>
    </NauticalBackground>
  );
}

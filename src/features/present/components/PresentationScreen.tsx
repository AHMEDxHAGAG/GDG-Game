'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

import { ui } from '@/content/ui';
import { CHARACTER_LIST } from '@/config/characters';
import { SITE_URL, site } from '@/config/site';
import { CharacterPortrait } from '@/components/characters/CharacterPortrait';
import { ExpeditionBrand, NauticalBackground } from '@/components/shared/NauticalBackground';

function useJoinUrl(): string {
  const [url, setUrl] = useState(SITE_URL || '');
  useEffect(() => {
    if (!SITE_URL && typeof window !== 'undefined') {
      setUrl(window.location.origin);
    }
  }, []);
  return url || 'GDGoC · AASTMT Aswan';
}

/**
 * Projector / invitation screen (`/present`).
 *
 * Static 16:9 composition: title + QR + steps + the five pirates. No live
 * stats, no tracking — organisers display it while attendees join on phones.
 */
export function PresentationScreen(): React.JSX.Element {
  const joinUrl = useJoinUrl();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!joinUrl.startsWith('http')) {
      setQrDataUrl(null);
      return;
    }
    QRCode.toDataURL(joinUrl, {
      width: 480,
      margin: 2,
      color: { dark: '#24201a', light: '#fbf3df' },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [joinUrl]);

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

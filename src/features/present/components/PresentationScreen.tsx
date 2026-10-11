'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import QRCode from 'qrcode';

import { ui } from '@/content/ui';
import { CHARACTER_LIST } from '@/config/characters';
import { SITE_URL, site } from '@/config/site';
import { CharacterArtwork } from '@/components/characters/CharacterArtwork';
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
  return SITE_URL || origin || site.organizationLong;
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
      // Dark modules on a cream plate: the inverse of the page, so it stays
      // scannable under projector contrast without glowing.
      color: { dark: '#090F22FF', light: '#FFE6BDFF' },
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
      <div
        className="mx-auto flex min-h-[100dvh] w-full max-w-6xl flex-col px-6 py-6"
        data-scene="present"
      >
        <header className="flex items-center justify-between">
          <ExpeditionBrand />
          <p dir="ltr" className="font-brand text-xs font-bold tracking-[0.25em] text-text-secondary uppercase">
            {site.taglineEn}
          </p>
        </header>

        <main className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <p className="text-sm font-bold tracking-[0.25em] text-accent-gold uppercase">
              {ui.brand.organization} · {ui.brand.campus}
            </p>
            <h1
              className="mt-3 text-shadow-pixel font-display font-black leading-[1.1] text-accent-gold"
              style={{ fontSize: 'clamp(2.4rem, 6vw, 4.5rem)' }}
            >
              <span className="block">{ui.landing.headlineLines[0]}</span>
              <span className="block">{ui.landing.headlineLines[1]}</span>
            </h1>
            <p className="mt-4 text-3xl font-extrabold text-text-primary">
              {ui.present.headline}
            </p>
            <p className="mt-2 max-w-md text-lg leading-relaxed font-semibold text-text-secondary">
              {ui.present.sub}
            </p>

            <ol className="mt-6 space-y-2">
              {ui.present.steps.map((step, index) => (
                <li key={step} className="flex items-center gap-3 text-[1rem] font-bold text-text-primary">
                  <span className="grid size-7 shrink-0 place-items-center rounded-full border-2 border-accent-gold/70 bg-surface text-sm font-extrabold text-accent-gold">
                    {index + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </div>

          <div className="flex flex-col items-center">
            <div className="pixel-frame rounded-lg bg-parchment-100 p-4 shadow-[0_0_40px_rgba(255,185,97,0.18)]">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- a data URL from qrcode; next/image would add nothing
                <img
                  src={qrDataUrl}
                  alt={`QR code: ${joinUrl}`}
                  width={240}
                  height={240}
                  className="size-60"
                />
              ) : (
                <div className="grid size-60 place-items-center p-6 text-center text-sm font-bold text-ink">
                  <span dir="ltr">{joinUrl}</span>
                </div>
              )}
            </div>
            <p dir="ltr" className="mt-3 text-lg font-extrabold tracking-wide text-text-primary">
              {ui.present.scan}
            </p>
            <p dir="ltr" className="max-w-xs truncate text-sm font-bold text-text-secondary">
              {joinUrl}
            </p>
          </div>
        </main>

        <footer>
          <ul className="grid grid-cols-5 gap-2">
            {CHARACTER_LIST.map((character) => (
              <li
                key={character.id}
                className="flex flex-col items-center rounded-md border-2 bg-surface/80 px-1 py-2 text-center"
                style={{ borderColor: `${character.palette.vivid}55` }}
              >
                <span className="h-20 w-14">
                  <CharacterArtwork character={character} className="h-full w-full" />
                </span>
                <span
                  className="mt-1 text-[0.65rem] font-extrabold tracking-wide"
                  style={{ color: character.palette.vivid }}
                >
                  {character.titleAr}
                </span>
                <span dir="ltr" className="text-[0.6rem] font-bold text-text-secondary">
                  {character.trackName}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-center text-xs text-text-secondary">
            {site.organizationLong} — {site.campusLong}
          </p>
        </footer>
      </div>
    </NauticalBackground>
  );
}

import type { ReactNode } from 'react';

import { AnchorMark, CompassRose, CrewColours, SeaBand } from './nautical-art';
import { site } from '@/config/site';

export interface NauticalBackgroundProps {
  children?: ReactNode;
  /** Adds the drifting sea band along the bottom edge. */
  withSea?: boolean;
  withCompass?: boolean;
  /** Scene tint used behind the content. */
  tone?: 'parchment' | 'deep';
}

/**
 * The stage every scene sits on.
 *
 * Parchment gradient + paper grain + a compass rose + a sea band. Fixed and
 * pointer-events-none so it never intercepts taps and never scrolls away.
 */
export function NauticalBackground({
  children,
  withSea = true,
  withCompass = false,
  tone = 'parchment',
}: NauticalBackgroundProps): React.JSX.Element {
  const deep = tone === 'deep';

  return (
    <div className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-20 ${
          deep ? 'bg-ocean-deep' : 'bg-parchment-300'
        }`}
      />
      <div
        aria-hidden="true"
        className={`surface-parchment pointer-events-none absolute inset-0 -z-20 ${
          deep ? 'opacity-25 mix-blend-multiply' : ''
        }`}
      />
      {/* Paper grain */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      {withCompass ? (
        <CompassRose
          aria-hidden="true"
          className="animate-drift pointer-events-none absolute -top-16 -start-16 size-48 text-ink/10 sm:size-64"
        />
      ) : null}

      {withSea ? (
        <SeaBand
          className={`animate-drift pointer-events-none absolute inset-x-0 -bottom-1 h-24 w-full ${
            deep ? 'text-ocean/50' : 'text-ocean/35'
          }`}
        />
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-14 bottom-24 size-32 text-ink/10"
      >
        <AnchorMark className="size-full" />
      </div>

      {children}
    </div>
  );
}

/** Compact organisation mark used in headers, the result card and /present. */
export function ExpeditionBrand({
  compact = false,
  tone = 'dark',
}: {
  compact?: boolean;
  tone?: 'dark' | 'light';
}): React.JSX.Element {
  const titleClass =
    tone === 'light' ? 'text-parchment-200' : 'text-ink';
  const campusClass =
    tone === 'light' ? 'text-parchment-100/90' : 'text-ink-soft';
  return (
    <span className="inline-flex items-center gap-2">
      <CrewColours className="inline-flex gap-[3px]" />
      <span className={`font-display leading-none tracking-wide ${titleClass}`}>
        {site.organization}
        <span className="mx-1 opacity-60">·</span>
        <span className={campusClass}>{site.campus}</span>
      </span>
      {compact ? null : (
        <span className="sr-only">
          {site.organizationLong} — {site.campusLong}
        </span>
      )}
    </span>
  );
}

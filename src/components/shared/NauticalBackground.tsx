import type { ReactNode } from 'react';

import { AnchorMark, CompassRose, CrewColours, SeaBand } from './nautical-art';
import { site } from '@/config/site';

export interface NauticalBackgroundProps {
  children?: ReactNode;
  /** Adds the drifting sea band along the bottom edge. */
  withSea?: boolean;
  withCompass?: boolean;
  /** Adds a warm lantern glow in the top corner. */
  withLantern?: boolean;
  /** Scene tint used behind the content. */
  tone?: 'harbour' | 'deep';
}

/**
 * The stage every scene sits on.
 *
 * Moonlit harbour: a deep-navy gradient, a warm lantern bloom, a compass rose,
 * a sea band and a faint grain. Fixed and pointer-events-none so it never
 * intercepts taps and never scrolls away.
 *
 * Every decorative layer is `aria-hidden` — the accessibility tree only ever
 * sees the real content above it.
 */
export function NauticalBackground({
  children,
  withSea = true,
  withCompass = false,
  withLantern = false,
  tone = 'harbour',
}: NauticalBackgroundProps): React.JSX.Element {
  const deep = tone === 'deep';

  return (
    <div className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden">
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-30 ${
          deep ? 'bg-background-deep' : 'bg-background'
        }`}
      />
      {/* Warm bloom from above, standing in for the hanging lanterns. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-20 h-[60vh]"
        style={{
          background:
            'radial-gradient(ellipse at 50% -10%, rgba(255,185,97,0.16) 0%, transparent 62%)',
        }}
      />
      <div aria-hidden="true" className="surface-hull pointer-events-none absolute inset-0 -z-20" />
      {/* Grain, kept faint — it should read as film texture, not noise. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.07]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
        }}
      />

      {withCompass ? (
        <CompassRose
          aria-hidden="true"
          className="animate-ship-drift pointer-events-none absolute -top-16 -start-16 size-48 text-text-primary/[0.07] sm:size-64"
        />
      ) : null}

      {withLantern ? (
        <div
          aria-hidden="true"
          className="animate-lantern-flicker pointer-events-none absolute -top-4 end-6 -z-10 size-24 rounded-full blur-2xl sm:end-12"
          style={{ backgroundColor: 'rgba(255,185,97,0.22)' }}
        />
      ) : null}

      {withSea ? (
        <SeaBand
          className="animate-ship-drift pointer-events-none absolute inset-x-0 -bottom-1 -z-10 h-24 w-full text-sea-blue/45"
        />
      ) : null}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-14 bottom-24 -z-10 size-32 text-text-primary/[0.06]"
      >
        <AnchorMark className="size-full" />
      </div>

      {children}
    </div>
  );
}

/**
 * Organisation mark: a code-like glyph plus GDGoC / AASTMT ASWAN on two lines,
 * per the spec's BrandMark. Latin only, so it carries `dir="ltr"`.
 */
export function ExpeditionBrand({
  compact = false,
  tone = 'dark',
}: {
  compact?: boolean;
  tone?: 'dark' | 'light';
}): React.JSX.Element {
  const titleClass = tone === 'light' ? 'text-text-primary' : 'text-text-primary';
  const campusClass = tone === 'light' ? 'text-text-secondary' : 'text-text-secondary';
  return (
    <span dir="ltr" className="inline-flex items-center gap-2">
      <CrewColours className="inline-flex gap-[3px]" />
      <span className="flex flex-col leading-none">
        <span className={`font-brand text-sm font-bold tracking-tight ${titleClass}`}>
          {site.organization}
        </span>
        <span className={`font-brand text-[0.55rem] font-medium tracking-[0.18em] ${campusClass}`}>
          {site.campus}
        </span>
      </span>
      {compact ? null : (
        <span className="sr-only">
          {site.organizationLong} — {site.campusLong}
        </span>
      )}
    </span>
  );
}

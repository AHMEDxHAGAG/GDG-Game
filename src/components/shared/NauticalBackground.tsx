import type { ReactNode } from 'react';

import { CrewColours, CompassRose } from './nautical-art';
import { site } from '@/config/site';
import { UI_ASSETS, type SceneId } from '@/config/ui-assets';

export interface NauticalBackgroundProps {
  children?: ReactNode;
  scene?: SceneId;
  withSea?: boolean;
  withCompass?: boolean;
  withLantern?: boolean;
  tone?: 'harbour' | 'deep';
}

export function NauticalBackground({
  children,
  scene = 'harbour',
  withCompass = false,
  withLantern = false,
  tone = 'harbour',
}: NauticalBackgroundProps): React.JSX.Element {
  const artwork = UI_ASSETS[scene];
  return (
    <div
      className="scene-stage relative isolate flex min-h-[100dvh] w-full flex-col"
      data-background={scene}
    >
      <div
        aria-hidden="true"
        className="scene-backdrop pointer-events-none absolute inset-0 -z-20 overflow-hidden"
      >
        <picture>
          <source
            media="(max-width: 767px)"
            srcSet={artwork.src.replace('.webp', '-mobile.webp')}
          />
          <img
            src={artwork.src}
            alt=""
            width={artwork.width}
            height={artwork.height}
            className="scene-image absolute inset-0 h-full w-full object-cover"
            fetchPriority="high"
          />
        </picture>
        <div className={`scene-scrim absolute inset-0 ${tone === 'deep' ? 'opacity-95' : ''}`} />
        {withCompass ? (
          <CompassRose className="absolute -start-20 top-28 size-72 text-accent-gold/[0.06]" />
        ) : null}
      </div>
      {withLantern ? (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex justify-between px-2 sm:px-8"
        >
          {[0, 1].map((side) => (
            // eslint-disable-next-line @next/next/no-img-element -- decorative local artwork
            <img
              key={side}
              src={UI_ASSETS.lantern.src}
              alt=""
              width={UI_ASSETS.lantern.width}
              height={UI_ASSETS.lantern.height}
              className="animate-lantern-flicker h-28 w-auto opacity-80 sm:h-40"
            />
          ))}
        </div>
      ) : null}
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

import type { HTMLAttributes } from 'react';

import type { EmblemId } from '@/features/characters/types';
import { EMBLEM_ASSETS, UI_ASSETS } from '@/config/ui-assets';

export interface TrackEmblemProps extends HTMLAttributes<HTMLSpanElement> {
  emblem: EmblemId;
  color: string;
  appearance?: 'compact' | 'ornate';
}

export function TrackEmblem({
  emblem,
  color,
  appearance = 'compact',
  title,
  className = '',
  style,
  ...rest
}: TrackEmblemProps): React.JSX.Element {
  const id = EMBLEM_ASSETS[emblem];
  const ornateId = `${id}-ornate` as const;
  const artwork = UI_ASSETS[appearance === 'ornate' ? ornateId : id];
  return (
    <span
      {...rest}
      title={title}
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      className={`inline-block shrink-0 ${className}`}
      style={
        appearance === 'compact'
          ? {
              backgroundColor: color,
              maskImage: `url("${artwork.src}")`,
              maskSize: 'contain',
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
              ...style,
            }
          : style
      }
    >
      {appearance === 'ornate' ? (
        // eslint-disable-next-line @next/next/no-img-element -- local artwork also used in canvas exports
        <img
          src={artwork.src}
          alt=""
          width={artwork.width}
          height={artwork.height}
          className="h-full w-full object-contain"
        />
      ) : null}
    </span>
  );
}

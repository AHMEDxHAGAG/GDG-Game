import type { SVGProps } from 'react';

type ArtProps = SVGProps<SVGSVGElement> & { title?: string };

/**
 * Hand-drawn nautical ornaments.
 *
 * Everything here is inline SVG in the ink-on-parchment style of the
 * expedition brand. They are decorative: callers mark them `aria-hidden`
 * unless the surrounding copy already conveys the meaning.
 */

/* ------------------------------------------------------------------ */
/* Compass rose                                                        */
/* ------------------------------------------------------------------ */

export function CompassRose({
  className,
  animated = true,
  title,
  ...rest
}: ArtProps & { animated?: boolean }) {
  return (
    <svg viewBox="0 0 200 200" className={className} role={title ? 'img' : undefined} {...rest}>
      {title ? <title>{title}</title> : null}
      <g fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="100" cy="100" r="88" />
        <circle cx="100" cy="100" r="74" strokeWidth="0.8" opacity="0.7" />
      </g>
      <g stroke="currentColor" strokeWidth="1.4" opacity="0.75">
        {Array.from({ length: 32 }, (_, i) => {
          const angle = (i * 360) / 32;
          return (
            <line
              key={angle}
              x1="100"
              y1="14"
              x2="100"
              y2={i % 4 === 0 ? 26 : 21}
              transform={`rotate(${angle} 100 100)`}
            />
          );
        })}
      </g>
      <g className={animated ? 'animate-sway' : undefined} style={{ transformOrigin: '100px 100px' }}>
        {/* Long points */}
        <path d="M100 16 L112 100 L100 112 L88 100 Z" fill="currentColor" opacity="0.9" />
        <path d="M100 184 L112 100 L100 88 L88 100 Z" fill="currentColor" opacity="0.45" />
        <path d="M16 100 L100 88 L112 100 L100 112 Z" fill="currentColor" opacity="0.45" />
        <path d="M184 100 L100 112 L88 100 L100 88 Z" fill="currentColor" opacity="0.9" />
        {/* Short points */}
        <path
          d="M41 41 L100 90 L110 100 L100 110 Z"
          fill="currentColor"
          opacity="0.35"
          transform="rotate(0 100 100)"
        />
        <path d="M41 41 L100 90 L110 100 L100 110 Z" fill="currentColor" opacity="0.35" />
        <path d="M159 41 L110 100 L100 110 L90 100 Z" fill="currentColor" opacity="0.35" />
        <path d="M159 159 L90 100 L100 90 L110 100 Z" fill="currentColor" opacity="0.35" />
        <path d="M41 159 L90 100 L100 90 L110 100 Z" fill="currentColor" opacity="0.35" />
        <circle cx="100" cy="100" r="7" fill="currentColor" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Galleon                                                             */
/* ------------------------------------------------------------------ */

export function ShipSilhouette({ className, title, ...rest }: ArtProps) {
  return (
    <svg viewBox="0 0 320 220" className={className} role={title ? 'img' : undefined} {...rest}>
      {title ? <title>{title}</title> : null}
      <g fill="currentColor">
        {/* Hull */}
        <path d="M36 132 H286 l-16 30 c-6 12-20 18-44 18 H96 c-24 0-38-6-44-18 Z" />
        {/* Hull strake */}
        <path d="M56 120 H266 l-8 12 H64 Z" opacity="0.55" />
        {/* Masts */}
        <rect x="104" y="34" width="6" height="100" />
        <rect x="158" y="18" width="7" height="116" />
        <rect x="212" y="44" width="6" height="90" />
        {/* Sails — fore, main, mizzen, topsails */}
        <path d="M110 40 h44 c6 18 6 34 0 50 h-44 c-6-16-6-32 0-50 Z" opacity="0.92" />
        <path d="M164 24 h50 c7 22 7 42 0 62 h-50 c-7-20-7-40 0-62 Z" opacity="0.85" />
        <path d="M218 50 h34 c5 15 5 28 0 42 h-34 c-5-14-5-27 0-42 Z" opacity="0.8" />
        <path d="M112 96 h40 c5 10 5 18 0 26 h-40 c-5-8-5-16 0-26 Z" opacity="0.7" />
        <path d="M166 92 h46 c6 11 6 20 0 30 h-46 c-6-10-6-19 0-30 Z" opacity="0.68" />
        {/* Jolly Roger */}
        <path d="M161 18 v-14" />
        <path d="M161 4 h20 l-4 9 4 9 h-20 Z" opacity="0.9" />
      </g>
      {/* Waves */}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.5"
      >
        <path d="M18 196 c14-10 28-10 42 0 s28 10 42 0 28-10 42 0 28 10 42 0 28-10 42 0" />
        <path d="M46 210 c12-8 24-8 36 0 s24 8 36 0 24-8 36 0 24 8 36 0 24-8 36 0" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Anchor                                                              */
/* ------------------------------------------------------------------ */

export function AnchorMark({ className, title, ...rest }: ArtProps) {
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? 'img' : undefined} {...rest}>
      {title ? <title>{title}</title> : null}
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="24" cy="9" r="4" />
        <path d="M24 13 V40" />
        <path d="M14 19 H34" />
        <path d="M10 30 c0 8 6 12 14 12 s14-4 14-12" />
        <path d="M10 30 l-4 6 7-1" />
        <path d="M38 30 l4 6 -7-1" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Sea horizon band                                                     */
/* ------------------------------------------------------------------ */

export function SeaBand({ className, ...rest }: ArtProps) {
  return (
    <svg
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      {...rest}
    >
      <path
        d="M0 96 q60-26 120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 t120 0 V160 H0 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Torn parchment edge                                                  */
/* ------------------------------------------------------------------ */

export function TornEdge({ className, flip = false, ...rest }: ArtProps & { flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1200 26"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      style={flip ? { transform: 'scaleY(-1)' } : undefined}
      {...rest}
    >
      <path
        d="M0 26 V14 l14-6 12 8 16-9 10 7 18-8 14 9 12-6 16 8 14-9 10 6 18-8 12 9 16-7 14 8 12-9 16 7 10-8 18 9 12-7 16 8 14-8 12 7 16-9 14 8 12-6 16 8 14-8 12 7 18-9 12 8 16-7 14 9 12-8 16 7 10-8 18 9 14-7 12 8 16-8 12 7 16-9 14 8 12-6 16 8 14-8 12 7 18-9 12 8 16-7 14 9 12-8 16 7 10-8 18 9 12-7 16 8 14-8 12 7 16-9 14 8 12-6 16 8 14-8 12 7 18-9 12 8 16-7 14 9 12-8 16 7 10-8 18 9 14-7 12 8 16-8 V26 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Dotted sailing route                                                 */
/* ------------------------------------------------------------------ */

export function SailingRoute({ className, ...rest }: ArtProps) {
  return (
    <svg viewBox="0 0 240 60" className={className} aria-hidden="true" {...rest}>
      <path
        d="M6 46 C60 46 74 12 122 12 s78 22 112 6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeDasharray="1 12"
      />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Four Google colours as tiny crew flags                                */
/* ------------------------------------------------------------------ */

export function CrewColours({ className }: { className?: string }) {
  const colours = ['#4285f4', '#ea4335', '#fbbc04', '#34a853'];
  return (
    <span className={className} aria-hidden="true">
      {colours.map((colour) => (
        <span
          key={colour}
          className="inline-block size-[5px] rotate-45"
          style={{ backgroundColor: colour }}
        />
      ))}
    </span>
  );
}

import type { SVGProps } from 'react';

import type { EmblemId } from '@/features/characters/types';

type EmblemProps = SVGProps<SVGSVGElement> & {
  /** Track colour; applied to the stroke and the light fill. */
  color: string;
  title?: string;
};

/**
 * Ink-styled track emblems.
 *
 * Drawn on a 48-unit grid so they stay legible down to ~20px, which is where
 * they appear on badges, the journey meter and the exported card.
 */

function Frame({ children, color, title, ...rest }: EmblemProps & { children: React.ReactNode }) {
  return (
    // `rest` carries the caller's SVG props — most importantly `className`,
    // which is how every call site sizes the emblem. It is spread first so the
    // fixed attributes below always win; without it an unsized SVG falls back
    // to its viewBox ratio and inflates whatever it sits inside.
    <svg
      {...rest}
      viewBox="0 0 48 48"
      width="100%"
      height="100%"
      role={title ? 'img' : undefined}
      fill="none"
      stroke={color}
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {title ? <title>{title}</title> : null}

      {children}
    </svg>
  );
}

function GearEmblem(props: EmblemProps) {
  const teeth = Array.from({ length: 8 }, (_, i) => i * 45);
  return (
    <Frame {...props}>
      <circle cx="24" cy="24" r="9" />
      <circle cx="24" cy="24" r="3" />
      {teeth.map((angle) => (
        <line
          key={angle}
          x1="24"
          y1="7"
          x2="24"
          y2="13"
          transform={`rotate(${angle} 24 24)`}
        />
      ))}
    </Frame>
  );
}

function RobotEmblem(props: EmblemProps) {
  return (
    <Frame {...props}>
      <path d="M24 8v5" />
      <circle cx="24" cy="6" r="2" />
      <rect x="11" y="14" width="26" height="20" rx="6" />
      <circle cx="19" cy="23" r="2.2" />
      <circle cx="29" cy="23" r="2.2" />
      <path d="M19 29h10" />
      <path d="M17 39h14" />
      <path d="M24 34v5" />
    </Frame>
  );
}

function GlobeEmblem(props: EmblemProps) {
  return (
    <Frame {...props}>
      <circle cx="24" cy="24" r="15" />
      <path d="M9 24h30" />
      <path d="M24 9c5 5 5 25 0 30" />
      <path d="M24 9c-5 5-5 25 0 30" />
      <path d="M12.5 16.5c7 3 16 3 23 0" />
      <path d="M12.5 31.5c7-3 16-3 23 0" />
    </Frame>
  );
}

function ChartEmblem(props: EmblemProps) {
  return (
    <Frame {...props}>
      <path d="M10 38h28" />
      <path d="M10 38V12" />
      <rect x="15" y="27" width="5" height="8" />
      <rect x="23" y="21" width="5" height="14" />
      <rect x="31" y="15" width="5" height="20" />
    </Frame>
  );
}

function ShieldEmblem(props: EmblemProps) {
  return (
    <Frame {...props}>
      <path d="M24 7 39 12v12c0 9-6 15-15 18-9-3-15-9-15-18V12Z" />
      <rect x="20" y="21" width="8" height="7" rx="1.6" />
      <path d="M22 21v-2.5a2 2 0 0 1 4 0V21" />
    </Frame>
  );
}

const EMBLEMS: Record<EmblemId, (props: EmblemProps) => React.JSX.Element> = {
  gear: GearEmblem,
  robot: RobotEmblem,
  globe: GlobeEmblem,
  chart: ChartEmblem,
  shield: ShieldEmblem,
};

export interface TrackEmblemProps extends EmblemProps {
  emblem: EmblemId;
}

export function TrackEmblem({ emblem, ...rest }: TrackEmblemProps): React.JSX.Element {
  const Component = EMBLEMS[emblem];
  return Component(rest);
}

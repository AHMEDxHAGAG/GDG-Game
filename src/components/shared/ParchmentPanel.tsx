import type { HTMLAttributes, ReactNode } from 'react';

export interface ParchmentPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  torn?: boolean;
  tone?: 'light' | 'plain';
  artwork?: 'question' | 'scroll';
}

export function ParchmentPanel({
  children,
  className = '',
  torn = false,
  tone = 'light',
  artwork,
  ...rest
}: ParchmentPanelProps): React.JSX.Element {
  const skin = artwork ?? (torn ? 'question' : 'scroll');
  return (
    <div
      className={`parchment-panel parchment-${skin} relative text-ink ${tone === 'plain' ? 'brightness-105' : ''} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

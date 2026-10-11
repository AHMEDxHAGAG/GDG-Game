import type { HTMLAttributes, ReactNode } from 'react';

export interface ParchmentPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** Adds the torn top edge used for scrolls and question cards. */
  torn?: boolean;
  tone?: 'light' | 'plain';
}

/**
 * A sheet of aged paper. Deliberately not a rounded app card.
 *
 * This is the only light surface in the dark harbour theme, so anything that
 * carries Arabic body copy — the question, the answer options, the result
 * sections — lives inside one of these. Dark-on-cream is also what keeps long
 * Arabic paragraphs readable at the spec's 15–17px body size.
 */
export function ParchmentPanel({
  children,
  className = '',
  torn = false,
  tone = 'light',
  ...rest
}: ParchmentPanelProps): React.JSX.Element {
  return (
    <div
      className={`relative rounded-sm border border-parchment-600/55 ${
        tone === 'light' ? 'surface-parchment' : 'bg-parchment-100/70'
      } ${className}`}
      {...rest}
    >
      {torn ? (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 -top-[3px] h-[3px] bg-[repeating-linear-gradient(90deg,var(--color-parchment-700)_0_6px,transparent_6px_12px)] opacity-40"
        />
      ) : null}
      {children}
    </div>
  );
}

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface PirateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Optional leading ornament, e.g. a compass or anchor glyph. */
  icon?: ReactNode;
  fullWidth?: boolean;
}

/**
 * `min-h-11` is the 44px touch target the spec requires, and the pressed
 * offset is a real `translate-y` rather than a shadow swap so the button does
 * not resize as it is pressed.
 */
const BASE =
  'relative inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-md border-2 px-5 py-2.5 text-[0.95rem] font-extrabold leading-tight transition-transform duration-150 active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<Variant, string> = {
  // Thick dark-red plaque with bevelled gold trim — the landing CTA.
  primary:
    'border-accent-red-high bg-accent-red text-parchment-100 shadow-[0_3px_0_rgba(9,11,23,0.6),0_0_20px_rgba(255,185,97,0.18)] hover:bg-accent-red-high hover:shadow-[0_2px_0_rgba(9,11,23,0.6)] active:shadow-none',
  // Outlined dark, per the spec's RpgButton contract.
  secondary:
    'border-surface-border bg-surface/80 text-text-primary shadow-[0_3px_0_rgba(9,11,23,0.5)] hover:border-accent-gold/70 hover:bg-surface-tinted hover:shadow-[0_2px_0_rgba(9,11,23,0.5)] active:shadow-none',
  ghost:
    'border-transparent bg-transparent text-text-secondary underline decoration-accent-gold decoration-2 underline-offset-4 hover:text-text-primary',
  danger:
    'border-accent-red-high/70 bg-accent-red/15 text-accent-red-high hover:bg-accent-red/25',
};

/**
 * The one button in the app.
 *
 * Looks like a hand-cut wooden control riveted onto a dark ship deck, but
 * stays a real `<button>` with a real text label: nothing important is baked
 * into art.
 */
export const PirateButton = forwardRef<HTMLButtonElement, PirateButtonProps>(function PirateButton(
  { variant = 'primary', icon, fullWidth = false, className = '', children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type="button"
      className={`${BASE} ${VARIANTS[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {icon ? (
        <span aria-hidden="true" className="flex size-4 shrink-0 items-center justify-center">
          {icon}
        </span>
      ) : null}
      <span className="text-balance">{children}</span>
    </button>
  );
});

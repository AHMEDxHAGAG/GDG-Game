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
  'relative inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-md border-2 px-6 py-3 text-[0.95rem] font-extrabold leading-tight transition-transform duration-150 active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<Variant, string> = {
  primary: 'rpg-button rpg-button-primary text-parchment-50 hover:brightness-110',
  secondary: 'rpg-button rpg-button-secondary text-text-primary hover:brightness-125',
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

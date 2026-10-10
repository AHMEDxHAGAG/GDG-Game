import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface PirateButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  /** Optional leading ornament, e.g. a compass or anchor glyph. */
  icon?: ReactNode;
  fullWidth?: boolean;
}

const BASE =
  'relative inline-flex min-h-11 select-none items-center justify-center gap-2 rounded-md border-2 px-5 py-2.5 text-[0.95rem] font-extrabold leading-tight transition-transform duration-150 active:translate-y-[2px] disabled:pointer-events-none disabled:opacity-45';

const VARIANTS: Record<Variant, string> = {
  primary:
    'border-ink/85 bg-ink text-parchment-100 shadow-[0_3px_0_rgba(36,32,26,0.45)] hover:bg-ink-soft hover:shadow-[0_2px_0_rgba(36,32,26,0.45)] active:shadow-none',
  secondary:
    'border-ink/60 bg-parchment-100 text-ink shadow-[0_3px_0_rgba(154,112,67,0.4)] hover:bg-parchment-50 hover:shadow-[0_2px_0_rgba(154,112,67,0.4)] active:shadow-none',
  ghost:
    'border-transparent bg-transparent text-ink-soft underline decoration-gold decoration-2 underline-offset-4 hover:text-ink',
  danger:
    'border-treasure/70 bg-treasure/10 text-treasure hover:bg-treasure/20',
};

/**
 * The one button in the app.
 *
 * Looks like a hand-cut wooden control riveted onto parchment, but stays a
 * real `<button>` with a real text label: nothing important is baked into art.
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

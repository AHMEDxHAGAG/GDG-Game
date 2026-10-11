import Link from 'next/link';

import { ui } from '@/content/ui';
import { NauticalBackground } from '@/components/shared/NauticalBackground';

export default function NotFound(): React.JSX.Element {
  return (
    <NauticalBackground withCompass>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <p dir="ltr" className="font-display text-6xl text-accent-gold">
          404
        </p>
        <h1 className="mt-2 text-xl font-extrabold text-text-primary">{ui.errors.notFound}</h1>
        <p className="mt-2 text-sm text-text-secondary">{ui.errors.notFoundBody}</p>
        <div className="mt-4">
          <Link
            href="/"
            className="rpg-button rpg-button-primary inline-flex min-h-11 items-center justify-center font-bold text-text-primary"
          >
            {ui.errors.backHome}
          </Link>
        </div>
      </main>
    </NauticalBackground>
  );
}

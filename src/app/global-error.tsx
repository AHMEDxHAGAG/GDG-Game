'use client';

import { ui } from '@/content/ui';
import { PirateButton } from '@/components/shared/PirateButton';
import { NauticalBackground } from '@/components/shared/NauticalBackground';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.JSX.Element {
  return (
    <html lang="ar" dir="rtl">
      <body className="bg-background text-text-primary">
        <NauticalBackground>
          <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
            <h1 className="text-xl font-extrabold">{ui.errors.genericTitle}</h1>
            <p className="mt-2 text-sm text-text-secondary" dir="auto">
              {error.message || ui.errors.genericBody}
            </p>
            <div className="mt-4">
              <PirateButton onClick={reset}>{ui.errors.retry}</PirateButton>
            </div>
          </main>
        </NauticalBackground>
      </body>
    </html>
  );
}

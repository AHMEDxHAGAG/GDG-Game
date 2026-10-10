'use client';

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
      <body className="bg-parchment-300 text-ink">
        <NauticalBackground>
          <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
            <h1 className="text-xl font-extrabold">البدلة ضعفت شوية</h1>
            <p className="mt-2 text-sm text-ink-soft" dir="auto">
              {error.message || 'حصلت مشكلة غير متوقعة. جرب تاني.'}
            </p>
            <div className="mt-4">
              <PirateButton onClick={reset}>جرب تاني</PirateButton>
            </div>
          </main>
        </NauticalBackground>
      </body>
    </html>
  );
}

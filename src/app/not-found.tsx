import Link from 'next/link';

import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { PirateButton } from '@/components/shared/PirateButton';

export default function NotFound(): React.JSX.Element {
  return (
    <NauticalBackground withCompass>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <p dir="ltr" className="font-display text-6xl text-ink">404</p>
        <h1 className="mt-2 text-xl font-extrabold">الجزيرة دي مش على الخريطة!</h1>
        <p className="mt-2 text-sm text-ink-soft">الصفحة اللي بتدور عليها مش موجودة. ارجع للرحلة من الأول.</p>
        <div className="mt-4">
          <Link href="/">
            <PirateButton>يلا نبدأ المغامرة!</PirateButton>
          </Link>
        </div>
      </main>
    </NauticalBackground>
  );
}

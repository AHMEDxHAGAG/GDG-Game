import type { Metadata } from 'next';

import { ui } from '@/content/ui';
import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { AnalyzingScene } from '@/features/quiz/components/AnalyzingScene';

export const metadata: Metadata = {
  title: 'بنحسب نتيجتك',
  description: ui.analyzing.headline,
};

/**
 * Named `analyzing`, not the spec's `loading`: `app/loading.tsx` is a
 * reserved Next.js App Router filename for a Suspense boundary, so a route at
 * `app/loading/` can never coexist with it.
 */
export default function AnalyzingPage(): React.JSX.Element {
  return (
    <QuizProvider>
      <AnalyzingScene />
    </QuizProvider>
  );
}

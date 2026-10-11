import type { Metadata } from 'next';

import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { TRACK_IDS } from '@/features/characters/types';
import { ResultScene } from '@/features/reveal/components/ResultScene';

export const metadata: Metadata = {
  title: 'نتيجتك',
  description: 'شوف نتيجتك واحفظ كارت شخصيتك أو شاركه.',
};

/**
 * There are only five personas, so the whole route is prerendered at build
 * time. Without this it was the one dynamic route in the app: every share
 * link paid a server render before it could paint, for output that is
 * identical for all visitors apart from the `trackId` already in the path.
 */
export function generateStaticParams(): { trackId: string }[] {
  return TRACK_IDS.map((trackId) => ({ trackId }));
}

/*
 * An id outside the five is left to render on demand and is answered by
 * `ResultScene`'s existing "finish the quiz first" guard — the same thing a
 * valid deep link shows when opened on a device with no stored session.
 * `dynamicParams = false` is deliberately not set: it would turn that guard
 * into a 404 for the shared-link case, which is the opposite of the intent.
 */

export default async function ResultPage({
  params,
}: {
  params: Promise<{ trackId: string }>;
}): Promise<React.JSX.Element> {
  const { trackId } = await params;
  return (
    <QuizProvider>
      <ResultScene trackId={trackId} />
    </QuizProvider>
  );
}
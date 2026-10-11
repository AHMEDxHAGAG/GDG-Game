import type { Metadata } from 'next';

import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { ResultScene } from '@/features/reveal/components/ResultScene';

export const metadata: Metadata = {
  title: 'نتيجتك',
  description: 'شوف نتيجتك واحفظ كارت شخصيتك أو شاركه.',
};

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

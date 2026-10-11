import type { Metadata } from 'next';

import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { MatchesScene } from '@/features/matches/components/MatchesScene';

export const metadata: Metadata = {
  title: 'ترتيب شخصياتك',
  description: 'شوف الشخصيات مترتبة حسب إجاباتك، واختار اللي شايفها أقرب ليك.',
};

export default function MatchesPage(): React.JSX.Element {
  return (
    <QuizProvider>
      <MatchesScene />
    </QuizProvider>
  );
}

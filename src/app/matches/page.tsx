import type { Metadata } from 'next';

import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { MatchesScene } from '@/features/matches/components/MatchesScene';

export const metadata: Metadata = {
  title: 'ترتيب شخصياتك',
  description: 'شوف الشخصيات مرتبة حسب إجاباتك، واختار اللي حاسس إنها أقربلك.',
};

export default function MatchesPage(): React.JSX.Element {
  return (
    <QuizProvider>
      <MatchesScene />
    </QuizProvider>
  );
}

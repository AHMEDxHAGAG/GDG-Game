import type { Metadata } from 'next';

import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { QuizScene } from '@/features/quiz/components/QuizScene';

export const metadata: Metadata = {
  title: 'الاختبار',
  description: 'عشرة أسئلة اختيار من متعدد، وكل إجابة بتقرّبك من شخصيتك.',
};

export default function QuizPage(): React.JSX.Element {
  return (
    <QuizProvider>
      <QuizScene />
    </QuizProvider>
  );
}

import type { Metadata } from 'next';

import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { QuizScene } from '@/features/quiz/components/QuizScene';

export const metadata: Metadata = {
  title: 'الاختبار',
  description: '١٠ أسئلة، اختار الإجابة الأقرب ليك في كل سؤال.',
};

export default function QuizPage(): React.JSX.Element {
  return (
    <QuizProvider>
      <QuizScene />
    </QuizProvider>
  );
}

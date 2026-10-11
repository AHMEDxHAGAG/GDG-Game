import type { Metadata } from 'next';

import { site } from '@/config/site';
import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { LandingScene } from '@/features/quiz/components/LandingScene';

export const metadata: Metadata = {
  title: site.titleAr,
  description: 'اكتشف أي مسار في GDGoC AASTMT Aswan يناسبك من خلال عشرة أسئلة.',
};

export default function HomePage(): React.JSX.Element {
  return (
    <QuizProvider>
      <LandingScene />
    </QuizProvider>
  );
}

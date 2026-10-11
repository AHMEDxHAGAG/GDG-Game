import type { Metadata } from 'next';

import { ui } from '@/content/ui';
import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { TracksScene } from '@/features/tracks/components/TracksScene';

export const metadata: Metadata = {
  title: ui.gallery.title,
  description: ui.gallery.subtitle,
};

export default function TracksPage(): React.JSX.Element {
  return (
    <QuizProvider>
      <TracksScene />
    </QuizProvider>
  );
}

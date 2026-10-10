import type { Metadata } from 'next';

import { site } from '@/config/site';
import { PresentationScreen } from '@/features/present/components/PresentationScreen';

export const metadata: Metadata = {
  title: `Invitation · ${site.title}`,
  description: site.taglineAr,
};

export default function PresentPage(): React.JSX.Element {
  return <PresentationScreen />;
}

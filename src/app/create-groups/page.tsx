import type { Metadata } from 'next';

import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { CreateGroupsScene } from '@/features/teams/components/CreateGroupsScene';

export const metadata: Metadata = {
  title: 'اعمل فريق',
  description: 'كوّن فريق مع أصحابك أو ادخل فريق موجود بكود.',
};

/**
 * The scene fetches nothing on the server: with no session, a server render
 * could not tell who was asking or whether they were a member of the room.
 */
export default function CreateGroupsPage(): React.JSX.Element {
  return (
    <QuizProvider persist>
      <CreateGroupsScene />
    </QuizProvider>
  );
}
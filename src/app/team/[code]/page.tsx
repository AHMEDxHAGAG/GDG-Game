import type { Metadata } from 'next';

import { QuizProvider } from '@/features/quiz/state/QuizProvider';
import { TeamScene } from '@/features/teams/components/TeamScene';
import { normalizeJoinCode } from '@/lib/team-codes';

export const metadata: Metadata = {
  title: 'روم الفريق',
  description: 'فريقك والمسارات اللي كل واحد ماسكها.',
};

/**
 * The code is the whole address, so there is nothing to prerender from — the
 * roster is read in the browser. Normalising here means `a3f9b2`, `A3 F9 B2`
 * and `A3F9B2` all reach the scene as the same string, so a code pasted with
 * spaces or typed in lower case still opens the room.
 */
export default async function TeamPage({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<React.JSX.Element> {
  const { code } = await params;
  const joinCode = normalizeJoinCode(code) ?? code;

  return (
    <QuizProvider persist>
      <TeamScene joinCode={joinCode} />
    </QuizProvider>
  );
}
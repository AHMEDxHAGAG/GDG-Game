'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';

import { ui } from '@/content/ui';
import { RANK_LABELS_AR } from '@/content/questions';
import { getCharacter } from '@/config/characters';
import { TOTAL_POINTS } from '@/features/quiz/types';
import { useQuiz } from '@/features/quiz/state/QuizProvider';
import { resultRoute } from '@/lib/routes';
import type { RankedMatch } from '@/features/quiz/scoring/scoreAnswers';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { PirateButton } from '@/components/shared/PirateButton';
import { CharacterArtwork } from '@/components/characters/CharacterArtwork';
import { TrackEmblem } from '@/components/characters/TrackEmblem';

/**
 * Ranked matches.
 *
 * All five personas are shown in score order and every row is selectable —
 * the visitor picks the one that feels like theirs, not necessarily the top of
 * the list. Choosing is the whole point of this screen; the ranking is advice,
 * not a verdict, and the footer says so.
 */
export function MatchesScene(): React.JSX.Element {
  const router = useRouter();
  const { state, isHydrated, enterPhase, chooseTrack } = useQuiz();

  const ranking = state.ranking;

  // A direct visit with nothing scored is not a five-star review opportunity —
  // it is a broken link. Send them to the quiz.
  useEffect(() => {
    if (!isHydrated) return;
    enterPhase('matches');
  }, [isHydrated, enterPhase]);

  // Latched: this is an entry check. Re-running it whenever `ranking` changed
  // would fire a redirect out of the screen on any later state change.
  const checkedEntry = useRef(false);
  useEffect(() => {
    if (!isHydrated || checkedEntry.current) return;
    checkedEntry.current = true;
    if (ranking === null) router.replace('/quiz');
  }, [isHydrated, ranking, router]);

  if (!isHydrated || ranking === null) {
    return (
      <NauticalBackground>
        <main className="grid min-h-[100dvh] place-items-center" aria-busy="true">
          <span className="sr-only">{ui.matches.empty}</span>
        </main>
      </NauticalBackground>
    );
  }

  return (
    <NauticalBackground scene="gallery" withLantern>
      <main
        className="matches-layout mx-auto flex min-h-[100dvh] w-full max-w-[42.5rem] flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6"
        data-scene="matches"
      >
        <h1
          className="animate-rise-in text-center text-shadow-pixel font-display font-black text-accent-gold"
          style={{ fontSize: 'clamp(1.5rem, 7vw, 2.125rem)' }}
        >
          {ui.matches.title}
        </h1>
        <p className="animate-rise-in mt-1.5 text-center text-text-secondary [animation-delay:80ms]">
          {ui.matches.subtitle}
        </p>

        {/* Announced once so a screen reader hears the verdict before the
            visitor starts arrowing through the list. */}
        <p className="sr-only" role="status">
          {ranking
            .map((match) => {
              const character = getCharacter(match.trackId);
              return `${RANK_LABELS_AR[match.rank - 1]}: ${character.titleAr}`;
            })
            .join('، ')}
        </p>

        <ol aria-label={ui.matches.legend} className="mt-4 flex flex-col gap-2.5">
          {ranking.map((match, position) => (
            <li key={match.trackId}>
              <MatchRow
                match={match}
                isBest={position === 0}
                onSelect={() => {
                  chooseTrack(match.trackId);
                  router.push(resultRoute(match.trackId));
                }}
              />
            </li>
          ))}
        </ol>

        <p className="mt-4 text-center text-[0.78rem] leading-relaxed text-text-secondary">
          {ui.matches.footnote}
        </p>

        <div className="mt-auto pt-5">
          <PirateButton fullWidth variant="secondary" onClick={() => router.push('/quiz')}>
            {ui.matches.backToQuiz}
          </PirateButton>
        </div>
      </main>
    </NauticalBackground>
  );
}

/**
 * One ranked persona.
 *
 * A real `<button>` so it is reachable by keyboard and announced as an action.
 * The rank badge, the score meter and the name all carry meaning, so the row
 * is never communicated by colour alone.
 */
function MatchRow({
  match,
  isBest,
  onSelect,
}: {
  match: RankedMatch;
  isBest: boolean;
  onSelect: () => void;
}): React.JSX.Element {
  const character = getCharacter(match.trackId);
  const rankLabel = RANK_LABELS_AR[match.rank - 1] ?? String(match.rank);

  return (
    <button
      type="button"
      onClick={onSelect}
      data-track-id={match.trackId}
      data-rank={match.rank}
      className={`match-row navy-panel group relative flex w-full items-center gap-2 rounded-md px-1 py-3 sm:gap-4 sm:px-3 text-start transition-transform duration-150 hover:-translate-y-1 ${
        isBest ? 'border-accent-gold/60' : 'border-surface-border'
      } bg-surface/85`}
      style={{ ['--row-accent' as string]: character.palette.vivid }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 -start-10 w-24 opacity-40 blur-2xl transition-opacity group-hover:opacity-70"
        style={{ backgroundColor: character.palette.vivid }}
      />

      <span
        className="match-rank relative grid size-9 shrink-0 place-items-center rounded-full border-2 font-brand text-[0.7rem] font-bold"
        style={{
          borderColor: character.palette.vivid,
          backgroundColor: `${character.palette.vivid}1f`,
          color: character.palette.vivid,
        }}
      >
        <span className="sr-only">{rankLabel}: </span>
        <span aria-hidden="true">{match.rank}</span>
      </span>

      <span className="match-art relative h-24 w-14 shrink-0">
        <CharacterArtwork character={character} className="h-full w-full" />
      </span>

      <span className="match-copy relative min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline gap-1.5">
          <span className="text-sm font-bold text-text-secondary">{rankLabel}</span>
          {isBest ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-gold/15 px-1.5 py-px text-xs font-bold text-accent-gold">
              <Check className="size-2.5" aria-hidden="true" />
              {ui.matches.best}
            </span>
          ) : null}
        </span>
        <span
          className="block text-[1.05rem] leading-tight font-extrabold"
          style={{ color: character.palette.vivid }}
        >
          {character.titleAr}
        </span>
        <span className="flex items-center gap-1.5">
          <TrackEmblem
            emblem={character.emblem}
            color={character.palette.vivid}
            className="size-3 shrink-0"
          />
          <span dir="ltr" className="min-w-0 text-xs text-text-secondary">
            {character.trackName}
          </span>
        </span>
      </span>

      <span className="match-score relative flex shrink-0 flex-col items-end gap-1">
        <span className="text-sm font-bold text-text-secondary">
          {ui.matches.scoreLabel(match.score)}
        </span>
        <span
          aria-hidden="true"
          className="h-1.5 w-12 overflow-hidden rounded-full bg-progress-inactive/40"
        >
          <span
            className="block h-full rounded-full"
            style={{
              width: `${Math.max(match.ratio, 0.02) * 100}%`,
              backgroundColor: character.palette.vivid,
            }}
          />
        </span>
        <span className="text-xs text-text-secondary/70">{TOTAL_POINTS}</span>
      </span>
    </button>
  );
}

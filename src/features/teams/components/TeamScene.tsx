'use client';

import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, Crown, LogOut, Pencil, Users } from 'lucide-react';

import { ui } from '@/content/ui';
import { getCharacter } from '@/config/characters';
import { useVisitor } from '@/features/teams/visitor';
import { leaveRoom, loadRoom, renameRoom } from '@/features/teams/api';
import { MAX_ROOM_NAME_LENGTH, ROOM_CAPACITY } from '@/config/team';
import { CREATE_GROUPS_ROUTE } from '@/lib/routes';
import { formatJoinCode } from '@/lib/team-codes';
import type { RoomErrorCode, RoomWithRoster } from '@/features/teams/types';
import { CharacterArtwork } from '@/components/characters/CharacterArtwork';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { PirateButton } from '@/components/shared/PirateButton';
import { TrackEmblem } from '@/components/characters/TrackEmblem';

/** How often the roster re-reads while the page is open. */
const POLL_MS = 5000;

/**
 * A room.
 *
 * The roster is fetched from the browser rather than rendered on the server,
 * because there is no session to render it for: identity is a device-local id,
 * so a server render could not tell who was asking or whether they were a
 * member. The trade is one round trip on load instead of zero, which is the
 * right way round for a page that exists for a few seconds at a time.
 *
 * It polls rather than subscribing to Realtime. A realtime subscription on
 * `room_members` would need `anon` to hold SELECT on that table, which is the
 * one thing the access model is built to avoid — it would let anyone enumerate
 * every membership in the database. Five seconds on a four-seat room is
 * imperceptible, and it costs nothing to give up.
 */
export function TeamScene({ joinCode }: { joinCode: string }): React.JSX.Element {
  const router = useRouter();
  const { visitorId, visitorToken, isReady: isVisitorReady, isOffline } = useVisitor();

  const [roster, setRoster] = useState<RoomWithRoster | null>(null);
  const [error, setError] = useState<RoomErrorCode | null>(null);
  const [isFetched, setIsFetched] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (isOffline || !isVisitorReady || visitorId === '') return;

    let disposed = false;
    // Tracks whether a roster has ever landed, so a poll that fails partway
    // through keeps the room on screen instead of blanking it.
    let hasRoster = false;

    const refresh = async () => {
      const outcome = await loadRoom(joinCode, visitorId);
      if (disposed) return;
      if (outcome.ok) {
        setRoster(outcome.data);
        hasRoster = true;
        setError(null);
      } else if (!hasRoster) {
        setError(outcome.error);
      }
      setIsFetched(true);
    };

    void refresh();
    const timer = window.setInterval(() => void refresh(), POLL_MS);

    return () => {
      disposed = true;
      window.clearInterval(timer);
    };
  }, [joinCode, visitorId, isVisitorReady, isOffline]);

  const handleRename = (name: string) => {
    if (!roster) return;
    setError(null);
    startTransition(async () => {
      const outcome = await renameRoom(visitorId, visitorToken, roster.room.id, name);
      if (outcome.ok) {
        setRoster((current) =>
          current === null ? current : { ...current, room: { ...outcome.data, isOwner: true } },
        );
        setIsEditing(false);
      } else {
        setError(outcome.error);
      }
    });
  };

  const handleLeave = () => {
    if (!roster) return;
    startTransition(async () => {
      const outcome = await leaveRoom(visitorId, visitorToken, roster.room.id);
      // Leaving always navigates. A refusal (someone else's room, a stale id)
      // is not worth explaining at this point in the flow.
      if (!outcome.ok) setError(outcome.error);
      router.push(CREATE_GROUPS_ROUTE);
    });
  };

  // With no project there is nothing to check, so say so rather than spinning
  // forever waiting on a request that was never made.
  if (isOffline) return <RoomNotFound reason="offline" />;

  if (!isFetched && isVisitorReady && visitorId !== '') {
    return (
      <NauticalBackground scene="cabin">
        <main className="grid min-h-[100dvh] place-items-center" data-scene="team" aria-busy="true">
          <span className="sr-only">{ui.identity.loading}</span>
        </main>
      </NauticalBackground>
    );
  }

  if (roster === null) {
    return <RoomNotFound reason={error} />;
  }

  const { room, members } = roster;
  const emptySeats = ROOM_CAPACITY - members.length;

  return (
    <NauticalBackground scene="gallery" withLantern>
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-[42.5rem] flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6"
        data-scene="team"
      >
        <h1
          className="animate-rise-in text-center text-shadow-pixel font-display font-black text-accent-gold"
          style={{ fontSize: 'clamp(1.5rem, 7vw, 2.125rem)' }}
          data-testid="team-name"
        >
          {room.name}
        </h1>

        <div className="mt-1.5 flex flex-wrap items-center justify-center gap-2">
          <p className="text-text-secondary" data-testid="team-count">
            {ui.teams.memberCount(members.length, ROOM_CAPACITY)}
          </p>
          {room.isOwner ? (
            isEditing ? (
              <RenameForm
                initialName={room.name}
                disabled={isPending}
                onCancel={() => setIsEditing(false)}
                onSubmit={handleRename}
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="inline-flex min-h-11 items-center gap-1 text-[0.82rem] font-bold text-text-secondary underline decoration-accent-gold underline-offset-4 hover:text-text-primary"
              >
                <Pencil className="size-3.5" aria-hidden="true" />
                {ui.teams.renameCta}
              </button>
            )
          ) : null}
        </div>

        {error ? (
          <p
            role="alert"
            className="mt-3 rounded-md border border-accent-red-high/50 bg-accent-red/15 px-3 py-2 text-center text-[0.85rem] font-bold text-accent-red-high"
          >
            {ui.teamErrors[error]}
          </p>
        ) : null}

        <ol className="mt-4 flex flex-col gap-2.5" aria-label={ui.teams.roomTitle}>
          {members.map((member) => (
            <li key={member.visitorId}>
              <MemberRow member={member} isViewer={member.visitorId === visitorId} />
            </li>
          ))}
          {Array.from({ length: emptySeats }, (_, index) => (
            <li
              key={`empty-${index}`}
              aria-hidden="true"
              data-testid="team-empty-seat"
              className="flex items-center justify-center gap-2 rounded-md border-2 border-dashed border-surface-border/50 px-3 py-4 text-sm font-bold text-text-secondary/60"
            >
              <Users className="size-4" />
              {ui.teams.emptySlots}
            </li>
          ))}
        </ol>

        <section className="navy-panel mt-5 p-4 text-center">
          <h2 className="text-base font-extrabold text-accent-gold">{ui.teams.shareCodeLabel}</h2>
          <p
            dir="ltr"
            className="mt-1 font-brand text-[2rem] font-bold tracking-[0.2em] text-text-primary"
            data-testid="team-code"
          >
            {formatJoinCode(joinCode)}
          </p>
          <p className="mt-1 text-[0.8rem] text-text-secondary">{ui.teams.shareCodeHint}</p>
          <CopyCode code={joinCode} />
        </section>

        <div className="mt-auto flex flex-col gap-2 pt-6 sm:flex-row">
          <PirateButton fullWidth variant="secondary" onClick={() => router.push(CREATE_GROUPS_ROUTE)}>
            {ui.teams.backToGroups}
          </PirateButton>
          <PirateButton
            fullWidth
            variant="ghost"
            onClick={handleLeave}
            disabled={isPending}
            icon={<LogOut className="size-4" aria-hidden="true" />}
          >
            {ui.teams.leaveCta}
          </PirateButton>
        </div>
      </main>
    </NauticalBackground>
  );
}

/**
 * Why there is no room on screen: a bad code, a code nobody issued, or no
 * project to check it against.
 *
 * Client-side only because the primary action is a real `PirateButton`, and a
 * `<button>` inside an `<a>` is invalid markup that breaks keyboard
 * navigation — so this navigates rather than wrapping.
 */
export function RoomNotFound({
  reason,
}: {
  reason: RoomErrorCode | 'offline' | null;
}): React.JSX.Element {
  const router = useRouter();

  const offline = reason === 'offline';
  const title = offline ? ui.teams.notConfiguredTitle : ui.teams.notFoundTitle;
  const body = offline
    ? ui.teams.notConfiguredBody
    : reason === 'invalid_code'
      ? ui.teams.badCodeBody
      : ui.teams.notFoundBody;

  return (
    <NauticalBackground scene="cabin">
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center"
        data-scene={offline ? 'create-groups' : 'team-not-found'}
      >
        <h1 className="font-display text-2xl font-black text-accent-gold">{title}</h1>
        <p className="text-base leading-relaxed text-text-secondary">{body}</p>
        <PirateButton onClick={() => router.push('/')}>{ui.teams.notFoundCta}</PirateButton>
      </main>
    </NauticalBackground>
  );
}

/** One crewmate, with the track they brought. */
function MemberRow({
  member,
  isViewer,
}: {
  member: RoomWithRoster['members'][number];
  isViewer: boolean;
}): React.JSX.Element {
  const character = getCharacter(member.trackId);

  return (
    <div
      className={`navy-panel flex w-full items-center gap-3 px-3 py-2.5 ${
        member.isOwner ? 'border-accent-gold/60' : ''
      }`}
      data-track-id={member.trackId}
    >
      <span className="h-16 w-11 shrink-0">
        <CharacterArtwork character={character} className="h-full w-full" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[1.05rem] font-extrabold text-text-primary">
          {member.name}
        </span>
        <span className="mt-0.5 flex items-center gap-1.5">
          <TrackEmblem
            emblem={character.emblem}
            color={character.palette.vivid}
            className="size-3 shrink-0"
          />
          <span className="truncate text-sm font-bold" style={{ color: character.palette.vivid }}>
            {character.titleAr}
          </span>
        </span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1">
        {member.isOwner ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-accent-gold/15 px-1.5 py-px text-[0.7rem] font-bold text-accent-gold">
            <Crown className="size-2.5" aria-hidden="true" />
            {ui.teams.ownerBadge}
          </span>
        ) : null}
        {isViewer ? (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-border/30 px-1.5 py-px text-[0.7rem] font-bold text-text-secondary">
            <Check className="size-2.5" aria-hidden="true" />
            {ui.teams.youBadge}
          </span>
        ) : null}
      </span>
    </div>
  );
}

/** Inline rename. Owner only — `rename_room` re-checks that server-side. */
function RenameForm({
  initialName,
  disabled,
  onSubmit,
  onCancel,
}: {
  initialName: string;
  disabled: boolean;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}): React.JSX.Element {
  const [name, setName] = useState(initialName);
  const trimmed = name.trim();

  return (
    <form
      className="flex items-center gap-1.5"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed.length > 0) onSubmit(trimmed);
      }}
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
        maxLength={MAX_ROOM_NAME_LENGTH}
        aria-label={ui.teams.nameLabel}
        dir="auto"
        autoComplete="off"
        data-testid="room-rename-input"
        className="min-h-11 w-40 rounded-md border-2 border-surface-border bg-surface/85 px-2 py-1.5 text-sm font-semibold text-text-primary focus:border-accent-gold"
      />
      <PirateButton type="submit" disabled={disabled || trimmed.length === 0}>
        {ui.teams.renameSave}
      </PirateButton>
      <PirateButton variant="ghost" onClick={onCancel} disabled={disabled}>
        {ui.teams.renameCancel}
      </PirateButton>
    </form>
  );
}

/** Copy-to-clipboard with a spoken confirmation. */
function CopyCode({ code }: { code: string }): React.JSX.Element {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setState('copied');
    } catch {
      setState('failed');
    }
    window.setTimeout(() => setState('idle'), 2500);
  };

  return (
    <div className="mt-3">
      <PirateButton
        fullWidth
        variant="secondary"
        onClick={() => void copy()}
        icon={<Copy className="size-4" aria-hidden="true" />}
      >
        {ui.teams.copyCode}
      </PirateButton>
      {state !== 'idle' ? (
        <p
          role="status"
          className={`mt-2 text-[0.82rem] font-bold ${
            state === 'copied' ? 'text-accent-gold' : 'text-accent-red-high'
          }`}
        >
          {state === 'copied' ? ui.teams.copied : ui.teams.copyFailed}
        </p>
      ) : null}
    </div>
  );
}

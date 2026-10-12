'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { DoorOpen, Plus, Users } from 'lucide-react';

import { ui } from '@/content/ui';
import { useQuiz } from '@/features/quiz/state/QuizProvider';
import { useVisitor } from '@/features/teams/visitor';
import { createRoom, joinRoom } from '@/features/teams/api';
import { MAX_ROOM_NAME_LENGTH } from '@/config/team';
import { teamRoute } from '@/lib/routes';
import { normalizeJoinCode } from '@/lib/team-codes';
import type { RoomErrorCode } from '@/features/teams/types';
import { NauticalBackground } from '@/components/shared/NauticalBackground';
import { PirateButton } from '@/components/shared/PirateButton';

type Mode = 'create' | 'join';

/**
 * The team hub: create a room, or join one by its code.
 *
 * There is no account, so the only thing a visitor has to give up is a name —
 * and that is asked for first, here, rather than on the quiz screen where it
 * is genuinely optional. Somebody who skips it should be able to do the whole
 * quiz and still walk into a room later without going back.
 *
 * One option is open at a time rather than two forms stacked. The two answers
 * are mutually exclusive, and a visitor who has just tapped "create" does not
 * need a join field under it competing for the same attention.
 */
export function CreateGroupsScene(): React.JSX.Element {
  const router = useRouter();
  const { state, isHydrated, setUsername } = useQuiz();
  const {
    visitorId, visitorToken, name, isReady: isVisitorReady, isOffline, saveName, ensureRegistered,
  } = useVisitor();

  const [mode, setMode] = useState<Mode | null>(null);
  const [error, setError] = useState<RoomErrorCode | null>(null);
  const [isPending, startTransition] = useTransition();

  if (isOffline) return <NotConfigured />;

  // Separate early returns rather than one combined condition: the first is a
  // loading state that resolves on the next paint, the second is a real "you
  // have not finished the quiz" answer. Merging them also leaves `trackId`
  // unnarrowed for everything below.
  if (!isHydrated || !isVisitorReady) return <Busy />;

  // A track is what a member brings into a room, so a visitor who has not
  // reached the matches screen yet has nothing to join with.
  const trackId = state.selectedTrackId;
  if (trackId === null) return <NotReady />;

  // No name yet. Ask for it here rather than sending the RPC and letting the
  // database refuse with "unknown_visitor", which means nothing to a visitor.
  if (name === null) {
    return <AskName onSave={(value) => {
      saveName(value);
      setUsername(value);
    }} />;
  }

  return (
    <NauticalBackground scene="cabin" withLantern>
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-lg flex-col px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6"
        data-scene="create-groups"
      >
        <h1
          className="animate-rise-in text-center text-shadow-pixel font-display font-black text-accent-gold"
          style={{ fontSize: 'clamp(1.5rem, 7vw, 2.125rem)' }}
        >
          {ui.teams.createGroupsTitle}
        </h1>
        <p className="animate-rise-in mt-1.5 text-center text-text-secondary [animation-delay:80ms]">
          {ui.teams.createGroupsSubtitle}
        </p>
        <p
          className="mt-2 text-center text-sm text-text-secondary"
          data-testid="create-groups-name"
        >
          {ui.identity.labelled} <span className="font-bold text-accent-gold">{name}</span>
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <OptionCard
            active={mode === 'create'}
            title={ui.teams.createOptionTitle}
            body={ui.teams.createOptionBody}
            icon={<Plus className="size-6" aria-hidden="true" />}
            onSelect={() => {
              setError(null);
              setMode('create');
            }}
          />
          <OptionCard
            active={mode === 'join'}
            title={ui.teams.joinOptionTitle}
            body={ui.teams.joinOptionBody}
            icon={<DoorOpen className="size-6" aria-hidden="true" />}
            onSelect={() => {
              setError(null);
              setMode('join');
            }}
          />
        </div>

        {mode === 'create' ? (
          <CreateForm
            disabled={isPending}
            onSubmit={(roomName) =>
              startTransition(async () => {
                const registration = await ensureRegistered();
                if (!registration.ok) {
                  setError(registration.error);
                  return;
                }
                const outcome = await createRoom(visitorId, visitorToken, roomName, trackId);
                if (outcome.ok) router.push(teamRoute(outcome.data.joinCode));
                else setError(outcome.error);
              })
            }
          />
        ) : null}

        {mode === 'join' ? (
          <JoinForm
            disabled={isPending}
            onSubmit={(code) =>
              startTransition(async () => {
                const registration = await ensureRegistered();
                if (!registration.ok) {
                  setError(registration.error);
                  return;
                }
                const outcome = await joinRoom(visitorId, visitorToken, code, trackId);
                if (outcome.ok) router.push(teamRoute(outcome.data.joinCode));
                else setError(outcome.error);
              })
            }
          />
        ) : null}

        {error ? (
          <p
            role="alert"
            data-testid="create-groups-error"
            className="mt-3 rounded-md border border-accent-red-high/50 bg-accent-red/15 px-3 py-2 text-center text-[0.9rem] font-bold text-accent-red-high"
          >
            {ui.teamErrors[error]}
          </p>
        ) : null}

        <p className="mt-auto pt-6 text-center text-[0.78rem] leading-relaxed text-text-secondary/80">
          {ui.teams.noAccountNote}
        </p>
      </main>
    </NauticalBackground>
  );
}

/**
 * One of the two ways in.
 *
 * A `<button>` with `aria-pressed` rather than a radio: only one is ever open,
 * and the choice is a disclosure, not a form value.
 */
function OptionCard({
  active,
  title,
  body,
  icon,
  onSelect,
}: {
  active: boolean;
  title: string;
  body: string;
  icon: React.ReactNode;
  onSelect: () => void;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={active}
      className={`navy-panel flex flex-col items-center gap-1.5 px-4 py-5 text-center transition-transform duration-150 hover:-translate-y-1 ${
        active ? 'ring-3 ring-accent-gold' : ''
      }`}
    >
      <span className={active ? 'text-accent-gold' : 'text-text-secondary'}>{icon}</span>
      <span className="text-lg font-extrabold text-text-primary">{title}</span>
      <span className="text-[0.82rem] leading-relaxed text-text-secondary">{body}</span>
    </button>
  );
}

/**
 * The one thing a visitor has to give. No account, no password — just the name
 * that goes on the card and beside their track in the room.
 */
function AskName({ onSave }: { onSave: (name: string) => void }): React.JSX.Element {
  const inputId = useId();
  const [value, setValue] = useState('');
  const trimmed = value.trim();

  return (
    <NauticalBackground scene="cabin" withLantern>
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center"
        data-scene="create-groups"
      >
        <h1 className="font-display text-2xl font-black text-accent-gold">
          {ui.teams.askNameTitle}
        </h1>
        <p className="text-base leading-relaxed text-text-secondary">{ui.teams.askNameBody}</p>
        <form
          className="w-full"
          onSubmit={(event) => {
            event.preventDefault();
            if (trimmed.length > 0) onSave(trimmed);
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            {ui.teams.askNameLabel}
          </label>
          <input
            id={inputId}
            value={value}
            onChange={(event) => setValue(event.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
            maxLength={MAX_ROOM_NAME_LENGTH}
            placeholder={ui.teams.askNamePlaceholder}
            enterKeyHint="go"
            dir="auto"
            autoComplete="off"
            autoFocus
            data-testid="ask-name-input"
            className="w-full rounded-md border-2 border-surface-border bg-surface/85 px-3 py-3 text-center text-[1.1rem] font-semibold text-text-primary placeholder:font-normal placeholder:text-text-secondary/70 focus:border-accent-gold"
          />
          <PirateButton
            fullWidth
            className="mt-3"
            type="submit"
            disabled={trimmed.length === 0}
            icon={<Users className="size-4" aria-hidden="true" />}
          >
            {ui.teams.askNameCta}
          </PirateButton>
        </form>
      </main>
    </NauticalBackground>
  );
}

function CreateForm({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (name: string) => void;
}): React.JSX.Element {
  const inputId = useId();
  const [name, setName] = useState('');
  const trimmed = name.trim();

  return (
    <form
      className="mt-4 rounded-md border-2 border-accent-gold/50 bg-surface/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (trimmed.length > 0) onSubmit(trimmed);
      }}
    >
      <label
        htmlFor={inputId}
        className="mb-1.5 flex items-baseline justify-between gap-2 text-[0.9rem] font-bold text-text-primary"
      >
        <span>{ui.teams.nameLabel}</span>
        <span className="text-[0.7rem] font-semibold text-text-secondary">
          {ui.teams.nameMax}
        </span>
      </label>
      <input
        id={inputId}
        value={name}
        onChange={(event) => setName(event.target.value.slice(0, MAX_ROOM_NAME_LENGTH))}
        maxLength={MAX_ROOM_NAME_LENGTH}
        placeholder={ui.teams.namePlaceholder}
        enterKeyHint="go"
        dir="auto"
        autoComplete="off"
        data-testid="room-name-input"
        className="w-full rounded-md border-2 border-surface-border bg-surface/85 px-3 py-2.5 text-[1rem] font-semibold text-text-primary placeholder:font-normal placeholder:text-text-secondary/70 focus:border-accent-gold"
      />
      <PirateButton
        fullWidth
        className="mt-3"
        type="submit"
        disabled={disabled || trimmed.length === 0}
        icon={<Users className="size-4" aria-hidden="true" />}
      >
        {ui.teams.createCta}
      </PirateButton>
    </form>
  );
}

function JoinForm({
  disabled,
  onSubmit,
}: {
  disabled: boolean;
  onSubmit: (code: string) => void;
}): React.JSX.Element {
  const inputId = useId();
  const [code, setCode] = useState('');
  const valid = normalizeJoinCode(code) !== null;

  return (
    <form
      className="mt-4 rounded-md border-2 border-accent-gold/50 bg-surface/70 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (valid) onSubmit(code);
      }}
    >
      <label htmlFor={inputId} className="mb-1.5 block text-[0.9rem] font-bold text-text-primary">
        {ui.teams.shareCodeLabel}
      </label>
      <input
        id={inputId}
        value={code}
        onChange={(event) =>
          setCode(
            event.target.value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase().slice(0, 6),
          )
        }
        maxLength={6}
        placeholder={ui.teams.joinPlaceholder}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        enterKeyHint="go"
        // Latin-only field in an RTL document: without this the code renders
        // right-to-left and "A3F9B2" reads as "B9F3A".
        dir="ltr"
        inputMode="text"
        data-testid="room-code-input"
        className="w-full rounded-md border-2 border-surface-border bg-surface/85 px-3 py-2.5 text-center font-brand text-[1.35rem] font-bold tracking-[0.35em] text-text-primary placeholder:font-sans placeholder:text-[0.95rem] placeholder:tracking-normal placeholder:font-normal placeholder:text-text-secondary/70 focus:border-accent-gold"
      />
      <p className="mt-1.5 text-[0.78rem] text-text-secondary" dir="ltr">
        {ui.teams.joinHint}
      </p>
      <PirateButton
        fullWidth
        className="mt-3"
        type="submit"
        disabled={disabled || !valid}
        icon={<DoorOpen className="size-4" aria-hidden="true" />}
      >
        {ui.teams.joinCta}
      </PirateButton>
    </form>
  );
}

function Busy(): React.JSX.Element {
  return (
    <NauticalBackground scene="cabin">
      <main
        className="grid min-h-[100dvh] place-items-center"
        data-scene="create-groups"
        aria-busy="true"
      >
        <span className="sr-only">{ui.identity.loading}</span>
      </main>
    </NauticalBackground>
  );
}

function NotReady(): React.JSX.Element {
  const router = useRouter();
  return (
    <NauticalBackground scene="cabin">
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center"
        data-scene="create-groups"
      >
        <h1 className="font-display text-2xl font-black text-accent-gold">
          {ui.teams.notReadyTitle}
        </h1>
        <p className="text-base leading-relaxed text-text-secondary">{ui.teams.notReadyBody}</p>
        <PirateButton onClick={() => router.push('/matches')}>
          {ui.teams.notReadyCta}
        </PirateButton>
      </main>
    </NauticalBackground>
  );
}

function NotConfigured(): React.JSX.Element {
  return (
    <NauticalBackground scene="cabin">
      <main
        className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center"
        data-scene="create-groups"
      >
        <h1 className="font-display text-2xl font-black text-accent-gold">
          {ui.teams.notConfiguredTitle}
        </h1>
        <p className="text-base leading-relaxed text-text-secondary">
          {ui.teams.notConfiguredBody}
        </p>
      </main>
    </NauticalBackground>
  );
}

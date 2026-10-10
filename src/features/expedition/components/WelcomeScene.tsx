'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Anchor, Compass, RotateCcw, SkipForward } from 'lucide-react';

import { ui } from '@/content/ui';
import { MAX_NICKNAME_LENGTH } from '@/config/site';
import { normalizeNickname } from '@/features/expedition/state/ExpeditionProvider';
import { ExpeditionBrand, NauticalBackground } from '@/components/shared/NauticalBackground';
import { PirateButton } from '@/components/shared/PirateButton';
import { ShipSilhouette } from '@/components/shared/nautical-art';

export interface WelcomeSceneProps {
  nickname: string | null;
  onNicknameChange: (value: string | null) => void;
  onStart: () => void;
  onResume: () => void;
  canResume: boolean;
}

export function WelcomeScene({
  nickname,
  onNicknameChange,
  onStart,
  onResume,
  canResume,
}: WelcomeSceneProps): React.JSX.Element {
  const inputId = useId();
  const [value, setValue] = useState(nickname ?? '');
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Keep the field in sync when a restored session supplies a nickname.
  useEffect(() => {
    setValue(nickname ?? '');
  }, [nickname]);

  const commitAndStart = () => {
    onNicknameChange(normalizeNickname(value));
    onStart();
  };

  return (
    <NauticalBackground withCompass>
      <header className="flex items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] text-sm font-extrabold">
        <ExpeditionBrand />
        <a
          href="/present"
          className="hidden rounded-xs px-2 py-1 text-ink-soft underline decoration-gold decoration-2 underline-offset-4 hover:text-ink sm:inline-flex"
        >
          شاشة العرض
        </a>
      </header>

      <main
        className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center px-5 pt-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
        data-scene="welcome"
      >
        <div className="animate-drift pointer-events-none -mt-6 mb-1 w-[min(78vw,20rem)] text-ocean-deep/70">
          <ShipSilhouette className="h-auto w-full" />
        </div>

        <p className="animate-bubble-in text-center text-xs font-bold tracking-[0.25em] text-ink-soft uppercase">
          {ui.welcome.eyebrow}
        </p>

        <h1
          ref={headingRef}
          tabIndex={-1}
          className="animate-bubble-in mt-3 text-center font-display text-[clamp(2.1rem,10vw,3.1rem)] leading-[0.95] text-ink text-shadow-ink [animation-delay:80ms]"
          style={{ unicodeBidi: 'isolate' }}
        >
          <span dir="ltr" className="block">
            Pirate Identity
          </span>
          <span dir="ltr" className="block">
            Expedition
          </span>
        </h1>

        <p className="animate-bubble-in mt-4 text-center text-2xl font-extrabold text-treasure [animation-delay:140ms]">
          {ui.welcome.tagline}
        </p>

        <div className="animate-bubble-in mt-4 space-y-1.5 text-center [animation-delay:200ms]">
          <p className="text-[1.02rem] leading-relaxed font-semibold">{ui.welcome.headline}</p>
          <p className="text-[0.95rem] leading-relaxed text-ink-soft">{ui.welcome.body}</p>
          <p className="text-[0.95rem] leading-relaxed text-ink-soft">{ui.welcome.prompt}</p>
        </div>

        <NicknameField
          inputId={inputId}
          value={value}
          onChange={setValue}
          onCommit={commitAndStart}
        />

        <div className="animate-bubble-in mt-6 w-full space-y-3 [animation-delay:320ms]">
          <PirateButton
            fullWidth
            onClick={commitAndStart}
            icon={<Compass className="size-4" />}
            className="text-lg"
          >
            {ui.welcome.cta}
          </PirateButton>

          {canResume ? (
            <ResumeOffer onResume={onResume} onRestart={commitAndStart} />
          ) : null}

          <p className="text-center text-[0.8rem] text-ink-soft">{ui.welcome.hint}</p>
        </div>
      </main>

      <footer className="flex items-center justify-center gap-2 px-5 pb-[max(1rem,env(safe-area-inset-bottom))] text-[0.72rem] text-ink-faint">
        <Anchor className="size-3.5" aria-hidden="true" />
        <span dir="ltr">{ui.welcome.taglineEn}</span>
      </footer>
    </NauticalBackground>
  );
}

interface NicknameFieldProps {
  inputId: string;
  value: string;
  onChange: (value: string) => void;
  onCommit: () => void;
}

function NicknameField({
  inputId,
  value,
  onChange,
  onCommit,
}: NicknameFieldProps): React.JSX.Element {
  return (
    <div className="animate-bubble-in mt-6 w-full [animation-delay:260ms]">
      <label
        htmlFor={inputId}
        className="mb-1.5 flex items-baseline justify-between gap-2 text-[0.9rem] font-bold"
      >
        <span>{ui.nickname.label}</span>
        <span className="text-[0.7rem] font-semibold text-ink-faint">{ui.nickname.optional}</span>
      </label>

      <div className="flex gap-2">
        <input
          id={inputId}
          value={value}
          onChange={(event) => onChange(event.target.value.slice(0, MAX_NICKNAME_LENGTH))}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              onCommit();
            }
          }}
          maxLength={MAX_NICKNAME_LENGTH}
          placeholder={ui.nickname.placeholder}
          autoComplete="off"
          autoCapitalize="words"
          spellCheck={false}
          enterKeyHint="go"
          dir="auto"
          className="min-w-0 flex-1 rounded-md border-2 border-ink/45 bg-parchment-50/80 px-3 py-2.5 text-[1rem] font-semibold shadow-[inset_0_2px_4px_rgba(85,69,53,0.12)] placeholder:font-normal placeholder:text-ink-faint"
        />
        <PirateButton
          variant="secondary"
          onClick={() => {
            onChange('');
            onCommit();
          }}
          icon={<SkipForward className="size-4" />}
          title={ui.nickname.skip}
        >
          <span className="hidden sm:inline">{ui.nickname.skip}</span>
          <span className="sr-only sm:hidden">{ui.nickname.skip}</span>
        </PirateButton>
      </div>
      <p className="mt-1.5 text-[0.72rem] text-ink-faint">{ui.nickname.hint}</p>
    </div>
  );
}

function ResumeOffer({
  onResume,
  onRestart,
}: {
  onResume: () => void;
  onRestart: () => void;
}): React.JSX.Element {
  return (
    <div className="rounded-md border-2 border-dashed border-gold/70 bg-parchment-100/70 p-3 text-center">
      <p className="text-[0.92rem] font-extrabold">{ui.resume.title}</p>
      <p className="mt-1 text-[0.82rem] text-ink-soft">{ui.resume.body}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <PirateButton fullWidth onClick={onResume} icon={<Compass className="size-4" />}>
          {ui.resume.continue}
        </PirateButton>
        <PirateButton
          fullWidth
          variant="secondary"
          onClick={onRestart}
          icon={<RotateCcw className="size-4" />}
        >
          {ui.resume.restart}
        </PirateButton>
      </div>
    </div>
  );
}

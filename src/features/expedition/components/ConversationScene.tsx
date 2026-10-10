'use client';

import { useEffect, useRef } from 'react';
import { RotateCcw, TriangleAlert } from 'lucide-react';

import { ui } from '@/content/ui';
import { site } from '@/config/site';
import type { ExpeditionState } from '@/features/expedition/state/expeditionReducer';
import { isComposerLocked } from '@/features/expedition/state/expeditionReducer';
import { useExpedition } from '@/features/expedition/state/ExpeditionProvider';
import { ExpeditionBrand } from '@/components/shared/NauticalBackground';
import { PirateButton } from '@/components/shared/PirateButton';
import { CaptainAvatar, ChatMessageList } from '@/components/chat/ChatMessageList';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { JourneyProgress } from '@/components/chat/JourneyProgress';

function lockNoticeFor(state: ExpeditionState): string | undefined {
  if (state.phase === 'awaiting') return ui.chat.thinking;
  if (state.phase === 'boarding') return ui.boarding.title;
  if (state.phase === 'revealing') return ui.reveal.suspense[1] ?? ui.chat.thinking;
  if (state.phase === 'error') return ui.error.title;
  return undefined;
}

/**
 * The main adventure dialogue: header + transcript + composer.
 *
 * Owns no engine logic — it reads `state` from the provider and calls the
 * `sendMessage` / `retry` / `restart` intents. Mobile keyboard safety comes
 * from `100dvh` + a non-scrolling column where only the transcript scrolls.
 */
export function ConversationScene(): React.JSX.Element {
  const { state, sendMessage, retry, restart, engineMode } = useExpedition();
  const locked = isComposerLocked(state);
  const awaiting = state.phase === 'awaiting' || state.phase === 'boarding';
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    headerRef.current?.querySelector('h1')?.focus?.();
  }, []);

  return (
    <div
      className="relative isolate flex min-h-[100dvh] w-full flex-col overflow-hidden bg-parchment-300"
      data-scene="conversation"
    >
      <div
        aria-hidden="true"
        className="surface-parchment pointer-events-none absolute inset-0 -z-10"
      />
      <header
        ref={headerRef}
        className="flex items-center gap-3 border-b-2 border-parchment-700/40 bg-parchment-100/85 px-3 pt-[max(0.6rem,env(safe-area-inset-top))] pb-2 backdrop-blur-[2px]"
      >
        <CaptainAvatar size={44} speaking={awaiting} />
        <div className="min-w-0 flex-1">
          <h1
            tabIndex={-1}
            className="truncate text-[1.02rem] font-extrabold outline-none"
          >
            {ui.chat.captainName}
            {state.nickname ? (
              <>
                {' · '}
                <span dir="auto" className="font-bold text-ink-soft">
                  {state.nickname}
                </span>
              </>
            ) : null}
          </h1>
          <p className="truncate text-[0.75rem] font-semibold text-ink-faint">
            {ui.chat.captainRole}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <JourneyProgress progress={state.progress} />
          <ExpeditionBrand compact />
        </div>
      </header>

      {engineMode === 'mock' ? (
        <p className="border-b border-dashed border-gold/60 bg-parchment-100/70 px-3 py-1.5 text-center text-[0.72rem] font-semibold text-ink-soft">
          {ui.chat.engineNoteMock}
        </p>
      ) : null}

      <ChatMessageList messages={state.messages} awaiting={awaiting} nickname={null} />

      {state.phase === 'error' && state.error ? (
        <div
          role="alert"
          className="mx-3 mb-2 flex items-center gap-3 rounded-md border-2 border-treasure/60 bg-parchment-50/90 px-3 py-2.5"
        >
          <TriangleAlert className="size-5 shrink-0 text-treasure" aria-hidden="true" />
          <p className="min-w-0 flex-1 text-[0.85rem] font-bold">{state.error.message}</p>
          <div className="flex shrink-0 gap-2">
            {state.error.recoverable ? (
              <PirateButton variant="secondary" onClick={retry}>
                {ui.error.retry}
              </PirateButton>
            ) : null}
            <PirateButton variant="ghost" onClick={restart} icon={<RotateCcw className="size-4" />}>
              {ui.error.giveUp}
            </PirateButton>
          </div>
        </div>
      ) : null}

      <ChatComposer
        disabled={locked}
        disabledReason={locked ? lockNoticeFor(state) : undefined}
        onSend={sendMessage}
      />

      <span className="sr-only">
        {site.organization} {site.campus}
      </span>
    </div>
  );
}

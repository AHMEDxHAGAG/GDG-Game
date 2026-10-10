'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

import { ui } from '@/content/ui';
import type { ConversationMessage } from '@/features/conversation/types';
import { CompassRose } from '@/components/shared/nautical-art';

const LAST_MESSAGE_ANCHOR_ID = 'chat-last-message';

/* ------------------------------------------------------------------ */
/* Captain avatar                                                       */
/* ------------------------------------------------------------------ */

export interface CaptainAvatarProps {
  /** Adds a subtle listening motion while the captain is composing a reply. */
  speaking?: boolean;
  size?: number;
}

/**
 * The expedition captain.
 *
 * A compass medallion rather than one of the five track pirates — the captain
 * must not be mistaken for a reveal result.
 */
export function CaptainAvatar({ speaking = false, size = 44 }: CaptainAvatarProps): React.JSX.Element {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-full border-2 border-gold bg-parchment-50 shadow-[0_2px_0_rgba(154,112,67,0.45)]"
      style={{ width: size, height: size }}
    >
      <CompassRose
        animated={speaking}
        className={`size-[76%] text-ink-soft ${speaking ? 'animate-sway' : ''}`}
      />
      <span className="sr-only">{ui.chat.captainName}</span>
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Messages                                                             */
/* ------------------------------------------------------------------ */

export function ChatMessage({
  message,
  isLatest,
}: {
  message: ConversationMessage;
  isLatest: boolean;
}): React.JSX.Element {
  const isCaptain = message.role === 'captain';

  return (
    <li
      id={isLatest ? LAST_MESSAGE_ANCHOR_ID : undefined}
      className={`animate-bubble-in flex w-full gap-2 ${isCaptain ? 'justify-start' : 'justify-end'}`}
    >
      {isCaptain ? <CaptainAvatar size={32} speaking={false} /> : null}

      <div
        dir="auto"
        className={`max-w-[min(30ch,82%)] whitespace-pre-wrap rounded-lg border-2 px-3 py-2 text-[0.95rem] leading-relaxed font-semibold shadow-[0_2px_0_rgba(85,69,53,0.18)] sm:max-w-[min(46ch,80%)] ${
          isCaptain
            ? 'rounded-ss-sm border-parchment-700/50 bg-parchment-50/92 text-ink'
            : 'rounded-se-sm border-ink/35 bg-ink text-parchment-100'
        }`}
      >
        <span className="sr-only">{isCaptain ? `${ui.chat.captainName}:` : `${ui.chat.you}:`}</span>
        {message.text}
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Typing indicator                                                     */
/* ------------------------------------------------------------------ */

export function TypingIndicator(): React.JSX.Element {
  return (
    <li className="animate-bubble-in flex w-full justify-start gap-2">
      <CaptainAvatar size={32} speaking />
      <span
        className="flex items-center gap-1.5 rounded-lg rounded-ss-sm border-2 border-parchment-700/50 bg-parchment-50/92 px-3.5 py-3"
        aria-hidden="true"
      >
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="animate-typing-dot size-2 rounded-full bg-ink-soft"
            style={{ animationDelay: `${index * 160}ms` }}
          />
        ))}
      </span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Message list                                                         */
/* ------------------------------------------------------------------ */

export interface ChatMessageListProps {
  messages: readonly ConversationMessage[];
  awaiting: boolean;
  nickname: string | null;
}

export function ChatMessageList({
  messages,
  awaiting,
  nickname,
}: ChatMessageListProps): React.JSX.Element {
  const scrollRef = useRef<HTMLOListElement>(null);
  const stickToBottom = useRef(true);
  const lastCount = useRef(0);
  const liveRegion = useRef<HTMLParagraphElement>(null);

  const onScroll = () => {
    const node = scrollRef.current;
    if (!node) return;
    const distance = node.scrollHeight - node.scrollTop - node.clientHeight;
    stickToBottom.current = distance < 140;
  };

  // Scroll after layout so the new bubble's height is already applied.
  useLayoutEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    const grew = messages.length > lastCount.current;
    lastCount.current = messages.length;
    if (grew && stickToBottom.current) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages]);

  const lastCaptain = [...messages].reverse().find((m) => m.role === 'captain');

  // Only the newest captain line is announced, so a screen reader is not made
  // to re-read the whole conversation on every turn.
  useEffect(() => {
    if (lastCaptain && liveRegion.current) {
      liveRegion.current.textContent = lastCaptain.text;
    }
  }, [lastCaptain]);

  return (
    <div className="relative min-h-0 flex-1">
      <ol
        ref={scrollRef}
        onScroll={onScroll}
        role="log"
        aria-label={ui.chat.transcriptLabel}
        aria-live="off"
        className="no-scrollbar flex h-full flex-col gap-3 overflow-y-auto overscroll-contain px-3 py-4"
      >
        {nickname ? (
          <li className="flex justify-center pt-1 pb-2">
            <span className="rounded-full border border-parchment-700/45 bg-parchment-100/70 px-3 py-1 text-[0.72rem] font-bold text-ink-soft">
              {ui.chat.you} · <span dir="auto">{nickname}</span>
            </span>
          </li>
        ) : null}

        {messages.map((message, index) => (
          <ChatMessage
            key={message.id}
            message={message}
            isLatest={index === messages.length - 1 && !awaiting}
          />
        ))}

        {awaiting ? <TypingIndicator /> : null}
      </ol>

      <p ref={liveRegion} className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
    </div>
  );
}

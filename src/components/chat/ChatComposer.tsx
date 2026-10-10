'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';

import { ui } from '@/content/ui';
import { MAX_MESSAGE_LENGTH } from '@/config/site';

export interface ChatComposerProps {
  disabled: boolean;
  disabledReason?: string;
  onSend: (text: string) => void;
}

/**
 * Free-text composer.
 *
 * There are deliberately no suggestion chips and no preset answers: the
 * product is a conversation, not a questionnaire. Multi-line input is
 * supported with Shift+Enter on a physical keyboard.
 */
export function ChatComposer({ disabled, disabledReason, onSend }: ChatComposerProps): React.JSX.Element {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const describedBy = useId();

  // Grow with the content, up to a cap, so the transcript stays visible.
  useEffect(() => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = 'auto';
    node.style.height = `${Math.min(node.scrollHeight, 140)}px`;
  }, [value]);

  useEffect(() => {
    if (!disabled) textareaRef.current?.focus({ preventScroll: true });
  }, [disabled]);

  const trimmed = value.trim();
  const canSend = trimmed.length > 0 && !disabled;
  const nearLimit = value.length > MAX_MESSAGE_LENGTH * 0.85;

  const submit = () => {
    if (!canSend) return;
    onSend(value);
    setValue('');
  };

  return (
    <div className="border-t-2 border-parchment-700/40 bg-parchment-100/85 px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-[2px]">
      {disabled && disabledReason ? (
        <p className="pb-1 text-center text-[0.75rem] font-bold text-ink-soft">{disabledReason}</p>
      ) : null}

      <div className="flex items-end gap-2">
        <div className="relative min-w-0 flex-1">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(event) => setValue(event.target.value.slice(0, MAX_MESSAGE_LENGTH))}
            onKeyDown={(event) => {
              // Enter sends on desktop; Shift+Enter inserts a newline.
              if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit();
              }
            }}
            rows={1}
            disabled={disabled}
            placeholder={ui.chat.placeholder}
            aria-label={ui.chat.placeholder}
            aria-describedby={describedBy}
            aria-invalid={nearLimit ? undefined : undefined}
            enterKeyHint="send"
            dir="auto"
            maxLength={MAX_MESSAGE_LENGTH}
            className="max-h-[140px] min-h-11 w-full resize-none rounded-md border-2 border-ink/45 bg-parchment-50/90 px-3 py-2.5 text-[1rem] leading-relaxed font-semibold shadow-[inset_0_2px_4px_rgba(85,69,53,0.12)] placeholder:font-normal placeholder:text-ink-faint disabled:opacity-60"
          />
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={!canSend}
          aria-label={ui.chat.send}
          className="grid size-11 shrink-0 place-items-center rounded-md border-2 border-ink/85 bg-ink text-parchment-100 shadow-[0_3px_0_rgba(36,32,26,0.45)] transition-transform duration-150 active:translate-y-[2px] active:shadow-none disabled:pointer-events-none disabled:border-ink/25 disabled:bg-ink/25 disabled:shadow-none"
        >
          <SendHorizontal className="size-5 rtl:-scale-x-100" aria-hidden="true" />
        </button>
      </div>

      <p id={describedBy} className="mt-1 flex justify-between px-1 text-[0.7rem] text-ink-faint">
        <span>{ui.chat.caption}</span>
        <span dir="ltr" className="hidden sm:inline">
          {ui.chat.sendHint}
        </span>
        <span dir="ltr" className={nearLimit ? 'font-bold text-treasure' : undefined}>
          {value.length}/{MAX_MESSAGE_LENGTH}
        </span>
      </p>
    </div>
  );
}

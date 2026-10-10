'use client';

import type { EngineProgress } from '@/features/conversation/types';

export interface JourneyProgressProps {
  progress: EngineProgress | null;
}

/**
 * Journey meter.
 *
 * Renders a dotted sailing route with one mark per expected prompt. When the
 * engine does not know how many turns it will take — which is the case for a
 * future adaptive AI conversation — it degrades to an indeterminate state
 * instead of showing a counter that could contradict the conversation.
 */
export function JourneyProgress({ progress }: JourneyProgressProps): React.JSX.Element | null {
  const expected = progress?.expected;
  const asked = progress?.asked ?? 0;

  if (expected === undefined) {
    return (
      <div
        className="flex items-center gap-2"
        role="status"
        aria-label={progress?.label ?? 'الرحلة جارية'}
      >
        <span className="flex items-center gap-1" aria-hidden="true">
          {[0, 1, 2].map((index) => (
            <span
              key={index}
              className="animate-typing-dot size-1.5 rounded-full bg-parchment-200/80"
              style={{ animationDelay: `${index * 180}ms` }}
            />
          ))}
        </span>
        <span className="text-[0.72rem] font-bold text-parchment-200/80">الرحلة جارية</span>
      </div>
    );
  }

  const total = Math.max(expected, asked);
  const marks = Array.from({ length: total }, (_, index) => index < asked);

  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={Math.min(asked, total)}
      aria-label={progress?.label ?? `الموقف ${asked} من ${total}`}
    >
      <span className="flex items-center gap-1" aria-hidden="true">
        {marks.map((done, index) => (
          <span
            key={index}
            className={`size-1.5 rounded-full transition-colors duration-500 ${
              done ? 'bg-gold-bright' : 'bg-parchment-200/35'
            }`}
          />
        ))}
      </span>
      <span className="text-[0.72rem] font-bold text-parchment-200/85" dir="auto">
        {progress?.label ?? `${asked}/${total}`}
      </span>
    </div>
  );
}

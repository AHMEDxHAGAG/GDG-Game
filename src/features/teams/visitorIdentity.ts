import { storageKeys } from '@/config/site';

export interface VisitorIdentity {
  readonly visitorId: string;
  readonly visitorToken: string;
}

export const serverIdentity: VisitorIdentity = { visitorId: '', visitorToken: '' };
let cached: VisitorIdentity | null = null;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function randomUUID(): string {
  // getRandomValues is also available on HTTP venue LANs. Never use Math.random
  // for a credential, even when randomUUID requires an unavailable secure context.
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Stable snapshot, including when storage access, reads, or writes throw. */
export function readVisitorIdentity(): VisitorIdentity {
  try {
    const stored = window.localStorage.getItem(storageKeys.visitorIdentity);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<VisitorIdentity> | null;
      if (
        typeof parsed?.visitorId === 'string' && UUID.test(parsed.visitorId) &&
        typeof parsed.visitorToken === 'string' && UUID.test(parsed.visitorToken) &&
        parsed.visitorId !== parsed.visitorToken
      ) {
        if (cached?.visitorId !== parsed.visitorId || cached.visitorToken !== parsed.visitorToken) {
          cached = { visitorId: parsed.visitorId, visitorToken: parsed.visitorToken };
        }
        return cached;
      }
    }
  } catch {
    // A malformed value or disabled storage is no reason to break the quiz.
  }
  cached ??= { visitorId: randomUUID(), visitorToken: randomUUID() };
  try {
    window.localStorage.setItem(storageKeys.visitorIdentity, JSON.stringify(cached));
  } catch {
    // Device identity remains stable in memory until the page is closed.
  }
  return cached;
}

/**
 * Collision-resistant ids that degrade gracefully.
 *
 * `crypto.randomUUID` needs a secure context; event venues are not guaranteed
 * to serve over HTTPS on a local network, so a `Math.random` fallback keeps the
 * prototype usable without pretending to be a security primitive.
 */
export function createId(prefix = 'id'): string {
  const cryptoRef = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;

  if (cryptoRef && typeof cryptoRef.randomUUID === 'function') {
    return `${prefix}_${cryptoRef.randomUUID()}`;
  }

  if (cryptoRef && typeof cryptoRef.getRandomValues === 'function') {
    const bytes = cryptoRef.getRandomValues(new Uint8Array(8));
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${prefix}_${hex}`;
  }

  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createSessionId(): string {
  return createId('sess');
}

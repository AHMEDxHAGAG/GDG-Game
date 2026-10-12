import { describe, expect, it, vi } from 'vitest';
import { storageKeys } from '@/config/site';
import { readVisitorIdentity } from '@/features/teams/visitorIdentity';

describe('device identity snapshots', () => {
  it('persists a public ID and a different secret token in one value', () => {
    const identity = readVisitorIdentity();
    expect(identity.visitorId).not.toBe(identity.visitorToken);
    expect(JSON.parse(localStorage.getItem(storageKeys.visitorIdentity)!)).toEqual(identity);
    expect(readVisitorIdentity()).toBe(identity);
  });

  it('does not adopt an exposed legacy bearer ID', () => {
    localStorage.setItem(storageKeys.visitorId, '11111111-1111-4111-8111-111111111111');
    expect(readVisitorIdentity().visitorId).not.toBe(localStorage.getItem(storageKeys.visitorId));
  });

  it.each(['getItem', 'setItem'] as const)('keeps a stable snapshot when %s throws', (method) => {
    vi.spyOn(Storage.prototype, method).mockImplementation(() => { throw new Error('blocked'); });
    const identity = readVisitorIdentity();
    for (let i = 0; i < 20; i++) expect(readVisitorIdentity()).toBe(identity);
  });

  it('keeps a stable snapshot when accessing localStorage throws', () => {
    const getter = vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => { throw new Error('blocked'); });
    try {
      expect(readVisitorIdentity()).toBe(readVisitorIdentity());
    } finally {
      getter.mockRestore();
    }
  });

  it('adopts a valid new identity from another tab without unstable object snapshots', () => {
    const replacement = {
      visitorId: '22222222-2222-4222-8222-222222222222',
      visitorToken: '33333333-3333-4333-8333-333333333333',
    };
    localStorage.setItem(storageKeys.visitorIdentity, JSON.stringify(replacement));
    expect(readVisitorIdentity()).toEqual(replacement);
    expect(readVisitorIdentity()).toBe(readVisitorIdentity());
  });
});

import { describe, expect, it } from 'vitest';

import { formatJoinCode, JOIN_CODE_LENGTH, normalizeJoinCode } from '@/lib/team-codes';

describe('normalizeJoinCode', () => {
  it('accepts a well-formed code', () => {
    expect(normalizeJoinCode('A3F9B2')).toBe('A3F9B2');
    expect(normalizeJoinCode('000000')).toBe('000000');
    expect(normalizeJoinCode('FFFFFF')).toBe('FFFFFF');
  });

  it('upper-cases, so a lower-case paste still works', () => {
    expect(normalizeJoinCode('a3f9b2')).toBe('A3F9B2');
  });

  /*
   * The code is read aloud across a room and typed on a phone. Every one of
   * these is something somebody actually types while reading out a projected
   * screen, so all of them have to land on the same code.
   */
  it('strips the separators people insert while reading', () => {
    expect(normalizeJoinCode('a3 f9 b2')).toBe('A3F9B2');
    expect(normalizeJoinCode('A3-F9-B2')).toBe('A3F9B2');
    expect(normalizeJoinCode(' A3 F9 B2 ')).toBe('A3F9B2');
  });

  it('rejects anything that cannot be a code', () => {
    expect(normalizeJoinCode('')).toBeNull();
    expect(normalizeJoinCode('A3F9B')).toBeNull(); // one short
    expect(normalizeJoinCode('A3F9B22')).toBeNull(); // one long
    expect(normalizeJoinCode('G3H9B2')).toBeNull(); // outside the alphabet
  });

  /*
   * `gen_random_bytes` yields hex, so `G` through `Z` can never be issued.
   * Accepting them would only ever produce a "no such room" for the visitor,
   * which reads like the code was wrong rather than mistyped.
   */
  it('rejects letters outside the generated alphabet', () => {
    for (const letter of ['G', 'I', 'O', 'Q', 'S', 'Z']) {
      expect(normalizeJoinCode(`A3F9B${letter}`)).toBeNull();
    }
  });

  it('does not mistake the empty string for a valid code', () => {
    // The guard this protects: `normalizeJoinCode('------')` must not collapse
    // to '' and pass a truthiness check somewhere downstream.
    expect(normalizeJoinCode('------')).toBeNull();
  });

  it('pins the length the generator produces', () => {
    const code = normalizeJoinCode('A3F9B2');
    expect(code).not.toBeNull();
    expect(code).toHaveLength(JOIN_CODE_LENGTH);
  });
});

describe('formatJoinCode', () => {
  it('groups into pairs for legibility', () => {
    expect(formatJoinCode('A3F9B2')).toBe('A3 F9 B2');
  });

  it('leaves an unexpected length alone rather than dropping characters', () => {
    expect(formatJoinCode('A3F9')).toBe('A3 F9');
    expect(formatJoinCode('')).toBe('');
  });
});
import { describe, expect, it } from 'vitest';

import { toArabicDigits, toRomanNumerals } from '@/content/tracks';

describe('toArabicDigits', () => {
  it('maps each digit to its Arabic-Indic form', () => {
    expect(toArabicDigits(0)).toBe('٠');
    expect(toArabicDigits(9)).toBe('٩');
    expect(toArabicDigits(45)).toBe('٤٥');
    expect(toArabicDigits(2026)).toBe('٢٠٢٦');
  });

  it('converts the digits of a negative number but keeps its sign', () => {
    expect(toArabicDigits(-1)).toBe('-١');
    expect(toArabicDigits(-45)).toBe('-٤٥');
  });
});

describe('toRomanNumerals', () => {
  /*
   * The poster's rank line is set in Roman numerals so the card reads as a
   * keepsake. Scores here are 0–40, so only the positional forms occur — the
   * subtractive forms (`IV`, `IX`, `XL`) are a different convention from the
   * one the reference card uses, and mixing them in would be wrong rather than
   * merely inconsistent.
   */
  it('covers the whole score range', () => {
    const expected = [
      '', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
      'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
      'XXI', 'XXII', 'XXIII', 'XXIV', 'XXV', 'XXVI', 'XXVII', 'XXVIII', 'XXIX',
      'XXX', 'XXXI', 'XXXII', 'XXXIII', 'XXXIV', 'XXXV', 'XXXVI', 'XXXVII',
      'XXXVIII', 'XXXIX', 'XL',
    ];
    expected.forEach((roman, score) => {
      expect(toRomanNumerals(score), `score ${score}`).toBe(roman);
    });
  });

  /*
   * The score is a sum of ten question weights, so it can never leave the table.
   * Anything outside it is a caller bug, and printing the raw number is more
   * useful in a card export than printing a wrong numeral — the card is a PNG
   * someone keeps, so it must never read `NaN`.
   */
  it('falls back to the plain number outside the table', () => {
    expect(toRomanNumerals(-1)).toBe('-1');
    expect(toRomanNumerals(41)).toBe('41');
    expect(toRomanNumerals(1.5)).toBe('1.5');
    expect(toRomanNumerals(Number.NaN)).toBe('NaN');
  });
});
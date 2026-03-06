import { describe, it, expect } from 'vitest';
import { formatDateForInput, parseDateFromInput, ensureDate, shiftDatePreservingTime } from './dateUtils';
import { isValid, parseISO } from 'date-fns';

describe('dateUtils', () => {
  describe('formatDateForInput', () => {
    it('should format Date object to yyyy-MM-dd', () => {
      const date = new Date(2025, 11, 31); // Dec 31
      expect(formatDateForInput(date)).toBe('2025-12-31');
    });

    it('should handle ISO string', () => {
      expect(formatDateForInput('2025-12-31T10:00:00Z')).toBe('2025-12-31');
    });

    it('should return empty string for invalid date', () => {
      expect(formatDateForInput(undefined)).toBe('');
      expect(formatDateForInput('invalid')).toBe('');
    });
  });

  describe('parseDateFromInput', () => {
    it('should parse yyyy-MM-dd to Date object with default 9 AM', () => {
      const date = parseDateFromInput('2025-12-31');
      expect(date?.getFullYear()).toBe(2025);
      expect(date?.getMonth()).toBe(11);
      expect(date?.getDate()).toBe(31);
      expect(date?.getHours()).toBe(9);
    });

    it('should preserve time from reference date', () => {
      const reference = new Date(2024, 0, 1, 14, 30, 0);
      const date = parseDateFromInput('2025-12-31', reference);
      expect(date?.getHours()).toBe(14);
      expect(date?.getMinutes()).toBe(30);
    });

    it('should return undefined for invalid input', () => {
      expect(parseDateFromInput('')).toBeUndefined();
      expect(parseDateFromInput('invalid')).toBeUndefined();
    });
  });

  describe('ensureDate', () => {
    it('should return Date object from Date object', () => {
      const date = new Date();
      expect(ensureDate(date)).toBe(date);
    });

    it('should return Date object from valid ISO string', () => {
      const iso = '2025-12-31T10:00:00Z';
      const date = ensureDate(iso);
      expect(date instanceof Date).toBe(true);
      expect(isValid(date)).toBe(true);
    });

    it('should return undefined for invalid input', () => {
      expect(ensureDate(undefined)).toBeUndefined();
      expect(ensureDate('invalid')).toBeUndefined();
    });
  });

  describe('shiftDatePreservingTime', () => {
    it('should change date but keep time', () => {
      const original = new Date(2025, 0, 1, 10, 0, 0);
      const target = new Date(2025, 1, 14);
      const result = shiftDatePreservingTime(original, target);
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(1);
      expect(result.getDate()).toBe(14);
      expect(result.getHours()).toBe(10);
    });
  });
});

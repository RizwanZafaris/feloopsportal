import { describe, it, expect } from 'vitest';
import {
  cn,
  formatMinor,
  formatDate,
  formatCurrency,
  formatPercent,
  truncate,
  generateConfirmId,
  getDiff,
  camelToTitle,
} from '@/lib/utils';

describe('Utils', () => {
  describe('cn', () => {
    it('merges class names correctly', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
      expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
    });

    it('handles tailwind conflicts', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });
  });

  describe('formatMinor', () => {
    it('formats minor units correctly', () => {
      expect(formatMinor(10050, 'PKR')).toBe('Rs. 100.50');
      expect(formatMinor(500, 'USD')).toBe('$ 5.00');
    });

    it('handles negative values', () => {
      expect(formatMinor(-5000, 'PKR')).toBe('Rs. 50.00');
    });

    it('excludes symbol when requested', () => {
      expect(formatMinor(10050, 'PKR', false)).toBe('100.50');
    });
  });

  describe('formatDate', () => {
    it('formats date strings', () => {
      expect(formatDate('2024-06-15T10:30:00Z')).toBe('Jun 15, 2024');
    });

    it('returns em dash for null', () => {
      expect(formatDate(null)).toBe('—');
    });

    it('returns em dash for empty string', () => {
      expect(formatDate('')).toBe('—');
    });

    it('includes time when requested', () => {
      const result = formatDate('2024-06-15T10:30:00Z', { withTime: true });
      expect(result).toContain('at');
    });

    it('returns relative time', () => {
      const now = new Date();
      const twoMinutesAgo = new Date(now.getTime() - 2 * 60 * 1000);
      expect(formatDate(twoMinutesAgo.toISOString(), { relative: true })).toBe('2m ago');
    });

    it('returns just now for recent timestamps', () => {
      expect(formatDate(new Date().toISOString(), { relative: true })).toBe('just now');
    });
  });

  describe('formatCurrency', () => {
    it('formats with default PKR', () => {
      expect(formatCurrency(1000)).toBe('Rs. 1,000.00');
    });

    it('formats with USD', () => {
      expect(formatCurrency(99.99, 'USD')).toBe('$ 99.99');
    });

    it('formats with 0 fraction digits', () => {
      expect(formatCurrency(1000, 'PKR', 0)).toBe('Rs. 1,000');
    });
  });

  describe('formatPercent', () => {
    it('formats percentage', () => {
      expect(formatPercent(12.5)).toBe('12.5%');
      expect(formatPercent(0)).toBe('0.0%');
    });

    it('formats with custom precision', () => {
      expect(formatPercent(12.555, 2)).toBe('12.56%');
    });
  });

  describe('truncate', () => {
    it('truncates long strings', () => {
      expect(truncate('hello world', 8)).toBe('hello...');
    });

    it('returns short strings unchanged', () => {
      expect(truncate('hi', 10)).toBe('hi');
    });
  });

  describe('generateConfirmId', () => {
    it('generates uppercase alphanumeric string', () => {
      const id = generateConfirmId();
      expect(id).toMatch(/^[A-Z0-9]+$/);
      expect(id.length).toBeGreaterThan(0);
    });
  });

  describe('getDiff', () => {
    it('detects changed fields', () => {
      const before = { name: 'John', age: 30 };
      const after = { name: 'Jane', age: 30 };
      const diff = getDiff(before, after);
      expect(diff).toHaveProperty('name');
      expect(diff.name.old).toBe('John');
      expect(diff.name.new).toBe('Jane');
      expect(diff).not.toHaveProperty('age');
    });

    it('detects added fields', () => {
      const before = { name: 'John' };
      const after = { name: 'John', age: 30 };
      const diff = getDiff(before, after);
      expect(diff).toHaveProperty('age');
      expect(diff.age.old).toBeUndefined();
    });
  });

  describe('camelToTitle', () => {
    it('converts camelCase to Title Case', () => {
      expect(camelToTitle('savingsRate')).toBe('Savings Rate');
      expect(camelToTitle('expenseControl')).toBe('Expense Control');
      expect(camelToTitle('ARPU')).toBe('ARPU');
    });
  });
});

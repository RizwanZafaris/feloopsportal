import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with proper precedence
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency in minor units (cents/paisa)
 * e.g. 10050 → "100.50" or "Rs. 100.50"
 */
export function formatMinor(minor: number, currency = 'PKR', includeSymbol = true): string {
  const major = minor / 100;
  const formatter = new Intl.NumberFormat('en', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const formatted = formatter.format(Math.abs(major));
  if (!includeSymbol) return formatted;
  const symbols: Record<string, string> = { PKR: 'Rs.', USD: '$', AED: 'AED', SAR: 'SAR', GBP: '£', EUR: '€' };
  const symbol = symbols[currency] || currency;
  return `${symbol} ${formatted}`;
}

/**
 * Format a date string to human-readable format
 */
export function formatDate(date: string | Date | null, opts?: { withTime?: boolean; relative?: boolean }): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return 'Invalid date';

  if (opts?.relative) {
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHour < 24) return `${diffHour}h ago`;
    if (diffDay < 7) return `${diffDay}d ago`;
  }

  const datePart = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  if (!opts?.withTime) return datePart;
  const timePart = d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} at ${timePart}`;
}

/**
 * Format a number as currency
 */
export function formatCurrency(value: number, currency = 'PKR', fractionDigits = 2): string {
  const symbols: Record<string, string> = { PKR: 'Rs.', USD: '$', AED: 'AED', SAR: 'SAR', GBP: '£', EUR: '€' };
  const symbol = symbols[currency] || currency;
  const formatted = new Intl.NumberFormat('en', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(Math.abs(value));
  return `${symbol} ${formatted}`;
}

/**
 * Format percentage value
 */
export function formatPercent(value: number, fractionDigits = 1): string {
  return `${value.toFixed(fractionDigits)}%`;
}

/**
 * Truncate a string with ellipsis
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Generate a unique ID for confirmation dialogs
 */
export function generateConfirmId(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

/**
 * Deep compare two objects for diff display
 */
export function getDiff<T extends Record<string, unknown>>(before: T, after: T): Record<string, { old: unknown; new: unknown }> {
  const diff: Record<string, { old: unknown; new: unknown }> = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  for (const key of allKeys) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = { old: before[key], new: after[key] };
    }
  }
  return diff;
}

/**
 * Convert camelCase to Title Case
 */
export function camelToTitle(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
}

/**
 * Debounce utility
 */
export function debounce<T extends (...args: unknown[]) => unknown>(fn: T, delay: number): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

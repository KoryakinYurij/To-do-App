import { format, parse, isValid } from 'date-fns';

/**
 * Formats a Date object to a 'yyyy-MM-dd' string for HTML date inputs.
 */
export function formatDateForInput(date: Date | string | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!isValid(d)) return '';
  return format(d, 'yyyy-MM-dd');
}

/**
 * Parses a 'yyyy-MM-dd' string from an HTML date input into a Date object.
 * If a reference date is provided, it preserves the time from that date.
 */
export function parseDateFromInput(dateStr: string, referenceDate?: Date | string): Date | undefined {
  if (!dateStr) return undefined;

  const newDate = parse(dateStr, 'yyyy-MM-dd', new Date());
  if (!isValid(newDate)) return undefined;

  if (referenceDate) {
    const ref = typeof referenceDate === 'string' ? new Date(referenceDate) : referenceDate;
    if (isValid(ref)) {
      newDate.setHours(
        ref.getHours(),
        ref.getMinutes(),
        ref.getSeconds(),
        ref.getMilliseconds()
      );
    }
  } else {
    // Default to 9 AM if no reference date is provided
    newDate.setHours(9, 0, 0, 0);
  }

  return newDate;
}

/**
 * Ensures a value is a Date object, or undefined.
 * Useful when dealing with Dexie which might return ISO strings if not careful,
 * although Dexie usually handles Date objects fine if specified in schema.
 */
export function ensureDate(date: Date | string | undefined): Date | undefined {
  if (!date) return undefined;
  const d = typeof date === 'string' ? new Date(date) : date;
  return isValid(d) ? d : undefined;
}

/**
 * Creates a new Date by shifting the date part but keeping the time.
 */
export function shiftDatePreservingTime(originalDate: Date | string, targetDate: Date | string): Date {
  const original = typeof originalDate === 'string' ? new Date(originalDate) : originalDate;
  const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;

  const result = new Date(target);
  result.setHours(
    original.getHours(),
    original.getMinutes(),
    original.getSeconds(),
    original.getMilliseconds()
  );

  return result;
}

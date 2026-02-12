/**
 * FR-24: Timezone utilities for focus date calculations
 * Converts dates between UTC and user timezone
 */

/**
 * Get the UTC Date that is midnight (00:00:00.000) on the given calendar day in the given timezone.
 * Used for analytics period boundaries so "last N days" matches the user's calendar.
 */
export function getStartOfDayInTimezone(dateStr: string, timeZone: string): Date {
  const noon = new Date(dateStr + 'T12:00:00.000Z');
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: 'numeric',
    hour12: false,
    minute: 'numeric',
    second: 'numeric',
  });
  const parts = formatter.formatToParts(noon);
  const get = (n: string) => parts.find((p) => p.type === n)?.value ?? '0';
  const hour = parseInt(get('hour'), 10);
  const minute = parseInt(get('minute'), 10);
  const second = parseInt(get('second'), 10);
  const offsetMs = (hour * 3600 + minute * 60 + second) * 1000;
  return new Date(noon.getTime() - offsetMs);
}

/**
 * Get the current date in user's timezone as a Date object (start of that day in user TZ, as UTC).
 */
export function getTodayInUserTimezone(userTimezone: string = 'UTC'): Date {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const localDateStr = formatter.format(now);
  return getStartOfDayInTimezone(localDateStr, userTimezone);
}

/**
 * Get date range for a specific day in user's timezone
 * Returns { start, end } where start is midnight and end is 23:59:59.999 on that day in TZ (as UTC Dates)
 */
export function getDayRangeInUserTimezone(date: Date, userTimezone: string = 'UTC'): { start: Date; end: Date } {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: userTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const localDateStr = formatter.format(date);
  const start = getStartOfDayInTimezone(localDateStr, userTimezone);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
  return { start, end };
}

/**
 * Get start and end of "today" in user's timezone (start = midnight, end = next day midnight).
 * Use for focus date and session queries.
 */
export function getTodayRangeInUserTimezone(userTimezone: string = "UTC"): { start: Date; end: Date } {
  const start = getTodayInUserTimezone(userTimezone);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Check if a date is "today" in the user's timezone
 */
export function isToday(date: Date, userTimezone: string = "UTC"): boolean {
  const today = getTodayInUserTimezone(userTimezone);
  const dateStr = date.toISOString().slice(0, 10);
  const todayStr = today.toISOString().slice(0, 10);
  return dateStr === todayStr;
}

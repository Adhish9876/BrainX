const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Deterministic date formatting (UTC, fixed month names) so server-rendered
 * markup and client hydration always agree. Returns the raw value if unparseable
 * and an empty string if no date is supplied.
 */
export function formatDate(value: string): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const [, year, month, day] = match;
    const monthIndex = Number(month) - 1;
    const monthLabel = MONTHS[monthIndex] ?? month;
    return `${Number(day)} ${monthLabel} ${year}`;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return `${parsed.getUTCDate()} ${MONTHS[parsed.getUTCMonth()]} ${parsed.getUTCFullYear()}`;
}

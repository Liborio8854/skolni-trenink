/** Kalendářní den v časové zóně appky (ne UTC z toISOString). */
export const APP_TIMEZONE = 'Europe/Prague'

/**
 * Vrátí YYYY-MM-DD podle místního kalendáře v Europe/Prague.
 * @param {Date} [date]
 * @param {string} [timeZone]
 */
export function localDateKey(date = new Date(), timeZone = APP_TIMEZONE) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

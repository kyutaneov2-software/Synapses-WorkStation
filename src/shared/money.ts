import { CURRENCY_SYMBOLS } from './constants'

/**
 * Format an integer number of cents as a display string.
 *
 * 12345, 'USD' → "$123.45"
 * 135000, 'PHP' → "₱1,350"
 * 0, 'USD' → "$0"
 *
 * Whole amounts show no decimals; anything with cents shows exactly two.
 */
export function formatMoney(cents: number, currency = 'USD', alwaysShowCents = false): string {
    const symbol = CURRENCY_SYMBOLS[currency] ?? currency
    const abs = Math.abs(cents)
    const hasFraction = abs % 100 !== 0

    const decimals = alwaysShowCents || hasFraction ? 2 : 0

    const formatted = (abs / 100).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: 2
    })

    return `${cents < 0 ? '-' : ''}${symbol}${formatted}`
}

/**
 * Parse user input (dollars) into integer cents.
 *
 * '99.99' → 9999
 * '100'   → 10000
 * '1,350' → 135000
 * ''      → null
 * 'abc'   → null
 */
export function parseMoney(input: string | number): number | null {
    if (typeof input === 'number') {
        if (!Number.isFinite(input)) return null
        return Math.round(input * 100)
    }
    const stripped = input.trim().replace(/[^\d.-]/g, '')
    if (!stripped) return null
    const n = parseFloat(stripped)
    if (!Number.isFinite(n)) return null
    return Math.round(n * 100)
}

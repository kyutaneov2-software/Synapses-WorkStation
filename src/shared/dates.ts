/**
 * Shared date helpers used by both main and renderer.
 *
 * Rule: any function that returns a calendar date (YYYY-MM-DD) uses
 * LOCAL time. Any function that parses a SQLite timestamp returns
 * a JS Date in the local timezone, correctly accounting for SQLite's
 * `datetime('now')` format (which is UTC without a timezone suffix).
 */

export function todayStr(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function tomorrowStr(): string {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * Parse a SQLite timestamp.
 *
 * Accepts two formats:
 *   1. SQLite `datetime('now')` → "YYYY-MM-DD HH:MM:SS" (UTC, no suffix)
 *   2. Full ISO 8601           → "YYYY-MM-DDTHH:MM:SS.sssZ" (UTC, with Z)
 *
 * `new Date("2026-10-11 14:30:00")` parses as LOCAL on V8, which is
 * wrong for format #1. Appending "Z" forces UTC interpretation.
 * Format #2 is already unambiguous, so we trust it as-is.
 */
export function parseSqliteDate(s: string): Date {
    if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(s)) {
        return new Date(s)
    }
    return new Date(s.replace(' ', 'T') + 'Z')
}

export function parseSqliteMs(s: string): number {
    return parseSqliteDate(s).getTime()
}

export function sessionSeconds(row: { started_at: string; ended_at: string | null }): number {
    const start = parseSqliteMs(row.started_at)
    const end = row.ended_at ? parseSqliteMs(row.ended_at) : Date.now()
    return Math.max(0, Math.floor((end - start) / 1000))
}

export function isOverdue(dueDate: string | null): boolean {
    if (!dueDate) return false
    return dueDate < todayStr()
}

export function isDueToday(dueDate: string | null): boolean {
    if (!dueDate) return false
    return dueDate === todayStr()
}

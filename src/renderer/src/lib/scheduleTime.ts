/**
 * Schedule-specific time helpers. Blocks are stored as "YYYY-MM-DD HH:MM"
 * in LOCAL wall-clock time, so these helpers work purely on strings and
 * integer minutes — no Date math, no timezone conversion.
 */

export const START_HOUR = 6
export const END_HOUR = 22
export const HOURS_SHOWN = END_HOUR - START_HOUR
export const ROW_HEIGHT = 56
export const SNAP_MINUTES = 15
export const DEFAULT_DURATION_MINUTES = 60

/** "2026-10-17 09:30" → "2026-10-17" */
export function blockDayKey(s: string): string {
    return s.slice(0, 10)
}

/** "2026-10-17 09:30" → 570 (minutes since midnight) */
export function blockMinutes(s: string): number {
    const h = Number(s.slice(11, 13))
    const m = Number(s.slice(14, 16))
    return h * 60 + m
}

/** (day, 570) → "2026-10-17 09:30" */
export function composeLocalDateTime(dayKey: string, minutesSinceMidnight: number): string {
    const h = Math.floor(minutesSinceMidnight / 60)
    const m = minutesSinceMidnight % 60
    return `${dayKey} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** "2026-10-17 09:30" → "9:30 AM" */
export function formatHHMM(s: string): string {
    const minutes = blockMinutes(s)
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

/** "09:00" for the time gutter. */
export function formatHour(hour: number): string {
    const ampm = hour < 12 ? 'AM' : 'PM'
    const h12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${h12} ${ampm}`
}

// ── Date arithmetic (local, calendar-date only) ─────────────

/** Returns the Monday of the week containing `d`, at local midnight. */
export function startOfWeek(d: Date): Date {
    const day = d.getDay() // 0 = Sun
    const diff = day === 0 ? -6 : 1 - day
    const r = new Date(d)
    r.setDate(d.getDate() + diff)
    r.setHours(0, 0, 0, 0)
    return r
}

/** Local "YYYY-MM-DD" for a Date. */
export function dateKey(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Array of 7 consecutive days starting at `start`. */
export function sevenDays(start: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        return d
    })
}

/** Offset by N days, keeping local midnight. */
export function offsetDays(base: Date, days: number): Date {
    const d = new Date(base)
    d.setDate(base.getDate() + days)
    d.setHours(0, 0, 0, 0)
    return d
}

/** True if both dates fall on the same local calendar day. */
export function sameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    )
}

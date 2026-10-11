/**
 * Renderer-side date helpers.
 *
 * Every function here works in LOCAL time. Do not use `toISOString()`
 * anywhere that a calendar date is involved — it returns UTC and will
 * be off by a day for anyone east or west of Greenwich.
 */
export function addDays(base: Date, days: number): string {
    const d = new Date(base)
    d.setDate(d.getDate() + days)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/**
 * A task/project is overdue when its CLIENT-FACING deadline (due_date)
 * has passed and it's not done. `planned_for` is your personal schedule
 * and must NOT be used for overdue — a task you meant to do Monday but
 * finished Wednesday is not overdue, it's late-but-done.
 */

export {
    todayStr,
    tomorrowStr,
    parseSqliteDate,
    parseSqliteMs,
    isOverdue,
    isDueToday
} from '../../../shared/dates'

import { ipcMain } from 'electron'
import db from '../db'
import { broadcast } from '../services/broadcast'
import type { ScheduleBlock, ScheduleBlockWithTask } from '../../shared/types'
import { requireString, requirePositiveId } from './validate'

/**
 * A local datetime string in "YYYY-MM-DD HH:MM" format. We do NOT use ISO
 * with T and Z here because:
 *   1. The column is compared with `date()` and `datetime()` SQLite
 *      functions that expect the space-separated form.
 *   2. These are wall-clock times in the user's timezone, not UTC.
 *      Storing them as UTC would require converting back on display, and
 *      would break at DST boundaries.
 */
function validateLocalDateTime(value: unknown, name: string): string {
    const s = requireString(value, name, 20)
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) {
        throw new Error(`Invalid ${name}: expected "YYYY-MM-DD HH:MM"`)
    }
    const [datePart, timePart] = s.split(' ')
    const [y, m, d] = datePart.split('-').map(Number)
    const [hh, mm] = timePart.split(':').map(Number)
    if (m < 1 || m > 12 || d < 1 || d > 31 || hh > 23 || mm > 59) {
        throw new Error(`Invalid ${name}: out-of-range components`)
    }
    // Construct a Date to validate the day-of-month is real (e.g. Feb 30)
    const test = new Date(y, m - 1, d, hh, mm)
    if (
        test.getFullYear() !== y ||
        test.getMonth() !== m - 1 ||
        test.getDate() !== d ||
        test.getHours() !== hh ||
        test.getMinutes() !== mm
    ) {
        throw new Error(`Invalid ${name}: not a real date/time`)
    }
    return s
}

function getBlockById(id: number): ScheduleBlock {
    const row = db.prepare('SELECT * FROM schedule_blocks WHERE id = ?').get(id) as
        ScheduleBlock | undefined
    if (!row) throw new Error(`Schedule block ${id} not found`)
    return row
}

export function registerScheduleHandlers(): void {
    /**
     * Fetch every block whose start_at falls in [fromISO, toISO] — a
     * calendar-day range in local time. Returns joined task display data.
     */
    ipcMain.handle(
        'db:get-schedule-range',
        (_, fromDate: unknown, toDate: unknown): ScheduleBlockWithTask[] => {
            const from = requireString(fromDate, 'fromDate', 10)
            const to = requireString(toDate, 'toDate', 10)
            if (!/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
                throw new Error('Invalid date range: expected YYYY-MM-DD')
            }
            return db
                .prepare(
                    `
                SELECT
                    b.id,
                    b.task_id,
                    b.start_at,
                    b.end_at,
                    b.created_at,
                    t.text AS task_text,
                    t.done AS task_done,
                    t.project_id AS task_project_id,
                    p.title AS task_project_title
                FROM schedule_blocks b
                JOIN tasks t ON t.id = b.task_id
                LEFT JOIN projects p ON p.id = t.project_id
                WHERE date(b.start_at) >= date(?)
                  AND date(b.start_at) <= date(?)
                ORDER BY b.start_at ASC
            `
                )
                .all(from, to) as ScheduleBlockWithTask[]
        }
    )

    ipcMain.handle(
        'db:create-block',
        (_, taskId: unknown, startAt: unknown, endAt: unknown): ScheduleBlock => {
            const cleanTaskId = requirePositiveId(taskId, 'taskId')
            const cleanStart = validateLocalDateTime(startAt, 'startAt')
            const cleanEnd = validateLocalDateTime(endAt, 'endAt')
            if (cleanEnd <= cleanStart) {
                throw new Error('end_at must be after start_at')
            }

            const task = db.prepare('SELECT id FROM tasks WHERE id = ?').get(cleanTaskId)
            if (!task) throw new Error(`Task ${cleanTaskId} not found`)

            const result = db
                .prepare(`INSERT INTO schedule_blocks (task_id, start_at, end_at) VALUES (?, ?, ?)`)
                .run(cleanTaskId, cleanStart, cleanEnd)

            broadcast('data:changed')
            return getBlockById(result.lastInsertRowid as number)
        }
    )

    ipcMain.handle(
        'db:update-block',
        (_, id: unknown, startAt: unknown, endAt: unknown): ScheduleBlock => {
            const cleanId = requirePositiveId(id, 'id')
            const cleanStart = validateLocalDateTime(startAt, 'startAt')
            const cleanEnd = validateLocalDateTime(endAt, 'endAt')
            if (cleanEnd <= cleanStart) {
                throw new Error('end_at must be after start_at')
            }

            db.prepare(`UPDATE schedule_blocks SET start_at = ?, end_at = ? WHERE id = ?`).run(
                cleanStart,
                cleanEnd,
                cleanId
            )

            broadcast('data:changed')
            return getBlockById(cleanId)
        }
    )

    ipcMain.handle('db:delete-block', (_, id: unknown): void => {
        const cleanId = requirePositiveId(id, 'id')
        db.prepare('DELETE FROM schedule_blocks WHERE id = ?').run(cleanId)
        broadcast('data:changed')
    })
}

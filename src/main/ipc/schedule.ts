import { ipcMain } from 'electron'
import db from '../db'
import { broadcast } from '../services/broadcast'
import type { ScheduleBlock, ScheduleBlockWithTask, ScheduleBlockInput } from '../../shared/types'
import { requireString, requirePositiveId, requireEnum } from './validate'

function validateLocalDateTime(value: unknown, name: string): string {
    const s = requireString(value, name, 20)
    if (!/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) {
        throw new Error(`Invalid ${name}: expected "YYYY-MM-DD HH:MM"`)
    }
    return s
}

function getBlockById(id: number): ScheduleBlock {
    return db.prepare('SELECT * FROM schedule_blocks WHERE id = ?').get(id) as ScheduleBlock
}

export function registerScheduleHandlers(): void {
    ipcMain.handle(
        'db:get-schedule-range',
        (_, fromDate: unknown, toDate: unknown): ScheduleBlockWithTask[] => {
            const from = requireString(fromDate, 'fromDate', 10)
            const to = requireString(toDate, 'toDate', 10)
            return db
                .prepare(
                    `
            SELECT
                b.id, b.task_id, b.title, b.event_type, b.start_at, b.end_at, b.created_at,
                t.text AS task_text, t.done AS task_done, t.project_id AS task_project_id,
                p.title AS task_project_title
            FROM schedule_blocks b
            LEFT JOIN tasks t ON t.id = b.task_id
            LEFT JOIN projects p ON p.id = t.project_id
            WHERE date(b.start_at) >= date(?) AND date(b.start_at) <= date(?)
            ORDER BY b.start_at ASC
        `
                )
                .all(from, to) as ScheduleBlockWithTask[]
        }
    )

    ipcMain.handle('db:create-block', (_, input: ScheduleBlockInput): ScheduleBlock => {
        const cleanTaskId = input.taskId ? requirePositiveId(input.taskId, 'taskId') : null
        const cleanTitle = input.title ? requireString(input.title, 'title', 200) : null
        const cleanType = requireEnum(input.eventType, 'eventType', [
            'task',
            'meeting',
            'reminder'
        ] as const)
        const cleanStart = validateLocalDateTime(input.startAt, 'startAt')
        const cleanEnd = validateLocalDateTime(input.endAt, 'endAt')

        if (cleanEnd <= cleanStart) throw new Error('end_at must be after start_at')

        const result = db
            .prepare(
                `
            INSERT INTO schedule_blocks (task_id, title, event_type, start_at, end_at)
            VALUES (?, ?, ?, ?, ?)
        `
            )
            .run(cleanTaskId, cleanTitle, cleanType, cleanStart, cleanEnd)

        broadcast('data:changed')
        return getBlockById(result.lastInsertRowid as number)
    })

    ipcMain.handle(
        'db:update-block',
        (_, id: unknown, input: ScheduleBlockInput): ScheduleBlock => {
            const cleanId = requirePositiveId(id, 'id')
            const cleanStart = validateLocalDateTime(input.startAt, 'startAt')
            const cleanEnd = validateLocalDateTime(input.endAt, 'endAt')

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

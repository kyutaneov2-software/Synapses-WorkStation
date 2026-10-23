import { ipcMain } from 'electron'
import db from '../db'
import { broadcast } from '../services/broadcast'
import type { Goal, GoalType } from '../../shared/types'
import { requireString, optionalString, requireNumber, requirePositiveId } from './validate'

interface GoalRow {
    id: number
    title: string
    description: string | null
    type: string
    target_value: number
    target_unit: string | null
    created_at: string
    archived: number
}

function getLocalDateStr(): string {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function registerGoalHandlers(): void {
    ipcMain.handle('db:get-goals', (): Goal[] => {
        // Replaced `any[]` with the specific GoalRow interface
        const goals = db.prepare('SELECT * FROM goals WHERE archived = 0').all() as GoalRow[]
        const todayStr = getLocalDateStr()

        return goals.map((g) => {
            const totalResult = db
                .prepare('SELECT SUM(value) as total FROM goal_logs WHERE goal_id = ?')
                .get(g.id) as { total: number | null }
            const current = totalResult.total || 0

            const todayResult = db
                .prepare('SELECT SUM(value) as today FROM goal_logs WHERE goal_id = ? AND date = ?')
                .get(g.id, todayStr) as { today: number | null }
            const todayVal = todayResult.today || 0

            const progress = Math.min(100, Math.round((current / g.target_value) * 100)) || 0

            return {
                ...g,
                type: g.type as GoalType,
                archived: g.archived === 1 ? 1 : 0,
                current_value: current,
                progress,
                today_value: todayVal
            }
        })
    })

    ipcMain.handle(
        'db:create-goal',
        (
            _,
            title: unknown,
            desc: unknown,
            type: unknown,
            targetVal: unknown,
            unit: unknown
        ): Goal => {
            const cleanTitle = requireString(title, 'title', 200)
            const cleanDesc = optionalString(desc, 'description', 1000)
            const cleanType = requireString(type, 'type', 50) as GoalType
            const cleanTarget = requireNumber(targetVal, 'targetValue')
            const cleanUnit = optionalString(unit, 'targetUnit', 20)

            const result = db
                .prepare(
                    `
            INSERT INTO goals (title, description, type, target_value, target_unit)
            VALUES (?, ?, ?, ?, ?)
        `
                )
                .run(cleanTitle, cleanDesc, cleanType, cleanTarget, cleanUnit)

            broadcast('data:changed')
            return db
                .prepare('SELECT * FROM goals WHERE id = ?')
                .get(result.lastInsertRowid) as Goal
        }
    )

    ipcMain.handle('db:log-goal', (_, goalId: unknown, value: unknown, date: unknown): void => {
        const cleanId = requirePositiveId(goalId, 'goalId')
        const cleanVal = requireNumber(value, 'value')
        const cleanDate = requireString(date, 'date', 10)

        // For 'everyday' type, we don't add multiple logs for the same day.
        // We just ensure one log exists with value 1.
        const goal = db.prepare('SELECT type FROM goals WHERE id = ?').get(cleanId) as {
            type: string
        }
        if (goal?.type === 'everyday') {
            db.prepare(
                'INSERT OR IGNORE INTO goal_logs (goal_id, date, value) VALUES (?, ?, 1)'
            ).run(cleanId, cleanDate)
        } else {
            // For others, add to the total for that day
            db.prepare('INSERT INTO goal_logs (goal_id, date, value) VALUES (?, ?, ?)').run(
                cleanId,
                cleanDate,
                cleanVal
            )
        }

        broadcast('data:changed')
    })

    ipcMain.handle('db:delete-goal', (_, id: unknown): void => {
        const cleanId = requirePositiveId(id, 'id')
        db.prepare('DELETE FROM goals WHERE id = ?').run(cleanId)
        broadcast('data:changed')
    })
}

import { ipcMain } from 'electron'
import db from '../db'
import { broadcast } from '../services/broadcast'
import type { ProjectPhase } from '../../shared/types'
import { requireString, requirePositiveId, requireNumber } from './validate'

export function registerPhaseHandlers(): void {
    ipcMain.handle('db:get-phases', (_, projectId: number): ProjectPhase[] => {
        return db
            .prepare(
                `
            SELECT * FROM project_phases
            WHERE project_id = ?
            ORDER BY sort_order ASC, id ASC
          `
            )
            .all(projectId) as ProjectPhase[]
    })

    ipcMain.handle(
        'db:create-phase',
        (_, projectId: unknown, name: unknown, amountCents: unknown): ProjectPhase => {
            const cleanProjectId = requirePositiveId(projectId, 'projectId')
            const cleanName = requireString(name, 'name', 500)
            const cleanAmountCents = requireNumber(amountCents, 'amountCents')

            if (!Number.isInteger(cleanAmountCents) || cleanAmountCents < 0) {
                throw new Error('Invalid amountCents: expected non-negative integer')
            }

            const project = db
                .prepare('SELECT currency FROM projects WHERE id = ?')
                .get(cleanProjectId) as { currency: string } | undefined
            const currency = project?.currency ?? 'USD'

            const maxOrder = db
                .prepare(
                    'SELECT COALESCE(MAX(sort_order), -1) as max FROM project_phases WHERE project_id = ?'
                )
                .get(cleanProjectId) as { max: number }

            const stmt = db.prepare(`
                INSERT INTO project_phases (project_id, name, amount_cents, currency, sort_order)
                VALUES (?, ?, ?, ?, ?)
            `)
            const result = stmt.run(
                cleanProjectId,
                cleanName,
                cleanAmountCents,
                currency,
                maxOrder.max + 1
            )
            const phase = db
                .prepare('SELECT * FROM project_phases WHERE id = ?')
                .get(result.lastInsertRowid) as ProjectPhase
            broadcast('data:changed')
            return phase
        }
    )

    ipcMain.handle(
        'db:update-phase',
        (_, id: unknown, updates: Partial<ProjectPhase>): ProjectPhase => {
            const cleanId = requirePositiveId(id, 'id')

            if (!updates || typeof updates !== 'object') {
                throw new Error('Invalid updates: expected object')
            }

            const allowed: (keyof ProjectPhase)[] = [
                'name',
                'amount_cents',
                'paid',
                'paid_at',
                'sort_order'
            ]
            const fields: string[] = []
            const values: (string | number | null)[] = []

            for (const key of allowed) {
                if (!(key in updates)) continue
                const v = updates[key]

                if (key === 'name') {
                    values.push(requireString(v, 'name', 500))
                } else if (key === 'amount_cents') {
                    const n = requireNumber(v, 'amount_cents')
                    if (!Number.isInteger(n) || n < 0) {
                        throw new Error('Invalid amount_cents: expected non-negative integer')
                    }
                    values.push(n)
                } else if (key === 'paid') {
                    if (typeof v === 'boolean') values.push(v ? 1 : 0)
                    else if (v === 0 || v === 1) values.push(v)
                    else throw new Error('Invalid paid: expected boolean or 0/1')
                } else if (key === 'paid_at') {
                    if (v === null || v === undefined || v === '') {
                        values.push(null)
                    } else {
                        values.push(requireString(v, 'paid_at', 30))
                    }
                } else if (key === 'sort_order') {
                    const n = requireNumber(v, 'sort_order')
                    if (!Number.isInteger(n)) {
                        throw new Error('Invalid sort_order: expected integer')
                    }
                    values.push(n)
                }

                fields.push(`${key} = ?`)
            }

            if (fields.length > 0) {
                values.push(cleanId)
                db.prepare(`UPDATE project_phases SET ${fields.join(', ')} WHERE id = ?`).run(
                    ...values
                )
            }

            const phase = db
                .prepare('SELECT * FROM project_phases WHERE id = ?')
                .get(cleanId) as ProjectPhase
            broadcast('data:changed')
            return phase
        }
    )

    ipcMain.handle('db:delete-phase', (_, id: number): void => {
        db.prepare('DELETE FROM project_phases WHERE id = ?').run(id)
        broadcast('data:changed')
    })
}

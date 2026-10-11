import { ipcMain } from 'electron'
import db from '../db'
import { broadcast } from '../services/broadcast'
import type { Project } from '../../shared/types'
import { requireString, optionalString, requireNumber, requireEnum } from './validate'
import { PROJECT_TYPES } from '../../shared/constants'

interface ProjectRow {
    id: number
    title: string
    client: string | null
    type: string | null
    brief: string | null
    status: string
    start_date: string | null
    due_date: string | null
    hourly_rate: number | null
    currency: string
    created_at: string
    archived: number
    client_contact: string | null
    tech_stack: string | null
    reference_links: string | null
}

function rowToProject(row: ProjectRow): Project {
    return {
        ...row,
        type: (row.type as Project['type']) ?? null,
        tech_stack: row.tech_stack ? (JSON.parse(row.tech_stack) as string[]) : null,
        reference_links: row.reference_links
            ? (JSON.parse(row.reference_links) as Project['reference_links'])
            : null
    }
}

function getProjectById(id: number): Project {
    const row = db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as ProjectRow
    return rowToProject(row)
}

export function registerProjectHandlers(): void {
    ipcMain.handle('db:get-projects', (): Project[] => {
        const rows = db
            .prepare('SELECT * FROM projects WHERE archived = 0 ORDER BY created_at DESC')
            .all() as ProjectRow[]
        return rows.map(rowToProject)
    })

    ipcMain.handle('db:create-project', (_, title: unknown, client: unknown): Project => {
        const cleanTitle = requireString(title, 'title', 200)
        const cleanClient = optionalString(client, 'client', 200) ?? ''
        const result = db
            .prepare('INSERT INTO projects (title, client) VALUES (?, ?)')
            .run(cleanTitle, cleanClient)
        broadcast('data:changed')
        return getProjectById(result.lastInsertRowid as number)
    })

    ipcMain.handle('db:update-project', (_, id: unknown, updates: Partial<Project>): Project => {
        const cleanId = requireNumber(id, 'id')
        if (!Number.isInteger(cleanId) || cleanId <= 0) {
            throw new Error('Invalid id: expected positive integer')
        }

        const allowed: (keyof Project)[] = [
            'title',
            'client',
            'type',
            'brief',
            'status',
            'start_date',
            'due_date',
            'hourly_rate',
            'currency',
            'archived',
            'client_contact',
            'tech_stack',
            'reference_links'
        ]
        const fields: string[] = []
        const values: (string | number | null)[] = []

        for (const key of allowed) {
            if (!(key in updates)) continue
            const v = updates[key]

            if (key === 'tech_stack') {
                if (v === null) {
                    values.push(null)
                } else if (Array.isArray(v)) {
                    const cleaned = v
                        .filter((x): x is string => typeof x === 'string')
                        .map((x) => x.trim().slice(0, 60))
                        .filter((x) => x.length > 0)
                        .slice(0, 30)
                    values.push(JSON.stringify(cleaned))
                } else {
                    throw new Error('Invalid tech_stack: expected array or null')
                }
            } else if (key === 'reference_links') {
                if (v === null) {
                    values.push(null)
                } else if (Array.isArray(v)) {
                    const cleaned = v
                        .filter(
                            (x): x is { label: string; url: string } =>
                                x !== null &&
                                typeof x === 'object' &&
                                typeof (x as { label?: unknown }).label === 'string' &&
                                typeof (x as { url?: unknown }).url === 'string'
                        )
                        .map((x) => ({
                            label: x.label.slice(0, 100),
                            url: x.url.slice(0, 500)
                        }))
                        .slice(0, 20)
                    values.push(JSON.stringify(cleaned))
                } else {
                    throw new Error('Invalid reference_links: expected array or null')
                }
            } else if (key === 'type') {
                values.push(v === null ? null : requireEnum(v, 'type', PROJECT_TYPES))
            } else if (
                key === 'title' ||
                key === 'client' ||
                key === 'brief' ||
                key === 'status' ||
                key === 'client_contact'
            ) {
                values.push(optionalString(v, key, 2000))
            } else if (key === 'hourly_rate') {
                values.push(v === null ? null : requireNumber(v, key))
            } else if (key === 'archived') {
                values.push(typeof v === 'number' ? v : 0)
            } else {
                values.push(optionalString(v, key, 20))
            }
            fields.push(`${key} = ?`)
        }

        if (fields.length > 0) {
            values.push(cleanId)
            db.prepare(`UPDATE projects SET ${fields.join(', ')} WHERE id = ?`).run(...values)
            broadcast('data:changed')
        }

        return getProjectById(cleanId)
    })

    ipcMain.handle('db:delete-project', (_, id: unknown): void => {
        const cleanId = requireNumber(id, 'id')
        if (!Number.isInteger(cleanId) || cleanId <= 0) {
            throw new Error('Invalid id: expected positive integer')
        }
        db.prepare('DELETE FROM projects WHERE id = ?').run(cleanId)
        broadcast('data:changed')
    })
}

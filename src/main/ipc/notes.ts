import { ipcMain } from 'electron'
import db from '../db'
import { broadcast } from '../services/broadcast'
import type { Note, NoteSummary, NoteUpdate } from '../../shared/types'
import { requireString, optionalString, requireNumber, optionalId } from './validate'

interface NoteRow {
    id: number
    title: string
    body: string
    topics: string | null
    project_id: number | null
    pinned: number
    created_at: string
    updated_at: string
}

function rowToNote(row: NoteRow): Note {
    return {
        ...row,
        topics: row.topics ? (JSON.parse(row.topics) as string[]) : null,
        pinned: row.pinned === 1 ? 1 : 0
    }
}

function getNoteById(id: number): Note {
    const row = db.prepare('SELECT * FROM notes WHERE id = ?').get(id) as NoteRow
    return rowToNote(row)
}

export function registerNoteHandlers(): void {
    ipcMain.handle('db:get-notes', (): NoteSummary[] => {
        return db
            .prepare(
                `
                SELECT id, title, project_id, pinned, created_at, updated_at,
                       substr(body, 1, 160) AS preview
                FROM notes
                ORDER BY pinned DESC, updated_at DESC
            `
            )
            .all() as NoteSummary[]
    })

    ipcMain.handle('db:get-notes-by-project', (_, projectId: unknown): NoteSummary[] => {
        const clean = requireNumber(projectId, 'projectId')
        return db
            .prepare(
                `
                SELECT id, title, project_id, pinned, created_at, updated_at,
                       substr(body, 1, 160) AS preview
                FROM notes
                WHERE project_id = ?
                ORDER BY pinned DESC, updated_at DESC
            `
            )
            .all(clean) as NoteSummary[]
    })

    ipcMain.handle('db:get-note', (_, id: unknown): Note => {
        const clean = requireNumber(id, 'id')
        return getNoteById(clean)
    })

    ipcMain.handle('db:create-note', (_, title: unknown, projectId: unknown): Note => {
        const cleanTitle = requireString(title, 'title', 500)
        const cleanProjectId = optionalId(projectId, 'projectId')

        const result = db
            .prepare('INSERT INTO notes (title, project_id) VALUES (?, ?)')
            .run(cleanTitle, cleanProjectId)

        broadcast('data:changed')
        return getNoteById(result.lastInsertRowid as number)
    })

    ipcMain.handle('db:update-note', (_, id: unknown, updates: NoteUpdate): Note => {
        const cleanId = requireNumber(id, 'id')
        if (!Number.isInteger(cleanId) || cleanId <= 0) {
            throw new Error('Invalid id: expected positive integer')
        }

        const allowed: (keyof Note)[] = ['title', 'body', 'topics', 'project_id', 'pinned']
        const fields: string[] = []
        const values: (string | number | null)[] = []

        for (const key of allowed) {
            if (!(key in updates)) continue
            const v = updates[key]

            if (key === 'topics') {
                if (v === null) {
                    values.push(null)
                } else if (Array.isArray(v)) {
                    const cleaned = v
                        .filter((x): x is string => typeof x === 'string')
                        .map((x) => x.trim().slice(0, 40))
                        .filter((x) => x.length > 0)
                        .slice(0, 15)
                    values.push(cleaned.length > 0 ? JSON.stringify(cleaned) : null)
                } else {
                    throw new Error('Invalid topics: expected array or null')
                }
            } else if (key === 'title') {
                values.push(optionalString(v, 'title', 500) ?? '')
            } else if (key === 'body') {
                if (v === null) values.push('')
                else if (typeof v === 'string') values.push(v.slice(0, 500_000))
                else throw new Error('Invalid body: expected string')
            } else if (key === 'project_id') {
                values.push(optionalId(v, 'project_id'))
            } else if (key === 'pinned') {
                if (v !== 0 && v !== 1) throw new Error('Invalid pinned: expected 0 or 1')
                values.push(v)
            }

            fields.push(`${key} = ?`)
        }

        if (fields.length > 0) {
            // Always touch updated_at on any update
            fields.push(`updated_at = datetime('now')`)
            values.push(cleanId)
            db.prepare(`UPDATE notes SET ${fields.join(', ')} WHERE id = ?`).run(...values)
            broadcast('data:changed')
        }

        return getNoteById(cleanId)
    })

    ipcMain.handle('db:delete-note', (_, id: unknown): void => {
        const clean = requireNumber(id, 'id')
        if (!Number.isInteger(clean) || clean <= 0) {
            throw new Error('Invalid id: expected positive integer')
        }
        db.prepare('DELETE FROM notes WHERE id = ?').run(clean)
        broadcast('data:changed')
    })
}

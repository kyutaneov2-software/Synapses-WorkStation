import { ipcMain } from 'electron'
import db from '../db'
import { broadcast } from '../services/broadcast'
import type { Tag } from '../../shared/types'
import { requirePositiveId } from './validate'
import { TAG_COLORS } from '../../shared/constants'

function pickColor(name: string): string {
    let hash = 0
    for (let i = 0; i < name.length; i++) {
        hash = (hash * 31 + name.charCodeAt(i)) | 0
    }
    return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length]
}

export function registerTagHandlers(): void {
    ipcMain.handle('db:get-tags', (): Tag[] => {
        return db.prepare('SELECT * FROM tags ORDER BY name ASC').all() as Tag[]
    })

    ipcMain.handle('db:get-project-tags', (_, projectId: unknown): Tag[] => {
        const id = requirePositiveId(projectId, 'projectId')
        return db
            .prepare(
                `
                SELECT t.* FROM tags t
                JOIN project_tags pt ON pt.tag_id = t.id
                WHERE pt.project_id = ?
                ORDER BY t.name ASC
            `
            )
            .all(id) as Tag[]
    })

    ipcMain.handle('db:set-project-tags', (_, projectId: unknown, tagNames: unknown): Tag[] => {
        const id = requirePositiveId(projectId, 'projectId')

        if (!Array.isArray(tagNames)) {
            throw new Error('Invalid tagNames: expected array')
        }

        const cleaned = tagNames
            .filter((x): x is string => typeof x === 'string')
            .map((x) => x.trim().slice(0, 50))
            .filter((x) => x.length > 0)
            .slice(0, 20)

        const unique = Array.from(new Set(cleaned))

        const tx = db.transaction(() => {
            const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)')
            for (const name of unique) {
                insertTag.run(name, pickColor(name))
            }

            db.prepare('DELETE FROM project_tags WHERE project_id = ?').run(id)

            const insertLink = db.prepare(`
                INSERT INTO project_tags (project_id, tag_id)
                SELECT ?, id FROM tags WHERE name = ?
            `)
            for (const name of unique) {
                insertLink.run(id, name)
            }
        })
        tx()

        broadcast('data:changed')

        return db
            .prepare(
                `
                SELECT t.* FROM tags t
                JOIN project_tags pt ON pt.tag_id = t.id
                WHERE pt.project_id = ?
                ORDER BY t.name ASC
            `
            )
            .all(id) as Tag[]
    })
}

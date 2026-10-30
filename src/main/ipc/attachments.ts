import { ipcMain, dialog, shell, app } from 'electron'
import db from '../db'
import { broadcast } from '../services/broadcast'
import type { Attachment } from '../../shared/types'
import { requirePositiveId } from './validate'
import fs from 'fs'
import path from 'path'

export function registerAttachmentHandlers(): void {
    // 1. Get all attachments for a project
    ipcMain.handle('db:get-attachments', (_, projectId: unknown): Attachment[] => {
        const cleanId = requirePositiveId(projectId, 'projectId')
        return db
            .prepare('SELECT * FROM attachments WHERE project_id = ? ORDER BY created_at DESC')
            .all(cleanId) as Attachment[]
    })

    // 2. Open file picker, copy file, save to DB
    ipcMain.handle(
        'db:add-attachments',
        async (_, projectId: unknown, windowTitle: string): Promise<void> => {
            const cleanId = requirePositiveId(projectId, 'projectId')

            const result = await dialog.showOpenDialog({
                title: windowTitle || 'Select files to attach',
                properties: ['openFile', 'multiSelections']
            })

            if (result.canceled || result.filePaths.length === 0) return

            // Ensure the app data attachments directory exists
            const attachDir = path.join(app.getPath('userData'), 'attachments')
            if (!fs.existsSync(attachDir)) {
                fs.mkdirSync(attachDir, { recursive: true })
            }

            const insert = db.prepare(`
            INSERT INTO attachments (project_id, filename, original_name, mime_type, size)
            VALUES (?, ?, ?, ?, ?)
        `)

            for (const filePath of result.filePaths) {
                const originalName = path.basename(filePath)
                const ext = path.extname(filePath)
                // Create a unique filename to prevent collisions
                const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`
                const destPath = path.join(attachDir, uniqueName)

                // Copy the file
                fs.copyFileSync(filePath, destPath)
                const stats = fs.statSync(destPath)

                // Determine simple mime type based on extension (basic fallback)
                const mimeType =
                    ext.toLowerCase() === '.pdf'
                        ? 'application/pdf'
                        : ['.png', '.jpg', '.jpeg', '.gif'].includes(ext.toLowerCase())
                          ? 'image/*'
                          : 'application/octet-stream'

                insert.run(cleanId, uniqueName, originalName, mimeType, stats.size)
            }

            broadcast('data:changed')
        }
    )

    // 3. Delete an attachment
    ipcMain.handle('db:delete-attachment', (_, id: unknown): void => {
        const cleanId = requirePositiveId(id, 'id')

        const row = db.prepare('SELECT filename FROM attachments WHERE id = ?').get(cleanId) as
            { filename: string } | undefined
        if (row) {
            const filePath = path.join(app.getPath('userData'), 'attachments', row.filename)
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
            db.prepare('DELETE FROM attachments WHERE id = ?').run(cleanId)
            broadcast('data:changed')
        }
    })

    // 4. Open an attachment using the OS default app
    ipcMain.handle('system:open-attachment', (_, filename: string): void => {
        const filePath = path.join(app.getPath('userData'), 'attachments', filename)
        if (fs.existsSync(filePath)) {
            shell.openPath(filePath)
        }
    })
}

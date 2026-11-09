import { ipcMain } from 'electron'
import { registerProjectHandlers } from './projects'
import { registerTaskHandlers } from './tasks'
import { registerPhaseHandlers } from './phases'
import { registerFocusHandlers } from './focus'
import { registerSystemHandlers } from './system'
import { registerDashboardHandlers } from './dashboard'
import { registerSessionHandlers } from './sessions'
import { registerTagHandlers } from './tags'
import { registerNoteHandlers } from './notes'
import { registerAttachmentHandlers } from './attachments'
import { registerSettingsIpcHandlers, SETTINGS_CHANNELS } from './settings'

const ALL_CHANNELS = [
    // Projects
    'db:get-projects',
    'db:create-project',
    'db:get-project',
    'db:update-project',
    'db:delete-project',
    // Tasks
    'db:get-tasks',
    'db:get-tasks-by-view',
    'db:get-tasks-by-project',
    'db:create-task',
    'db:toggle-task',
    'db:update-task',
    'db:delete-task',
    // Phases
    'db:get-phases',
    'db:create-phase',
    'db:update-phase',
    'db:delete-phase',
    // Focus window
    'focus:toggle',
    'focus:get-current',
    'focus:complete',
    'focus:quick-add-tomorrow',
    'focus:pin-task',
    // Sessions
    'session:start',
    'session:stop',
    'session:get-active',
    'session:get-totals',
    // Dashboard
    'dashboard:get-data',
    // System
    'db:health-check',
    // Tags
    'db:get-tags',
    'db:get-project-tags',
    'db:set-project-tags',
    // Notes
    'db:get-notes',
    'db:get-notes-by-project',
    'db:get-note',
    'db:create-note',
    'db:update-note',
    'db:delete-note',
    // System
    'db:health-check',
    'system:test-notification',
    'system:get-info', // ← new
    'system:open-user-data',
    // Attachment
    'db:get-attachments',
    'db:add-attachments',
    'db:delete-attachment',
    'system:open-attachment',
    // Settings
    ...SETTINGS_CHANNELS
]

function clearExistingHandlers(): void {
    for (const channel of ALL_CHANNELS) {
        ipcMain.removeHandler(channel)
    }
}

export function registerAllIpcHandlers(): void {
    clearExistingHandlers()

    registerProjectHandlers()
    registerTaskHandlers()
    registerPhaseHandlers()
    registerFocusHandlers()
    registerSystemHandlers()
    registerDashboardHandlers()
    registerSessionHandlers()
    registerTagHandlers()
    registerNoteHandlers()
    registerAttachmentHandlers()
    registerSettingsIpcHandlers()

    console.log('[ipc] all handlers registered')
}

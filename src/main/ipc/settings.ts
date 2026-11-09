import { ipcMain, dialog, BrowserWindow } from 'electron'
import type { SettingsPatch, Theme, AccentColor } from '../../shared/types'
import { readResolvedSettings, updateSettings, DEFAULT_SETTINGS } from '../services/settings'
import { setLaunchOnStartup } from '../services/startup'
import { app, shell } from 'electron'
import { getFocusWindow } from '../focusWindow'

export const SETTINGS_CHANNELS = ['settings:get', 'settings:update', 'settings:reset'] as const

const VALID_THEMES: Theme[] = ['dark', 'light', 'system']
const VALID_ACCENTS: AccentColor[] = ['blue', 'ember', 'violet', 'emerald', 'rose']

function validatePatch(input: unknown): SettingsPatch {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
        throw new Error('settings:update expects an object')
    }

    const p = input as Record<string, unknown>
    const out: SettingsPatch = {}

    if ('theme' in p) {
        if (!VALID_THEMES.includes(p.theme as Theme)) {
            throw new Error(`Invalid theme: ${String(p.theme)}`)
        }
        out.theme = p.theme as Theme
    }

    if ('accentColor' in p) {
        if (!VALID_ACCENTS.includes(p.accentColor as AccentColor)) {
            throw new Error(`Invalid accentColor: ${String(p.accentColor)}`)
        }
        out.accentColor = p.accentColor as AccentColor
    }

    if ('username' in p) {
        if (typeof p.username !== 'string') throw new Error('username must be a string')
        out.username = p.username.slice(0, 50)
    }

    if ('defaultCurrency' in p) {
        if (typeof p.defaultCurrency !== 'string' || !/^[A-Z]{3}$/.test(p.defaultCurrency)) {
            throw new Error('defaultCurrency must be a 3-letter ISO code (e.g. USD)')
        }
        out.defaultCurrency = p.defaultCurrency
    }

    if ('notificationsEnabled' in p) {
        if (typeof p.notificationsEnabled !== 'boolean') {
            throw new Error('notificationsEnabled must be a boolean')
        }
        out.notificationsEnabled = p.notificationsEnabled
    }

    if ('minimizeToTrayOnClose' in p) {
        if (typeof p.minimizeToTrayOnClose !== 'boolean') {
            throw new Error('minimizeToTrayOnClose must be a boolean')
        }
        out.minimizeToTrayOnClose = p.minimizeToTrayOnClose
    }

    if ('focusAlwaysOnTop' in p) {
        if (typeof p.focusAlwaysOnTop !== 'boolean') {
            throw new Error('focusAlwaysOnTop must be a boolean')
        }
        out.focusAlwaysOnTop = p.focusAlwaysOnTop
    }

    if ('launchOnStartup' in p) {
        if (typeof p.launchOnStartup !== 'boolean') {
            throw new Error('launchOnStartup must be a boolean')
        }
        out.launchOnStartup = p.launchOnStartup
    }

    return out
}

export function registerSettingsIpcHandlers(): void {
    ipcMain.handle('settings:get', () => {
        return readResolvedSettings()
    })

    ipcMain.handle('settings:update', (_event, rawPatch: unknown) => {
        const patch = validatePatch(rawPatch)

        if (patch.launchOnStartup !== undefined) {
            try {
                setLaunchOnStartup(patch.launchOnStartup)
            } catch (e) {
                console.error('[settings] failed to apply launchOnStartup:', e)
            }
        }

        const updated = updateSettings(patch)

        // Apply window-level changes live
        if (patch.focusAlwaysOnTop !== undefined) {
            const focusWin = getFocusWindow()
            if (focusWin && !focusWin.isDestroyed()) {
                focusWin.setAlwaysOnTop(patch.focusAlwaysOnTop)
            }
        }

        return updated
    })

    ipcMain.handle('system:get-info', () => {
        return {
            version: app.getVersion(),
            userDataPath: app.getPath('userData')
        }
    })

    ipcMain.handle('system:open-user-data', async () => {
        const result = await shell.openPath(app.getPath('userData'))
        if (result) {
            // openPath returns an error string on failure (empty string = success)
            throw new Error(result)
        }
    })

    ipcMain.handle('settings:reset', async (event) => {
        const window = BrowserWindow.fromWebContents(event.sender)
        if (!window) return

        const { response } = await dialog.showMessageBox(window, {
            type: 'warning',
            buttons: ['Cancel', 'Reset Settings'],
            defaultId: 0,
            cancelId: 0,
            title: 'Reset to Defaults',
            message: 'Are you sure you want to reset all preferences?',
            detail: 'This will reset your theme, accent color, profile, and all toggles. Your projects, tasks, and notes will not be affected.',
            noLink: true
        })

        if (response === 1) {
            return updateSettings(DEFAULT_SETTINGS)
        }
        return null
    })
}

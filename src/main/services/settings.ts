import { app, BrowserWindow } from 'electron'
import fs from 'fs'
import path from 'path'
import type { AppSettings, SettingsPatch } from '../../shared/types'


/**
 * Internal disk representation. May include focusWindowPosition (which
 * the renderer never sees) and may be missing keys that haven't been
 * set yet (existing installs upgrading from older versions).
 */
interface DiskSettings extends Partial<AppSettings> {
    focusWindowPosition?: { x: number; y: number }
}

const DEFAULT_SETTINGS: AppSettings = {
    launchOnStartup: true,
    theme: 'dark',
    accentColor: 'blue',
    username: '',
    defaultCurrency: 'USD',
    notificationsEnabled: true,
    minimizeToTrayOnClose: true,
    focusAlwaysOnTop: true
}

function getSettingsPath(): string {
    return path.join(app.getPath('userData'), 'settings.json')
}

let cache: DiskSettings | null = null

function loadFromDisk(): DiskSettings {
    try {
        const raw = fs.readFileSync(getSettingsPath(), 'utf-8')
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? (parsed as DiskSettings) : {}
    } catch (e) {
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error('[settings] failed to read settings, using defaults:', e)
        }
        return {}
    }
}

function getCache(): DiskSettings {
    if (cache === null) cache = loadFromDisk()
    return cache
}

function persist(settings: DiskSettings): void {
    const target = getSettingsPath()
    const tmp = `${target}.tmp`
    try {
        fs.writeFileSync(tmp, JSON.stringify(settings, null, 2), 'utf-8')
        fs.renameSync(tmp, target)
    } catch (e) {
        console.error('[settings] failed to write settings:', e)
        try {
            fs.unlinkSync(tmp)
        } catch {
            /* ignore */
        }
    }
}

function resolveSettings(disk: DiskSettings): AppSettings {
    return {
        launchOnStartup: disk.launchOnStartup ?? DEFAULT_SETTINGS.launchOnStartup,
        theme: disk.theme ?? DEFAULT_SETTINGS.theme,
        accentColor: disk.accentColor ?? DEFAULT_SETTINGS.accentColor,
        username: disk.username ?? DEFAULT_SETTINGS.username,
        defaultCurrency: disk.defaultCurrency ?? DEFAULT_SETTINGS.defaultCurrency,
        notificationsEnabled: disk.notificationsEnabled ?? DEFAULT_SETTINGS.notificationsEnabled,
        minimizeToTrayOnClose: disk.minimizeToTrayOnClose ?? DEFAULT_SETTINGS.minimizeToTrayOnClose,
        focusAlwaysOnTop: disk.focusAlwaysOnTop ?? DEFAULT_SETTINGS.focusAlwaysOnTop
    }
}

/** Raw disk view — may include focusWindowPosition, may have undefined keys. */
export function readSettings(): DiskSettings {
    return { ...getCache() }
}

/** Resolved view — all fields filled with defaults. Safe to send to renderer. */
export function readResolvedSettings(): AppSettings {
    return resolveSettings(getCache())
}

/**
 * Low-level write. Does NOT broadcast. Use this for internal state
 * changes like focus window position (which fires continuously on drag).
 */
export function writeSettings(settings: DiskSettings): void {
    cache = { ...settings }
    persist(settings)
}

/**
 * High-level update for user preferences. Merges the patch, persists to
 * disk, and broadcasts the resolved settings to every window so the UI
 * can react instantly (main window + Focus widget).
 */
export function updateSettings(patch: SettingsPatch): AppSettings {
    const merged: DiskSettings = { ...getCache(), ...patch }
    writeSettings(merged)
    const resolved = resolveSettings(merged)
    broadcastSettingsChanged(resolved)
    return resolved
}

function broadcastSettingsChanged(settings: AppSettings): void {
    for (const win of BrowserWindow.getAllWindows()) {
        if (!win.isDestroyed()) {
            win.webContents.send('settings:changed', settings)
        }
    }
}

export { DEFAULT_SETTINGS }

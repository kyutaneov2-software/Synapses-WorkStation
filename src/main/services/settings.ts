import { app } from 'electron'
import fs from 'fs'
import path from 'path'

export interface Settings {
    focusWindowPosition?: { x: number; y: number }
    launchOnStartup?: boolean
}

/**
 * Compute the settings path lazily rather than at module load. This makes
 * the module testable (userData can be overridden) and avoids depending on
 * Electron's app being ready at import time.
 */
function getSettingsPath(): string {
    return path.join(app.getPath('userData'), 'settings.json')
}

/**
 * In-memory cache. Authoritative for the current process. Disk is
 * write-through. This avoids read-modify-write races: callers mutate the
 * cache, and persistence is a single atomic write of the whole object.
 */
let cache: Settings | null = null

function loadFromDisk(): Settings {
    try {
        const raw = fs.readFileSync(getSettingsPath(), 'utf-8')
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? (parsed as Settings) : {}
    } catch (e) {
        // Missing file is normal on first run. Malformed file is not — log it
        // but recover gracefully so a bad write doesn't permanently brick the app.
        if ((e as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.error('[settings] failed to read settings, using defaults:', e)
        }
        return {}
    }
}

function getCache(): Settings {
    if (cache === null) cache = loadFromDisk()
    return cache
}

export function readSettings(): Settings {
    return { ...getCache() }
}

export function writeSettings(settings: Settings): void {
    cache = { ...settings }

    const target = getSettingsPath()
    const tmp = `${target}.tmp`

    try {
        // Atomic write: write the full file to a sibling, then rename over
        // the target. rename is atomic on the same filesystem (all modern
        // OSes), so a crash mid-write leaves either the old file intact
        // or the new file fully in place — never a truncated file.
        fs.writeFileSync(tmp, JSON.stringify(cache, null, 2), 'utf-8')
        fs.renameSync(tmp, target)
    } catch (e) {
        console.error('[settings] failed to write settings:', e)
        // Best effort: clean up the temp file if we can.
        try {
            fs.unlinkSync(tmp)
        } catch {
            /* ignore */
        }
    }
}

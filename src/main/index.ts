import { app, globalShortcut } from 'electron'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import db, { runMigrations } from './db'
import { migrateLegacyJson } from './db/migrateJson'
import { toggleFocusWindow } from './focusWindow'
import { registerAllIpcHandlers } from './ipc'
import { startNotificationScheduler, stopNotificationScheduler } from './services/notifications'
import { runAutoBackup } from './services/backup'
import { createTray, destroyTray } from './services/tray'
import { setLaunchOnStartup } from './services/startup'
import { readSettings, writeSettings } from './services/settings'
import { setQuitting, createMainWindow, getMainWindow } from './mainWindow'

// Set AppUserModelID BEFORE app.whenReady()
// Windows needs this for notifications to route correctly.
if (process.platform === 'win32') {
    if (!app.isPackaged) {
        electronApp.setAppUserModelId(process.execPath)
    } else {
        electronApp.setAppUserModelId('com.synapses.workstation')
    }
} else {
    electronApp.setAppUserModelId('com.synapses.workstation')
}

app.whenReady().then(() => {
    runMigrations()
    console.log('Database initialized at:', db.name)
    migrateLegacyJson()
    runAutoBackup()

    // Close any sessions left running from a previous crash
    db.prepare(`UPDATE sessions SET ended_at = datetime('now') WHERE ended_at IS NULL`).run()

    app.on('browser-window-created', (_, window) => {
        optimizer.watchWindowShortcuts(window)
    })

    registerAllIpcHandlers()

    startNotificationScheduler()

    globalShortcut.register('CommandOrControl+Shift+F', () => {
        toggleFocusWindow()
    })

    createMainWindow()

    createTray()

    // Enable launch on startup by default on first run
    const settings = readSettings()
    if (settings.launchOnStartup === undefined) {
        setLaunchOnStartup(true)
        writeSettings({ ...settings, launchOnStartup: true })
    } else {
        setLaunchOnStartup(settings.launchOnStartup)
    }

    app.on('activate', () => {
        if (!getMainWindow()) createMainWindow()
    })
})

// Mark the app as "really quitting" so the main window's close
// handler skips the preventDefault and lets the window close.
app.on('before-quit', () => {
    setQuitting(true)
})

app.on('will-quit', () => {
    globalShortcut.unregisterAll()
    stopNotificationScheduler()
    destroyTray()
    db.prepare(`UPDATE sessions SET ended_at = datetime('now') WHERE ended_at IS NULL`).run()
})

// Don't quit when the last window closes — keep running in the tray.
// The user quits via the tray menu (or Cmd+Q on macOS).
app.on('window-all-closed', () => {
    // Intentionally empty on Windows/Linux — app keeps running in tray.
    // On macOS this event never fires anyway (standard behavior).
})

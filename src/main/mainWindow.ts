import { BrowserWindow, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

export function setQuitting(value: boolean): void {
    isQuitting = value
}

export function setMainWindow(win: BrowserWindow | null): void {
    mainWindow = win
}

export function getMainWindow(): BrowserWindow | null {
    return mainWindow
}

export function createMainWindow(): BrowserWindow {
    const win = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === 'linux' ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, '../preload/index.js'),
            sandbox: false,
            contextIsolation: true,
            nodeIntegration: false
        }
    })

    setMainWindow(win)

    win.on('ready-to-show', () => win.show())

    win.on('close', (e) => {
        if (!isQuitting) {
            e.preventDefault()
            win.hide()
            console.log('[main] window hidden — app still running in tray')
        }
    })

    win.on('closed', () => {
        setMainWindow(null)
    })

    win.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url)
        return { action: 'deny' }
    })

    if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
        win.loadURL(process.env['ELECTRON_RENDERER_URL'])
    } else {
        win.loadFile(join(__dirname, '../renderer/index.html'))
    }

    return win
}

export function showMainWindow(): void {
    if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.show()
        mainWindow.focus()
    } else {
        // Window was closed (not just hidden) — recreate it.
        createMainWindow()
    }
}

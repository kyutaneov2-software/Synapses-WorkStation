import { app, Menu, Tray, nativeImage } from 'electron'
import trayIcon from '../../../resources/synapses-Icon.png?asset'
import { toggleFocusWindow, getFocusWindow, createFocusWindow } from '../focusWindow'
import { showMainWindow } from '../mainWindow'

let tray: Tray | null = null

export function createTray(): Tray {
    console.log('[tray] createTray called')

    if (tray) {
        console.log('[tray] already exists, returning existing instance')
        return tray
    }

    const icon = nativeImage.createFromPath(trayIcon)
    console.log('[tray] icon loaded, size:', icon.getSize())

    if (icon.isEmpty()) {
        console.warn('[tray] icon is empty — path resolution failed')
    }

    const resized = icon.resize({ width: 16, height: 16 })

    tray = new Tray(resized)
    tray.setToolTip('Synapses WorkStation')

    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Main Window',
            click: (): void => showMainWindow()
        },
        {
            label: 'Toggle Focus Window',
            click: (): void => toggleFocusWindow()
        },
        {
            label: 'Open Focus Window',
            click: (): void => {
                const fw = getFocusWindow()
                if (fw && !fw.isDestroyed()) {
                    fw.show()
                    fw.focus()
                } else {
                    createFocusWindow()
                }
            }
        },
        { type: 'separator' },
        {
            label: 'Quit Synapses WorkStation',
            click: (): void => {
                app.quit()
            }
        }
    ])

    tray.setContextMenu(contextMenu)

    tray.on('double-click', () => {
        showMainWindow()
    })

    console.log('[tray] icon created and menu attached')
    return tray
}

export function destroyTray(): void {
    if (tray && !tray.isDestroyed()) {
        tray.destroy()
        tray = null
    }
}

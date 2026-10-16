import { BrowserWindow } from 'electron'

/**
 * Send an event to every live window. If a single window's webContents
 * is in a state that rejects `send` (mid-reload, mid-teardown, crashed
 * renderer), we log it and continue — one bad window must not prevent
 * the remaining windows from receiving the event.
 */
export function broadcast(channel: string, payload?: unknown): void {
    for (const win of BrowserWindow.getAllWindows()) {
        if (win.isDestroyed()) continue
        const wc = win.webContents
        if (!wc || wc.isDestroyed()) continue

        try {
            wc.send(channel, payload)
        } catch (e) {
            console.warn(
                `[broadcast] failed to send '${channel}' to window ${win.id}:`,
                e instanceof Error ? e.message : e
            )
        }
    }
}

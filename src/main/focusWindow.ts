import { BrowserWindow, screen } from "electron";
import { join } from "path";
import { is } from "@electron-toolkit/utils";
import { readSettings, writeSettings } from "./services/settings";

let focusWindow: BrowserWindow | null = null;

export function getFocusWindow(): BrowserWindow | null {
    return focusWindow;
}

export function createFocusWindow(): BrowserWindow {
    if (focusWindow && !focusWindow.isDestroyed()) {
        focusWindow.show();
        return focusWindow;
    }

    const settings = readSettings();
    const pos = settings.focusWindowPosition || getDefaultPosition();

    focusWindow = new BrowserWindow({
        width: 360,
        height: 156,
        x: pos.x,
        y: pos.y,
        frame: false,
        alwaysOnTop: true,
        skipTaskbar: true,
        resizable: false,
        show: false,
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
        },
    });

    focusWindow.on("ready-to-show", () => focusWindow?.show());

    focusWindow.on("moved", () => {
        if (!focusWindow || focusWindow.isDestroyed()) return;
        const [x, y] = focusWindow.getPosition();
        writeSettings({ ...readSettings(), focusWindowPosition: { x, y } });
    });

    focusWindow.on("closed", () => {
        focusWindow = null;
    });

    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        focusWindow.loadURL(
            `${process.env["ELECTRON_RENDERER_URL"]}/focus.html`,
        );
    } else {
        focusWindow.loadFile(join(__dirname, "../renderer/focus.html"));
    }

    return focusWindow;
}

export function toggleFocusWindow(): void {
    if (focusWindow && !focusWindow.isDestroyed()) {
        if (focusWindow.isVisible()) {
            focusWindow.hide();
        } else {
            focusWindow.show();
            focusWindow.focus();
        }
    } else {
        createFocusWindow();
    }
}

function getDefaultPosition(): { x: number; y: number } {
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    return { x: width - 380, y: 20 };
}

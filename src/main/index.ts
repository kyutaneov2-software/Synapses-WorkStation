import { app, shell, BrowserWindow, globalShortcut } from "electron";
import { join } from "path";
import { electronApp, optimizer, is } from "@electron-toolkit/utils";
import icon from "../../resources/icon.png?asset";
import db, { runMigrations } from "./db";
import { migrateLegacyJson } from "./db/migrateJson";
import { toggleFocusWindow } from "./focusWindow";
import { registerAllIpcHandlers } from "./ipc";
import {
    startNotificationScheduler,
    stopNotificationScheduler,
} from "./services/notifications";

// Set AppUserModelID BEFORE app.whenReady() — Windows needs this for notifications
// In dev mode, we point at the Electron binary so Windows routes notifications correctly
if (process.platform === "win32") {
    if (!app.isPackaged) {
        electronApp.setAppUserModelId(process.execPath);
    } else {
        electronApp.setAppUserModelId("com.synapses.workstation");
    }
} else {
    electronApp.setAppUserModelId("com.synapses.workstation");
}

function createWindow(): void {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 700,
        show: false,
        autoHideMenuBar: true,
        ...(process.platform === "linux" ? { icon } : {}),
        webPreferences: {
            preload: join(__dirname, "../preload/index.js"),
            sandbox: false,
        },
    });

    mainWindow.on("ready-to-show", () => mainWindow.show());

    mainWindow.webContents.setWindowOpenHandler((details) => {
        shell.openExternal(details.url);
        return { action: "deny" };
    });

    if (is.dev && process.env["ELECTRON_RENDERER_URL"]) {
        mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
    } else {
        mainWindow.loadFile(join(__dirname, "../renderer/index.html"));
    }
}

app.whenReady().then(() => {
    runMigrations();
    console.log("Database initialized at:", db.name);
    migrateLegacyJson();

    db.prepare(
        `UPDATE sessions SET ended_at = datetime('now') WHERE ended_at IS NULL`,
    ).run();

    app.on("browser-window-created", (_, window) => {
        optimizer.watchWindowShortcuts(window);
    });

    registerAllIpcHandlers();

    startNotificationScheduler();

    globalShortcut.register("CommandOrControl+Shift+F", () => {
        toggleFocusWindow();
    });

    createWindow();

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
    stopNotificationScheduler();
    // Close any active session cleanly
    db.prepare(
        `UPDATE sessions SET ended_at = datetime('now') WHERE ended_at IS NULL`,
    ).run();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});

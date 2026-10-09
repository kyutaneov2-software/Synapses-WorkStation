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
import { runAutoBackup } from "./services/backup";
import { createTray, destroyTray } from "./services/tray";
import { setLaunchOnStartup } from "./services/startup";
import { readSettings, writeSettings } from "./services/settings";
import { setMainWindow } from "./mainWindow";

// Set AppUserModelID BEFORE app.whenReady()
// Windows needs this for notifications to route correctly.
if (process.platform === "win32") {
    if (!app.isPackaged) {
        electronApp.setAppUserModelId(process.execPath);
    } else {
        electronApp.setAppUserModelId("com.synapses.workstation");
    }
} else {
    electronApp.setAppUserModelId("com.synapses.workstation");
}

// Flag that tracks whether the user is genuinely quitting
// (via tray menu, Cmd+Q, etc.) vs. just closing the window.
let isQuitting = false;

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
            contextIsolation: true,
            nodeIntegration: false,
        },
    });

    setMainWindow(mainWindow);

    mainWindow.on("ready-to-show", () => mainWindow.show());

    // Intercept close — hide instead, unless we're really quitting
    mainWindow.on("close", (e) => {
        if (!isQuitting) {
            e.preventDefault();
            mainWindow.hide();
            console.log("[main] window hidden — app still running in tray");
        }
    });

    mainWindow.on("closed", () => {
        setMainWindow(null);
    });

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
    runAutoBackup();

    // Close any sessions left running from a previous crash
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

    createTray();

    // Enable launch on startup by default on first run
    const settings = readSettings();
    if (settings.launchOnStartup === undefined) {
        setLaunchOnStartup(true);
        writeSettings({ ...settings, launchOnStartup: true });
    } else {
        setLaunchOnStartup(settings.launchOnStartup);
    }

    app.on("activate", function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// Mark the app as "really quitting" so the main window's close
// handler skips the preventDefault and lets the window close.
app.on("before-quit", () => {
    isQuitting = true;
});

app.on("will-quit", () => {
    globalShortcut.unregisterAll();
    stopNotificationScheduler();
    destroyTray();
    db.prepare(
        `UPDATE sessions SET ended_at = datetime('now') WHERE ended_at IS NULL`,
    ).run();
});

// Don't quit when the last window closes — keep running in the tray.
// The user quits via the tray menu (or Cmd+Q on macOS).
app.on("window-all-closed", () => {
    // Intentionally empty on Windows/Linux — app keeps running in tray.
    // On macOS this event never fires anyway (standard behavior).
});

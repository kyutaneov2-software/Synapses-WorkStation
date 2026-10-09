import { app } from "electron";
import fs from "fs";
import path from "path";

export interface Settings {
    focusWindowPosition?: { x: number; y: number };
    launchOnStartup?: boolean;
}

const settingsPath = path.join(app.getPath("userData"), "settings.json");

export function readSettings(): Settings {
    try {
        if (fs.existsSync(settingsPath)) {
            return JSON.parse(
                fs.readFileSync(settingsPath, "utf-8"),
            ) as Settings;
        }
    } catch (e) {
        console.error("Failed to read settings:", e);
    }
    return {};
}

export function writeSettings(settings: Settings): void {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (e) {
        console.error("Failed to write settings:", e);
    }
}

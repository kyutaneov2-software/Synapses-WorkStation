import { app } from "electron";

export function setLaunchOnStartup(enabled: boolean): void {
    if (process.platform === "linux") return; // not supported reliably
    app.setLoginItemSettings({
        openAtLogin: enabled,
        openAsHidden: true,
    });
}

export function isLaunchOnStartupEnabled(): boolean {
    if (process.platform === "linux") return false;
    return app.getLoginItemSettings().openAtLogin;
}

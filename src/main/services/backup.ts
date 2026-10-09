import fs from "fs";
import path from "path";
import { app } from "electron";

const MAX_BACKUPS = 10;

function timestamp(): string {
    const d = new Date();
    return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
}

export function runAutoBackup(): void {
    try {
        const userData = app.getPath("userData");
        const source = path.join(userData, "task-notes.db");
        const backupDir = path.join(userData, "backups");

        if (!fs.existsSync(source)) {
            console.log("[backup] No database file yet, skipping.");
            return;
        }

        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const dest = path.join(backupDir, `task-notes-${timestamp()}.db`);
        fs.copyFileSync(source, dest);
        console.log("[backup] Created:", path.basename(dest));

        const entries = fs
            .readdirSync(backupDir)
            .filter((f) => f.startsWith("task-notes-") && f.endsWith(".db"))
            .sort()
            .reverse();

        if (entries.length > MAX_BACKUPS) {
            const toDelete = entries.slice(MAX_BACKUPS);
            for (const f of toDelete) {
                fs.unlinkSync(path.join(backupDir, f));
            }
            console.log(`[backup] Pruned ${toDelete.length} old backup(s).`);
        }
    } catch (e) {
        console.error("[backup] Failed:", e);
    }
}

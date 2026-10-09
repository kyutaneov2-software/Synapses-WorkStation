import { ipcMain } from "electron";
import db from "../db";
import { broadcast } from "../services/broadcast";
import { toggleFocusWindow } from "../focusWindow";
import type { Task } from "../../shared/types";

export function registerFocusHandlers(): void {
    ipcMain.handle("focus:toggle", () => toggleFocusWindow());

    ipcMain.handle("focus:get-current", (): Task | null => {
        const current = db
            .prepare("SELECT * FROM tasks WHERE is_current = 1 LIMIT 1")
            .get() as Task | undefined;

        if (current) return current;

        const next = db
            .prepare(
                `
          SELECT * FROM tasks
          WHERE done = 0
            AND (planned_for IS NULL OR planned_for <= date('now', 'localtime'))
          ORDER BY priority DESC, created_at ASC
          LIMIT 1
        `,
            )
            .get() as Task | undefined;

        return next ?? null;
    });

    ipcMain.handle("focus:complete", (_, taskId: number): Task | null => {
        // Stop any active session (including this task's)
        db.prepare(
            `UPDATE sessions
       SET ended_at = datetime('now')
       WHERE ended_at IS NULL
         AND (task_id = ? OR task_id IS NULL)`,
        ).run(taskId);

        db.prepare(
            `UPDATE tasks
       SET done = 1, completed_at = datetime('now'), is_current = 0
       WHERE id = ?`,
        ).run(taskId);

        const next = db
            .prepare(
                `
          SELECT * FROM tasks
          WHERE done = 0
            AND (planned_for IS NULL OR planned_for <= date('now', 'localtime'))
          ORDER BY priority DESC, created_at ASC
          LIMIT 1
        `,
            )
            .get() as Task | undefined;

        if (next) {
            db.prepare("UPDATE tasks SET is_current = 1 WHERE id = ?").run(
                next.id,
            );
            broadcast("data:changed");
            return next;
        }

        broadcast("data:changed");
        return null;
    });

    ipcMain.handle("focus:quick-add-tomorrow", (_, text: string): void => {
        const t = new Date();
        t.setDate(t.getDate() + 1);
        const dateStr = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(
            2,
            "0",
        )}-${String(t.getDate()).padStart(2, "0")}`;

        db.prepare(
            "INSERT INTO tasks (text, planned_for, done) VALUES (?, ?, 0)",
        ).run(text, dateStr);
        broadcast("data:changed");
    });
}

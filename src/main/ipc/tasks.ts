import { ipcMain } from "electron";
import db from "../db";
import { broadcast } from "../services/broadcast";
import type { Task } from "../../shared/types";

export function registerTaskHandlers(): void {
    ipcMain.handle("db:get-tasks", (): Task[] => {
        return db.prepare("SELECT * FROM tasks").all() as Task[];
    });

    ipcMain.handle(
        "db:get-tasks-by-view",
        (_, view: "today" | "tomorrow" | "all"): Task[] => {
            if (view === "today") {
                return db
                    .prepare(
                        `
              SELECT * FROM tasks
              WHERE done = 0
                AND (planned_for IS NULL OR planned_for <= date('now', 'localtime'))
              ORDER BY priority DESC, created_at ASC
            `,
                    )
                    .all() as Task[];
            }
            if (view === "tomorrow") {
                return db
                    .prepare(
                        `
              SELECT * FROM tasks
              WHERE done = 0
                AND planned_for = date('now', 'localtime', '+1 day')
              ORDER BY priority DESC, created_at ASC
            `,
                    )
                    .all() as Task[];
            }
            return db
                .prepare(
                    `SELECT * FROM tasks ORDER BY done ASC, created_at DESC`,
                )
                .all() as Task[];
        },
    );

    ipcMain.handle(
        "db:get-tasks-by-project",
        (_, projectId: number): Task[] => {
            return db
                .prepare(
                    `
            SELECT * FROM tasks
            WHERE project_id = ?
            ORDER BY done ASC, priority DESC, created_at ASC
          `,
                )
                .all(projectId) as Task[];
        },
    );

    ipcMain.handle(
        "db:create-task",
        (
            _,
            text: string,
            projectId: number | null,
            plannedFor: string | null,
            dueDate: string | null,
            priority: number,
        ): Task => {
            const stmt = db.prepare(`
        INSERT INTO tasks (project_id, text, planned_for, due_date, priority)
        VALUES (?, ?, ?, ?, ?)
      `);
            const result = stmt.run(
                projectId,
                text,
                plannedFor,
                dueDate,
                priority,
            );
            const task = db
                .prepare("SELECT * FROM tasks WHERE id = ?")
                .get(result.lastInsertRowid) as Task;
            broadcast("data:changed");
            return task;
        },
    );

    ipcMain.handle("db:toggle-task", (_, id: number, done: boolean): Task => {
        db.prepare(
            `UPDATE tasks SET done = ?, completed_at = ? WHERE id = ?`,
        ).run(done ? 1 : 0, done ? new Date().toISOString() : null, id);
        const task = db
            .prepare("SELECT * FROM tasks WHERE id = ?")
            .get(id) as Task;
        broadcast("data:changed");
        return task;
    });

    ipcMain.handle(
        "db:update-task",
        (_, id: number, updates: Partial<Task>): Task => {
            const allowed: (keyof Task)[] = [
                "text",
                "planned_for",
                "due_date",
                "priority",
                "project_id",
            ];
            const fields: string[] = [];
            const values: (string | number | null)[] = [];

            for (const key of allowed) {
                if (key in updates) {
                    fields.push(`${key} = ?`);
                    values.push(updates[key] as string | number | null);
                }
            }

            if (fields.length > 0) {
                values.push(id);
                db.prepare(
                    `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
                ).run(...values);
            }

            const task = db
                .prepare("SELECT * FROM tasks WHERE id = ?")
                .get(id) as Task;
            broadcast("data:changed");
            return task;
        },
    );

    ipcMain.handle("db:delete-task", (_, id: number): void => {
        db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
        broadcast("data:changed");
    });
}

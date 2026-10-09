import { ipcMain } from "electron";
import db from "../db";
import { broadcast } from "../services/broadcast";
import type { Task } from "../../shared/types";
import {
    requireString,
    optionalString,
    requirePositiveId,
    optionalId,
    requireNumber,
} from "./validate";

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
            text: unknown,
            projectId: unknown,
            plannedFor: unknown,
            dueDate: unknown,
            priority: unknown,
        ): Task => {
            const cleanText = requireString(text, "text", 2000);
            const cleanProjectId = optionalId(projectId, "projectId");
            const cleanPlanned = optionalString(plannedFor, "plannedFor", 10);
            const cleanDue = optionalString(dueDate, "dueDate", 10);
            const cleanPriority = requireNumber(priority, "priority");

            const stmt = db.prepare(`
          INSERT INTO tasks (project_id, text, planned_for, due_date, priority)
          VALUES (?, ?, ?, ?, ?)
        `);
            const result = stmt.run(
                cleanProjectId,
                cleanText,
                cleanPlanned,
                cleanDue,
                cleanPriority,
            );
            const task = db
                .prepare("SELECT * FROM tasks WHERE id = ?")
                .get(result.lastInsertRowid) as Task;
            broadcast("data:changed");
            return task;
        },
    );

    ipcMain.handle("db:toggle-task", (_, id: unknown, done: unknown): Task => {
        const cleanId = requirePositiveId(id, "id");
        if (typeof done !== "boolean") {
            throw new Error("Invalid done: expected boolean");
        }
        db.prepare(
            `UPDATE tasks SET done = ?, completed_at = ? WHERE id = ?`,
        ).run(done ? 1 : 0, done ? new Date().toISOString() : null, cleanId);
        const task = db
            .prepare("SELECT * FROM tasks WHERE id = ?")
            .get(cleanId) as Task;
        broadcast("data:changed");
        return task;
    });

    ipcMain.handle(
        "db:update-task",
        (_, id: unknown, updates: Record<string, unknown>): Task => {
            const cleanId = requirePositiveId(id, "id");
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
                    const v = updates[key];

                    // Validate per column
                    if (key === "text") {
                        values.push(requireString(v, "text", 2000));
                    } else if (key === "priority") {
                        values.push(requireNumber(v, "priority"));
                    } else if (key === "project_id") {
                        values.push(optionalId(v, "project_id"));
                    } else {
                        values.push(optionalString(v, key, 10));
                    }
                    fields.push(`${key} = ?`);
                }
            }

            if (fields.length > 0) {
                values.push(cleanId);
                db.prepare(
                    `UPDATE tasks SET ${fields.join(", ")} WHERE id = ?`,
                ).run(...values);
            }

            const task = db
                .prepare("SELECT * FROM tasks WHERE id = ?")
                .get(cleanId) as Task;
            broadcast("data:changed");
            return task;
        },
    );

    ipcMain.handle("db:delete-task", (_, id: unknown): void => {
        const cleanId = requirePositiveId(id, "id");
        db.prepare("DELETE FROM tasks WHERE id = ?").run(cleanId);
        broadcast("data:changed");
    });
}

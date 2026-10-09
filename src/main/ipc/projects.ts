import { ipcMain } from "electron";
import db from "../db";
import { broadcast } from "../services/broadcast";
import type { Project } from "../../shared/types";

export function registerProjectHandlers(): void {
    ipcMain.handle("db:get-projects", (): Project[] => {
        return db
            .prepare(
                "SELECT * FROM projects WHERE archived = 0 ORDER BY created_at DESC",
            )
            .all() as Project[];
    });

    ipcMain.handle(
        "db:create-project",
        (_, title: string, client: string, currency = "USD"): Project => {
            const stmt = db.prepare(
                "INSERT INTO projects (title, client, currency) VALUES (?, ?, ?)",
            );
            const result = stmt.run(title, client, currency);
            const project = db
                .prepare("SELECT * FROM projects WHERE id = ?")
                .get(result.lastInsertRowid) as Project;
            broadcast("data:changed");
            return project;
        },
    );

    ipcMain.handle(
        "db:update-project",
        (_, id: number, updates: Partial<Project>): Project => {
            const allowed: (keyof Project)[] = [
                "title",
                "client",
                "type",
                "brief",
                "status",
                "start_date",
                "due_date",
                "hourly_rate",
                "currency",
                "archived",
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
                    `UPDATE projects SET ${fields.join(", ")} WHERE id = ?`,
                ).run(...values);
            }

            const project = db
                .prepare("SELECT * FROM projects WHERE id = ?")
                .get(id) as Project;
            broadcast("data:changed");
            return project;
        },
    );

    ipcMain.handle("db:delete-project", (_, id: number): void => {
        db.prepare("DELETE FROM projects WHERE id = ?").run(id);
        broadcast("data:changed");
    });
}

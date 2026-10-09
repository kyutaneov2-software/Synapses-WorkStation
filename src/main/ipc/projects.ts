import { ipcMain } from "electron";
import db from "../db";
import { broadcast } from "../services/broadcast";
import type { Project } from "../../shared/types";
import { requireString, optionalString, requireNumber } from "./validate";

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
        (_, title: unknown, client: unknown): Project => {
            const cleanTitle = requireString(title, "title", 200);
            const cleanClient = optionalString(client, "client", 200) ?? "";
            const stmt = db.prepare(
                "INSERT INTO projects (title, client) VALUES (?, ?)",
            );
            const result = stmt.run(cleanTitle, cleanClient);
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
                    const v = updates[key];

                    if (
                        key === "title" ||
                        key === "client" ||
                        key === "type" ||
                        key === "brief" ||
                        key === "status"
                    ) {
                        values.push(optionalString(v, key, 2000));
                    } else if (key === "hourly_rate") {
                        values.push(v === null ? null : requireNumber(v, key));
                    } else if (key === "archived") {
                        values.push(typeof v === "number" ? v : 0);
                    } else {
                        values.push(optionalString(v, key, 20));
                    }
                    fields.push(`${key} = ?`);
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

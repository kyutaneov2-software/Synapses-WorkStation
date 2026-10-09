import { ipcMain } from "electron";
import db from "../db";
import { broadcast } from "../services/broadcast";
import type { ProjectPhase } from "../../shared/types";
import { requireString, requirePositiveId, requireNumber } from "./validate";

export function registerPhaseHandlers(): void {
    ipcMain.handle("db:get-phases", (_, projectId: number): ProjectPhase[] => {
        return db
            .prepare(
                `
            SELECT * FROM project_phases
            WHERE project_id = ?
            ORDER BY sort_order ASC, id ASC
          `,
            )
            .all(projectId) as ProjectPhase[];
    });

    ipcMain.handle(
        "db:create-phase",
        (
            _,
            projectId: unknown,
            name: unknown,
            amount: unknown,
        ): ProjectPhase => {
            const cleanProjectId = requirePositiveId(projectId, "projectId");
            const cleanName = requireString(name, "name", 500);
            const cleanAmount = requireNumber(amount, "amount");

            const project = db
                .prepare("SELECT currency FROM projects WHERE id = ?")
                .get(cleanProjectId) as { currency: string } | undefined;
            const currency = project?.currency ?? "USD";

            const maxOrder = db
                .prepare(
                    "SELECT COALESCE(MAX(sort_order), -1) as max FROM project_phases WHERE project_id = ?",
                )
                .get(cleanProjectId) as { max: number };

            const stmt = db.prepare(`
          INSERT INTO project_phases (project_id, name, amount, currency, sort_order)
          VALUES (?, ?, ?, ?, ?)
        `);
            const result = stmt.run(
                cleanProjectId,
                cleanName,
                cleanAmount,
                currency,
                maxOrder.max + 1,
            );
            const phase = db
                .prepare("SELECT * FROM project_phases WHERE id = ?")
                .get(result.lastInsertRowid) as ProjectPhase;
            broadcast("data:changed");
            return phase;
        },
    );

    ipcMain.handle(
        "db:update-phase",
        (_, id: number, updates: Partial<ProjectPhase>): ProjectPhase => {
            const allowed: (keyof ProjectPhase)[] = [
                "name",
                "amount",
                "paid",
                "paid_at",
                "sort_order",
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
                    `UPDATE project_phases SET ${fields.join(", ")} WHERE id = ?`,
                ).run(...values);
            }

            const phase = db
                .prepare("SELECT * FROM project_phases WHERE id = ?")
                .get(id) as ProjectPhase;
            broadcast("data:changed");
            return phase;
        },
    );

    ipcMain.handle("db:delete-phase", (_, id: number): void => {
        db.prepare("DELETE FROM project_phases WHERE id = ?").run(id);
        broadcast("data:changed");
    });
}

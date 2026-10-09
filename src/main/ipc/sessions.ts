import { ipcMain } from "electron";
import db from "../db";
import { broadcast } from "../services/broadcast";
import type { Session } from "../../shared/types";
import { optionalId } from "./validate";

export interface SessionTotals {
    totalSeconds: number;
    thisWeekSeconds: number;
    thisMonthSeconds: number;
    byProject: Record<number, number>;
    byTask: Record<number, number>;
}

function parseSqliteDate(s: string): number {
    // SQLite datetime('now') returns "YYYY-MM-DD HH:MM:SS" in UTC
    return new Date(s.replace(" ", "T") + "Z").getTime();
}

function sessionSeconds(row: {
    started_at: string;
    ended_at: string | null;
}): number {
    const start = parseSqliteDate(row.started_at);
    const end = row.ended_at ? parseSqliteDate(row.ended_at) : Date.now();
    return Math.max(0, Math.floor((end - start) / 1000));
}

export function registerSessionHandlers(): void {
    ipcMain.handle("session:start", (_, taskId: unknown): Session => {
        const cleanTaskId = optionalId(taskId, "taskId");
        db.prepare(
            `UPDATE sessions SET ended_at = datetime('now') WHERE ended_at IS NULL`,
        ).run();
        const result = db
            .prepare(
                `INSERT INTO sessions (task_id, started_at) VALUES (?, datetime('now'))`,
            )
            .run(cleanTaskId);
        const session = db
            .prepare("SELECT * FROM sessions WHERE id = ?")
            .get(result.lastInsertRowid) as Session;
        broadcast("data:changed");
        return session;
    });

    ipcMain.handle("session:stop", (): void => {
        db.prepare(
            `UPDATE sessions SET ended_at = datetime('now') WHERE ended_at IS NULL`,
        ).run();
        broadcast("data:changed");
    });

    ipcMain.handle("session:get-active", (): Session | null => {
        const session = db
            .prepare(
                "SELECT * FROM sessions WHERE ended_at IS NULL ORDER BY id DESC LIMIT 1",
            )
            .get() as Session | undefined;
        return session ?? null;
    });

    ipcMain.handle("session:get-totals", (): SessionTotals => {
        const rows = db
            .prepare(
                `
          SELECT
            s.started_at,
            s.ended_at,
            s.task_id,
            t.project_id
          FROM sessions s
          LEFT JOIN tasks t ON s.task_id = t.id
        `,
            )
            .all() as Array<{
            started_at: string;
            ended_at: string | null;
            task_id: number | null;
            project_id: number | null;
        }>;

        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        weekStart.setHours(0, 0, 0, 0);

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        let totalSeconds = 0;
        let thisWeekSeconds = 0;
        let thisMonthSeconds = 0;
        const byProject: Record<number, number> = {};
        const byTask: Record<number, number> = {};

        for (const row of rows) {
            const secs = sessionSeconds(row);
            const start = parseSqliteDate(row.started_at);
            const startDate = new Date(start);

            totalSeconds += secs;
            if (startDate >= weekStart) thisWeekSeconds += secs;
            if (startDate >= monthStart) thisMonthSeconds += secs;

            if (row.project_id !== null) {
                byProject[row.project_id] =
                    (byProject[row.project_id] ?? 0) + secs;
            }
            if (row.task_id !== null) {
                byTask[row.task_id] = (byTask[row.task_id] ?? 0) + secs;
            }
        }

        return {
            totalSeconds,
            thisWeekSeconds,
            thisMonthSeconds,
            byProject,
            byTask,
        };
    });
}

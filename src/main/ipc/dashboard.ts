import { ipcMain } from "electron";
import db from "../db";
import type {
    Project,
    Task,
    ProjectPhase,
    DashboardData,
} from "../../shared/types";

function parseSqliteDate(s: string): number {
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

export function registerDashboardHandlers(): void {
    ipcMain.handle("dashboard:get-data", (): DashboardData => {
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

        for (const row of rows) {
            const secs = sessionSeconds(row);
            const startDate = new Date(parseSqliteDate(row.started_at));

            totalSeconds += secs;
            if (startDate >= weekStart) thisWeekSeconds += secs;
            if (startDate >= monthStart) thisMonthSeconds += secs;

            if (row.project_id !== null) {
                byProject[row.project_id] =
                    (byProject[row.project_id] ?? 0) + secs;
            }
        }

        return {
            projects: db
                .prepare("SELECT * FROM projects WHERE archived = 0")
                .all() as Project[],
            tasks: db.prepare("SELECT * FROM tasks").all() as Task[],
            phases: db
                .prepare("SELECT * FROM project_phases")
                .all() as ProjectPhase[],
            sessionTotals: {
                totalSeconds,
                thisWeekSeconds,
                thisMonthSeconds,
                byProject,
            },
        };
    });
}

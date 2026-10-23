import { ipcMain } from 'electron'
import db from '../db'
import type { Project, Task, ProjectPhase, DashboardData } from '../../shared/types'
import { parseSqliteDate, sessionSeconds } from '../../shared/dates'

export function registerDashboardHandlers(): void {
    ipcMain.handle('dashboard:get-data', (): DashboardData => {
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
        `
            )
            .all() as Array<{
            started_at: string
            ended_at: string | null
            task_id: number | null
            project_id: number | null
        }>

        const now = new Date()
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)
        weekStart.setHours(0, 0, 0, 0)

        const prevWeekStart = new Date(weekStart)
        prevWeekStart.setDate(weekStart.getDate() - 7)

        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

        let totalSeconds = 0
        let thisWeekSeconds = 0
        let prevWeekSeconds = 0
        let thisMonthSeconds = 0
        const byProject: Record<number, number> = {}
        const byDay: Record<string, number> = {}

        for (const row of rows) {
            const secs = sessionSeconds(row)
            const startDate = parseSqliteDate(row.started_at)

            totalSeconds += secs
            if (startDate >= weekStart) thisWeekSeconds += secs
            else if (startDate >= prevWeekStart && startDate < weekStart) prevWeekSeconds += secs

            if (startDate >= monthStart) thisMonthSeconds += secs

            if (row.project_id !== null) {
                byProject[row.project_id] = (byProject[row.project_id] ?? 0) + secs
            }

            // Group by local YYYY-MM-DD
            const y = startDate.getFullYear()
            const m = String(startDate.getMonth() + 1).padStart(2, '0')
            const d = String(startDate.getDate()).padStart(2, '0')
            const dateStr = `${y}-${m}-${d}`
            byDay[dateStr] = (byDay[dateStr] ?? 0) + secs
        }

        // Generate the last 7 days array
        const last7Days: Array<{ date: string; seconds: number }> = []
        for (let i = 6; i >= 0; i--) {
            const d = new Date()
            d.setDate(d.getDate() - i)
            const y = d.getFullYear()
            const m = String(d.getMonth() + 1).padStart(2, '0')
            const day = String(d.getDate()).padStart(2, '0')
            const dateStr = `${y}-${m}-${day}`
            last7Days.push({ date: dateStr, seconds: byDay[dateStr] ?? 0 })
        }

        return {
            projects: db.prepare('SELECT * FROM projects WHERE archived = 0').all() as Project[],
            tasks: db.prepare('SELECT * FROM tasks').all() as Task[],
            phases: db.prepare('SELECT * FROM project_phases').all() as ProjectPhase[],
            sessionTotals: {
                totalSeconds,
                thisWeekSeconds,
                prevWeekSeconds,
                thisMonthSeconds,
                byProject,
                last7Days
            }
        }
    })
}

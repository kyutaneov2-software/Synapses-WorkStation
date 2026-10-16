import { Notification } from 'electron'
import schedule, { type Job } from 'node-schedule'
import db from '../db'
import type { Task, Project } from '../../shared/types'
import { todayStr } from '../../shared/dates'

interface DueItem {
    text: string
    projectTitle?: string
    isProject: boolean
}

let notificationsSupported: boolean | null = null

function canNotify(): boolean {
    if (notificationsSupported === null) {
        notificationsSupported = Notification.isSupported()
        if (!notificationsSupported) {
            console.warn(
                '[notifications] system does not support notifications — scheduled alerts will be skipped'
            )
        }
    }
    return notificationsSupported
}

function getDueToday(): DueItem[] {
    const today = todayStr()
    const items: DueItem[] = []

    const tasks = db
        .prepare(
            `
        SELECT t.*, p.title as project_title
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.due_date = ?
          AND t.done = 0
        ORDER BY t.priority DESC
      `
        )
        .all(today) as (Task & { project_title: string | null })[]

    for (const t of tasks) {
        items.push({
            text: t.text,
            projectTitle: t.project_title ?? undefined,
            isProject: false
        })
    }

    const projects = db
        .prepare(
            `
        SELECT * FROM projects
        WHERE due_date = ?
          AND status != 'completed'
          AND archived = 0
      `
        )
        .all(today) as Project[]

    for (const p of projects) {
        items.push({
            text: p.title,
            isProject: true
        })
    }

    return items
}

function getOverdue(): DueItem[] {
    const today = todayStr()
    const items: DueItem[] = []

    const tasks = db
        .prepare(
            `
        SELECT t.*, p.title as project_title
        FROM tasks t
        LEFT JOIN projects p ON t.project_id = p.id
        WHERE t.done = 0
          AND t.due_date IS NOT NULL
          AND t.due_date < ?
        ORDER BY t.due_date ASC
      `
        )
        .all(today) as (Task & { project_title: string | null })[]

    for (const t of tasks) {
        items.push({
            text: t.text,
            projectTitle: t.project_title ?? undefined,
            isProject: false
        })
    }

    const projects = db
        .prepare(
            `
        SELECT * FROM projects
        WHERE due_date IS NOT NULL
          AND due_date < ?
          AND status != 'completed'
          AND archived = 0
        ORDER BY due_date ASC
      `
        )
        .all(today) as Project[]

    for (const p of projects) {
        items.push({
            text: p.title,
            isProject: true
        })
    }

    return items
}

function showDeadlineNotification(): void {
    if (!canNotify()) return
    const items = getDueToday()

    if (items.length === 0) {
        console.log('[notifications] Nothing due today. Skipping morning notice.')
        return
    }

    if (items.length === 1) {
        const item = items[0]
        new Notification({
            title: item.isProject ? 'Project due today' : 'Task due today',
            body: item.projectTitle ? `${item.text} — ${item.projectTitle}` : item.text
        }).show()
        return
    }

    const preview = items
        .slice(0, 3)
        .map((i) => `- ${i.text}`)
        .join('\n')
    const more = items.length > 3 ? `\nand ${items.length - 3} more` : ''

    new Notification({
        title: `${items.length} things due today`,
        body: `${preview}${more}`
    }).show()
}

function showOverdueNotification(): void {
    if (!canNotify()) return

    const items = getOverdue()

    if (items.length === 0) {
        console.log('[notifications] Nothing overdue. Skipping evening notice.')
        return
    }

    if (items.length === 1) {
        const item = items[0]
        new Notification({
            title: item.isProject ? 'Project overdue' : 'Task overdue',
            body: item.projectTitle ? `${item.text} — ${item.projectTitle}` : item.text
        }).show()
        return
    }

    const taskCount = items.filter((i) => !i.isProject).length
    const projectCount = items.filter((i) => i.isProject).length
    const summary =
        projectCount === 0
            ? `${taskCount} tasks overdue`
            : taskCount === 0
              ? `${projectCount} project${projectCount === 1 ? '' : 's'} overdue`
              : `${taskCount} task${taskCount === 1 ? '' : 's'} and ${projectCount} project${projectCount === 1 ? '' : 's'} overdue`

    new Notification({
        title: summary,
        body: 'Open Synapses WorkStation to see what slipped.'
    }).show()
}

let morningJob: Job | null = null
let eveningJob: Job | null = null

export function startNotificationScheduler(): void {
    if (morningJob || eveningJob) {
        console.warn('[notifications] scheduler already started, skipping')
        return
    }

    morningJob = schedule.scheduleJob('0 8 * * *', () => {
        console.log('[notifications] Morning deadline check running...')
        showDeadlineNotification()
    })

    eveningJob = schedule.scheduleJob('0 17 * * *', () => {
        console.log('[notifications] Evening overdue check running...')
        showOverdueNotification()
    })

    console.log('[notifications] Scheduler started (8 AM + 5 PM local time)')
}

export function stopNotificationScheduler(): void {
    morningJob?.cancel()
    eveningJob?.cancel()
    morningJob = null
    eveningJob = null
    console.log('[notifications] Scheduler stopped')
}

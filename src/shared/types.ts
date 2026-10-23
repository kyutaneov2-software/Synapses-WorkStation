import type { ProjectType, ProjectStatus, CurrencyCode } from './constants'
export type { ProjectType, ProjectStatus, CurrencyCode } from './constants'

export interface ReferenceLink {
    label: string
    url: string
}

export interface Tag {
    id: number
    name: string
    color: string | null
}

export interface Project {
    id: number
    title: string
    client: string | null
    type: ProjectType | null
    brief: string | null
    status: ProjectStatus
    start_date: string | null
    due_date: string | null
    hourly_rate_cents: number | null
    currency: CurrencyCode
    created_at: string
    archived: 0 | 1
    client_contact: string | null
    tech_stack: string[] | null
    reference_links: ReferenceLink[] | null
}

export interface Task {
    id: number
    project_id: number | null
    text: string
    done: 0 | 1
    priority: number
    due_date: string | null
    planned_for: string | null
    created_at: string
    completed_at: string | null
    is_current: 0 | 1
}

export interface ProjectPhase {
    id: number
    project_id: number
    name: string
    amount_cents: number
    currency: CurrencyCode
    paid: 0 | 1
    paid_at: string | null
    sort_order: number
}

export interface Attachment {
    id: number
    project_id: number
    filename: string
    original_name: string
    mime_type: string | null
    size: number | null
    created_at: string
}

export interface Session {
    id: number
    task_id: number | null
    started_at: string
    ended_at: string | null
}

export interface NewTaskOptions {
    projectId: number | null
    plannedFor: string | null
    dueDate: string | null
    priority: number
}

// ── Update payload types ──────────────────────────────────
// These mirror the allowlists in each IPC handler. If you add a
// column to a table and want it editable, add it here AND in the
// handler's `allowed` array.

export interface TaskUpdate {
    text?: string
    planned_for?: string | null
    due_date?: string | null
    priority?: number
    project_id?: number | null
}

export interface ProjectUpdate {
    title?: string
    client?: string | null
    type?: ProjectType | null
    brief?: string | null
    status?: ProjectStatus
    start_date?: string | null
    due_date?: string | null
    hourly_rate_cents?: number | null
    currency?: CurrencyCode
    archived?: 0 | 1
    client_contact?: string | null
    tech_stack?: string[] | null
    reference_links?: ReferenceLink[] | null
}

export interface PhaseUpdate {
    name?: string
    amount_cents?: number
    paid?: 0 | 1
    paid_at?: string | null
    sort_order?: number
}

export interface NoteUpdate {
    title?: string
    body?: string
    topics?: string[] | null
    project_id?: number | null
    pinned?: 0 | 1
}

// ── Dashboard / aggregates ────────────────────────────────

export interface DashboardData {
    projects: Project[]
    tasks: Task[]
    phases: ProjectPhase[]
    sessionTotals: {
        totalSeconds: number
        thisWeekSeconds: number
        prevWeekSeconds: number
        thisMonthSeconds: number
        byProject: Record<number, number>
        last7Days: Array<{ date: string; seconds: number }>
    }
}
export interface SessionTotals {
    totalSeconds: number
    thisWeekSeconds: number
    thisMonthSeconds: number
    byProject: Record<number, number>
    byTask: Record<number, number>
}

export interface Note {
    id: number
    title: string
    body: string
    topics: string[] | null
    project_id: number | null
    pinned: 0 | 1
    created_at: string
    updated_at: string
}

/** Lightweight row for the sidebar list — body is truncated to a preview. */
export interface NoteSummary {
    id: number
    title: string
    preview: string
    project_id: number | null
    pinned: 0 | 1
    created_at: string
    updated_at: string
}

// ── Schedule ──────────────────────────────────────────────
export type EventType = 'task' | 'meeting' | 'reminder'
export interface ScheduleBlock {
    id: number
    task_id: number | null
    title: string | null
    event_type: EventType
    start_at: string
    end_at: string
    created_at: string
}
export interface ScheduleBlockWithTask extends ScheduleBlock {
    task_text: string | null
    task_done: 0 | 1 | null
    task_project_id: number | null
    task_project_title: string | null
}

export interface ScheduleBlockInput {
    taskId: number | null
    title: string | null
    eventType: EventType
    startAt: string
    endAt: string
}
// Add this near your other types
export type GoalType = 'add_it_up' | 'everyday' | 'challenge' | 'daily_target'

export interface Goal {
    id: number
    title: string
    description: string | null
    type: GoalType
    target_value: number
    target_unit: string | null
    created_at: string
    archived: 0 | 1
    // Calculated fields from the backend
    current_value: number
    progress: number
    today_value: number
}

export interface Project {
    id: number;
    title: string;
    client: string | null;
    type: string | null;
    brief: string | null;
    status: string;
    start_date: string | null;
    due_date: string | null;
    hourly_rate: number | null;
    currency: string;
    created_at: string;
    archived: number;
}

export interface Task {
    id: number;
    project_id: number | null;
    text: string;
    done: number;
    priority: number;
    due_date: string | null;
    planned_for: string | null;
    created_at: string;
    completed_at: string | null;
    is_current: number;
}

export interface ProjectPhase {
    id: number;
    project_id: number;
    name: string;
    amount: number;
    currency: string;
    paid: number;
    paid_at: string | null;
    sort_order: number;
}

export interface Attachment {
    id: number;
    project_id: number;
    filename: string;
    original_name: string;
    mime_type: string | null;
    size: number | null;
    created_at: string;
}

export interface Session {
    id: number;
    task_id: number | null;
    started_at: string;
    ended_at: string | null;
}

export interface DashboardData {
    projects: Project[];
    tasks: Task[];
    phases: ProjectPhase[];
}

export interface NewTaskOptions {
    projectId: number | null;
    plannedFor: string | null;
    dueDate: string | null;
    priority: number;
}

export interface DashboardData {
    projects: Project[];
    tasks: Task[];
    phases: ProjectPhase[];
    sessionTotals: {
        totalSeconds: number;
        thisWeekSeconds: number;
        thisMonthSeconds: number;
        byProject: Record<number, number>;
    };
}

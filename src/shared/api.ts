import type {
    Project,
    ProjectUpdate,
    Task,
    TaskUpdate,
    ProjectPhase,
    PhaseUpdate,
    Session,
    DashboardData,
    SessionTotals,
    Tag,
    Note,
    NoteSummary,
    NoteUpdate,
    Goal,
    GoalType
} from './types'
import type { ScheduleBlock, ScheduleBlockWithTask, ScheduleBlockInput } from './types'

export interface SynapsesAPI {
    getProjects: () => Promise<Project[]>
    getProject: (id: number) => Promise<Project | null>
    createProject: (title: string, client: string) => Promise<Project>
    updateProject: (id: number, updates: ProjectUpdate) => Promise<Project>
    deleteProject: (id: number) => Promise<void>

    getTasks: () => Promise<Task[]>
    getTasksByView: (view: 'today' | 'tomorrow' | 'all') => Promise<Task[]>
    getTasksByProject: (projectId: number) => Promise<Task[]>
    createTask: (
        text: string,
        projectId: number | null,
        plannedFor: string | null,
        dueDate: string | null,
        priority: number
    ) => Promise<Task>
    toggleTask: (id: number, done: boolean) => Promise<Task>
    updateTask: (id: number, updates: TaskUpdate) => Promise<Task>
    deleteTask: (id: number) => Promise<void>

    getPhases: (projectId: number) => Promise<ProjectPhase[]>
    createPhase: (projectId: number, name: string, amountCents: number) => Promise<ProjectPhase>
    updatePhase: (id: number, updates: PhaseUpdate) => Promise<ProjectPhase>
    deletePhase: (id: number) => Promise<void>

    // Tags
    getTags: () => Promise<Tag[]>
    getProjectTags: (projectId: number) => Promise<Tag[]>
    setProjectTags: (projectId: number, tagNames: string[]) => Promise<Tag[]>

    focusToggle: () => Promise<void>
    focusGetCurrent: () => Promise<Task | null>
    focusComplete: (taskId: number) => Promise<Task | null>
    focusQuickAddTomorrow: (text: string) => Promise<void>
    focusPinTask: (taskId: number | null) => Promise<void>

    startSession: (taskId: number | null) => Promise<Session>
    stopSession: () => Promise<void>
    getActiveSession: () => Promise<Session | null>
    getSessionTotals: () => Promise<SessionTotals>

    healthCheck: () => Promise<{ alive: number }>
    testNotification: () => Promise<void>
    getDashboardData: () => Promise<DashboardData>

    onDataChanged: (callback: () => void) => () => void

    // Notes
    getNotes: () => Promise<NoteSummary[]>
    getNotesByProject: (projectId: number) => Promise<NoteSummary[]>
    getNote: (id: number) => Promise<Note>
    createNote: (title: string, projectId: number | null) => Promise<Note>
    updateNote: (id: number, updates: NoteUpdate) => Promise<Note>
    deleteNote: (id: number) => Promise<void>

    // Schedule
    getScheduleRange: (fromDate: string, toDate: string) => Promise<ScheduleBlockWithTask[]>
    createBlock: (input: ScheduleBlockInput) => Promise<ScheduleBlock>
    updateBlock: (id: number, input: ScheduleBlockInput) => Promise<ScheduleBlock>
    deleteBlock: (id: number) => Promise<void>

    // Goals
    getGoals: () => Promise<Goal[]>
    createGoal: (
        title: string,
        description: string | null,
        type: GoalType,
        targetValue: number,
        unit: string | null
    ) => Promise<Goal>
    logGoal: (goalId: number, value: number, date: string) => Promise<void>
    deleteGoal: (id: number) => Promise<void>
}

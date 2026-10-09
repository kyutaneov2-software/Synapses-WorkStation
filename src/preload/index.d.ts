import { ElectronAPI } from "@electron-toolkit/preload";
import {
    Project,
    Task,
    ProjectPhase,
    DashboardData,
    Session,
} from "../shared/types";

export interface SessionTotals {
    totalSeconds: number;
    thisWeekSeconds: number;
    thisMonthSeconds: number;
    byProject: Record<number, number>;
    byTask: Record<number, number>;
}

export interface SynapsesAPI {
    getProjects: () => Promise<Project[]>;
    createProject: (title: string, client: string) => Promise<Project>;
    updateProject: (
        id: number,
        updates: Record<string, unknown>,
    ) => Promise<Project>;
    deleteProject: (id: number) => Promise<void>;

    getTasks: () => Promise<Task[]>;
    getTasksByView: (view: "today" | "tomorrow" | "all") => Promise<Task[]>;
    getTasksByProject: (projectId: number) => Promise<Task[]>;
    createTask: (
        text: string,
        projectId: number | null,
        plannedFor: string | null,
        dueDate: string | null,
        priority: number,
    ) => Promise<Task>;
    toggleTask: (id: number, done: boolean) => Promise<Task>;
    updateTask: (id: number, updates: Record<string, unknown>) => Promise<Task>;
    deleteTask: (id: number) => Promise<void>;

    getPhases: (projectId: number) => Promise<ProjectPhase[]>;
    createPhase: (
        projectId: number,
        name: string,
        amount: number,
    ) => Promise<ProjectPhase>;
    updatePhase: (
        id: number,
        updates: Record<string, unknown>,
    ) => Promise<ProjectPhase>;
    deletePhase: (id: number) => Promise<void>;

    focusToggle: () => Promise<void>;
    focusGetCurrent: () => Promise<Task | null>;
    focusComplete: (taskId: number) => Promise<Task | null>;
    focusQuickAddTomorrow: (text: string) => Promise<void>;

    startSession: (taskId: number | null) => Promise<Session>;
    stopSession: () => Promise<void>;
    getActiveSession: () => Promise<Session | null>;
    getSessionTotals: () => Promise<SessionTotals>;

    healthCheck: () => Promise<{ alive: number }>;
    getDashboardData: () => Promise<DashboardData>;

    onDataChanged: (callback: () => void) => () => void;
}

declare global {
    interface Window {
        electron: ElectronAPI;
        api: SynapsesAPI;
    }
}

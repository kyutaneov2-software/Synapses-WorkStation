import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import type { SynapsesAPI } from '../shared/api'

const api: SynapsesAPI = {
    // Projects
    getProjects: () => ipcRenderer.invoke('db:get-projects'),
    getProject: (id: number) => ipcRenderer.invoke('db:get-project', id),
    createProject: (title: string, client: string) =>
        ipcRenderer.invoke('db:create-project', title, client),
    updateProject: (id: number, updates: Record<string, unknown>) =>
        ipcRenderer.invoke('db:update-project', id, updates),
    deleteProject: (id: number) => ipcRenderer.invoke('db:delete-project', id),

    // Tasks
    getTasks: () => ipcRenderer.invoke('db:get-tasks'),
    getTasksByView: (view: 'today' | 'tomorrow' | 'all') =>
        ipcRenderer.invoke('db:get-tasks-by-view', view),
    getTasksByProject: (projectId: number) =>
        ipcRenderer.invoke('db:get-tasks-by-project', projectId),
    createTask: (
        text: string,
        projectId: number | null,
        plannedFor: string | null,
        dueDate: string | null,
        priority: number
    ) => ipcRenderer.invoke('db:create-task', text, projectId, plannedFor, dueDate, priority),
    toggleTask: (id: number, done: boolean) => ipcRenderer.invoke('db:toggle-task', id, done),
    updateTask: (id: number, updates: Record<string, unknown>) =>
        ipcRenderer.invoke('db:update-task', id, updates),
    deleteTask: (id: number) => ipcRenderer.invoke('db:delete-task', id),

    // Phases
    getPhases: (projectId: number) => ipcRenderer.invoke('db:get-phases', projectId),
    createPhase: (projectId: number, name: string, amountCents: number) =>
        ipcRenderer.invoke('db:create-phase', projectId, name, amountCents),
    updatePhase: (id: number, updates: Record<string, unknown>) =>
        ipcRenderer.invoke('db:update-phase', id, updates),
    deletePhase: (id: number) => ipcRenderer.invoke('db:delete-phase', id),

    // Tags
    getTags: () => ipcRenderer.invoke('db:get-tags'),
    getProjectTags: (projectId: number) => ipcRenderer.invoke('db:get-project-tags', projectId),
    setProjectTags: (projectId: number, tagNames: string[]) =>
        ipcRenderer.invoke('db:set-project-tags', projectId, tagNames),

    // Notes
    // Notes
    getNotes: () => ipcRenderer.invoke('db:get-notes'),
    getNotesByProject: (projectId: number) =>
        ipcRenderer.invoke('db:get-notes-by-project', projectId),
    getNote: (id: number) => ipcRenderer.invoke('db:get-note', id),
    createNote: (title: string, projectId: number | null) =>
        ipcRenderer.invoke('db:create-note', title, projectId),
    updateNote: (id: number, updates: Record<string, unknown>) =>
        ipcRenderer.invoke('db:update-note', id, updates),
    deleteNote: (id: number) => ipcRenderer.invoke('db:delete-note', id),

    // Focus window
    focusToggle: () => ipcRenderer.invoke('focus:toggle'),
    focusGetCurrent: () => ipcRenderer.invoke('focus:get-current'),
    focusComplete: (taskId: number) => ipcRenderer.invoke('focus:complete', taskId),
    focusQuickAddTomorrow: (text: string) => ipcRenderer.invoke('focus:quick-add-tomorrow', text),
    focusPinTask: (taskId: number | null) => ipcRenderer.invoke('focus:pin-task', taskId),

    // Sessions
    startSession: (taskId: number | null) => ipcRenderer.invoke('session:start', taskId),
    stopSession: () => ipcRenderer.invoke('session:stop'),
    getActiveSession: () => ipcRenderer.invoke('session:get-active'),
    getSessionTotals: () => ipcRenderer.invoke('session:get-totals'),

    // System
    healthCheck: () => ipcRenderer.invoke('db:health-check'),
    testNotification: () => ipcRenderer.invoke('system:test-notification'),
    getDashboardData: () => ipcRenderer.invoke('dashboard:get-data'),

    // Cross-window event subscription
    onDataChanged: (callback: () => void): (() => void) => {
        const listener = (): void => callback()
        ipcRenderer.on('data:changed', listener)
        return () => {
            ipcRenderer.removeListener('data:changed', listener)
        }
    }
}

if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}

import { useCallback, useEffect, useRef } from 'react'
import type { Task } from '../../../../shared/types'

export interface TaskActions {
    onToggle: (id: number, done: boolean) => Promise<void>
    onDelete: (id: number) => Promise<void>
    onSetDueDate: (id: number, date: string | null) => Promise<void>
    onSetPriority: (id: number, priority: number) => Promise<void>
    onSetText: (id: number, text: string) => Promise<void>
    onPin: (id: number) => Promise<void>
}

/**
 * Bundle of the six IPC mutations every view needs when rendering TaskItem.
 *
 * Takes the current task list because `onPin` needs it to decide whether to
 * pin or unpin a given task. The reference is kept fresh via a ref so the
 * returned callbacks stay identity-stable across renders.
 */
export function useTaskActions(tasks: Task[]): TaskActions {
    const tasksRef = useRef(tasks)

    useEffect(() => {
        tasksRef.current = tasks
    }, [tasks])

    const onToggle = useCallback(async (id: number, done: boolean): Promise<void> => {
        await window.api.toggleTask(id, done)
    }, [])

    const onDelete = useCallback(async (id: number): Promise<void> => {
        await window.api.deleteTask(id)
    }, [])

    const onSetDueDate = useCallback(async (id: number, date: string | null): Promise<void> => {
        await window.api.updateTask(id, { due_date: date })
    }, [])

    const onSetPriority = useCallback(async (id: number, priority: number): Promise<void> => {
        await window.api.updateTask(id, { priority })
    }, [])

    const onSetText = useCallback(async (id: number, text: string): Promise<void> => {
        await window.api.updateTask(id, { text })
    }, [])

    const onPin = useCallback(async (id: number): Promise<void> => {
        const task = tasksRef.current.find((t) => t.id === id)
        const isCurrentlyPinned = task?.is_current === 1
        await window.api.focusPinTask(isCurrentlyPinned ? null : id)
    }, [])

    return { onToggle, onDelete, onSetDueDate, onSetPriority, onSetText, onPin }
}

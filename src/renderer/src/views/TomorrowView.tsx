import type { NewTaskOptions } from '../../../shared/types'
import { useProjects, useTasksByView } from '../lib/hooks'
import { TaskItem } from '../components/tasks/TaskItem'
import { QuickAdd } from '../components/common/QuickAdd'
import { tomorrowStr } from '../lib/dates'

export function TomorrowView(): React.JSX.Element {
    const { tasks, loading } = useTasksByView('tomorrow')
    const { projects } = useProjects()

    const handleAdd = async (text: string, options: NewTaskOptions): Promise<void> => {
        await window.api.createTask(
            text,
            options.projectId,
            tomorrowStr(),
            options.dueDate,
            options.priority
        )
    }

    const handleToggle = async (id: number, done: boolean): Promise<void> => {
        await window.api.toggleTask(id, done)
    }

    const handleDelete = async (id: number): Promise<void> => {
        await window.api.deleteTask(id)
    }

    const handleSetDueDate = async (id: number, date: string | null): Promise<void> => {
        await window.api.updateTask(id, { due_date: date })
    }

    const handleSetPriority = async (id: number, priority: number): Promise<void> => {
        await window.api.updateTask(id, { priority })
    }

    const handleSetText = async (id: number, text: string): Promise<void> => {
        await window.api.updateTask(id, { text })
    }

    const handlePin = async (id: number): Promise<void> => {
        const task = tasks.find((t) => t.id === id)
        const isCurrentlyPinned = task?.is_current === 1
        await window.api.focusPinTask(isCurrentlyPinned ? null : id)
    }

    const projectById = new Map(projects.map((p) => [p.id, p]))

    if (loading)
        return (
            <div className="view">
                <p>Loading…</p>
            </div>
        )

    return (
        <div className="view">
            <div className="view-header">
                <h2>Tomorrow</h2>
                <span className="view-count">
                    {tasks.length} task{tasks.length === 1 ? '' : 's'}
                </span>
            </div>

            <QuickAdd
                onAdd={handleAdd}
                placeholder="Plan something for tomorrow…"
                projects={projects}
                hidePlannedFor
            />

            {tasks.map((t) => (
                <TaskItem
                    key={t.id}
                    task={t}
                    project={t.project_id ? projectById.get(t.project_id) : undefined}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onSetDueDate={handleSetDueDate}
                    onSetPriority={handleSetPriority}
                    onSetText={handleSetText}
                    onPin={handlePin}
                />
            ))}

            {tasks.length === 0 && (
                <div className="empty-state">
                    <p>Tomorrow is a blank slate. Add something to plan ahead.</p>
                </div>
            )}
        </div>
    )
}

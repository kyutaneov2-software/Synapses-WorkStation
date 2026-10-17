import type { NewTaskOptions } from '../../../shared/types'
import { useProjects, useTasksByView, useTaskActions } from '../lib/hooks'
import { TaskItem } from '../components/tasks/TaskItem'
import { QuickAdd } from '../components/common/QuickAdd'
import { tomorrowStr } from '../lib/dates'

export function TomorrowView(): React.JSX.Element {
    const { tasks, loading } = useTasksByView('tomorrow')
    const { projects } = useProjects()
    const actions = useTaskActions(tasks)

    const handleAdd = async (text: string, options: NewTaskOptions): Promise<void> => {
        await window.api.createTask(
            text,
            options.projectId,
            tomorrowStr(),
            options.dueDate,
            options.priority
        )
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
                    {...actions}
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

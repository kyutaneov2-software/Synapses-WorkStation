import { AnimatePresence } from 'framer-motion'
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

    if (loading) {
        return (
            <div className="task-column-body">
                <p className="empty-state">Loading…</p>
            </div>
        )
    }

    return (
        <div className="task-column-body">
            <div className="task-column-header">
                <h2>Tomorrow</h2>
                <span className="task-column-count" data-tabular>
                    {tasks.length}
                </span>
            </div>

            <QuickAdd
                onAdd={handleAdd}
                placeholder="Plan something for tomorrow…"
                projects={projects}
                hidePlannedFor
            />

            <div className="task-scroll-area">
                <AnimatePresence mode="popLayout">
                    {tasks.map((t) => (
                        <TaskItem
                            key={t.id}
                            task={t}
                            project={t.project_id ? projectById.get(t.project_id) : undefined}
                            {...actions}
                        />
                    ))}
                </AnimatePresence>

                {tasks.length === 0 && (
                    <div className="empty-state-mini">
                        <p>Tomorrow is a blank slate. Add something to plan ahead.</p>
                    </div>
                )}
            </div>
        </div>
    )
}

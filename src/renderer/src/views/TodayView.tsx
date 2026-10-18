import { AnimatePresence } from 'framer-motion'
import { useProjects, useTasksByView, useTaskActions } from '../lib/hooks'
import type { NewTaskOptions } from '../../../shared/types'
import { TaskItem } from '../components/tasks/TaskItem'
import { QuickAdd } from '../components/common/QuickAdd'
import { isOverdue, todayStr } from '../lib/dates'

export function TodayView(): React.JSX.Element {
    const { tasks, loading } = useTasksByView('today')
    const { projects } = useProjects()
    const actions = useTaskActions(tasks)

    const handleAdd = async (text: string, options: NewTaskOptions): Promise<void> => {
        await window.api.createTask(
            text,
            options.projectId,
            todayStr(),
            options.dueDate,
            options.priority
        )
    }

    const overdue = tasks.filter((t) => isOverdue(t.due_date))
    const regular = tasks.filter((t) => !isOverdue(t.due_date))
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
                <h2>Today</h2>
                <span className="view-count">
                    {tasks.length} task{tasks.length === 1 ? '' : 's'}
                </span>
            </div>

            <QuickAdd
                onAdd={handleAdd}
                placeholder="Add a task for today…"
                projects={projects}
                hidePlannedFor
            />

            {overdue.length > 0 && (
                <section className="task-group">
                    <h3 className="group-title overdue-title">Overdue</h3>
                    <AnimatePresence mode="popLayout">
                        {overdue.map((t) => (
                            <TaskItem
                                key={t.id}
                                task={t}
                                project={t.project_id ? projectById.get(t.project_id) : undefined}
                                {...actions}
                            />
                        ))}
                    </AnimatePresence>
                </section>
            )}

            {regular.length > 0 && (
                <section className="task-group">
                    {overdue.length > 0 && <h3 className="group-title">Today</h3>}
                    <AnimatePresence mode="popLayout">
                        {regular.map((t) => (
                            <TaskItem
                                key={t.id}
                                task={t}
                                project={t.project_id ? projectById.get(t.project_id) : undefined}
                                {...actions}
                            />
                        ))}
                    </AnimatePresence>
                </section>
            )}

            {tasks.length === 0 && (
                <div className="empty-state">
                    <p>{"Nothing on today's plate. Enjoy it while it lasts."}</p>
                </div>
            )}
        </div>
    )
}

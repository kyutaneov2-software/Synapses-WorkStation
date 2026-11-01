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
                <h2>Today</h2>
                <span className="task-column-count" data-tabular>
                    {tasks.length}
                </span>
            </div>

            <QuickAdd
                onAdd={handleAdd}
                placeholder="Add a task for today…"
                projects={projects}
                hidePlannedFor
            />

            <div className="task-scroll-area">
                {overdue.length > 0 && (
                    <section className="task-group">
                        <h3 className="group-title overdue-title">Overdue</h3>
                        <AnimatePresence mode="popLayout">
                            {overdue.map((t) => (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    project={
                                        t.project_id ? projectById.get(t.project_id) : undefined
                                    }
                                    {...actions}
                                />
                            ))}
                        </AnimatePresence>
                    </section>
                )}

                {regular.length > 0 && (
                    <section className="task-group">
                        {overdue.length > 0 && <h3 className="group-title">Scheduled</h3>}
                        <AnimatePresence mode="popLayout">
                            {regular.map((t) => (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    project={
                                        t.project_id ? projectById.get(t.project_id) : undefined
                                    }
                                    {...actions}
                                />
                            ))}
                        </AnimatePresence>
                    </section>
                )}

                {tasks.length === 0 && (
                    <div className="empty-state-mini">
                        <p>{"Nothing on today's plate. Enjoy it while it lasts."}</p>
                    </div>
                )}
            </div>
        </div>
    )
}

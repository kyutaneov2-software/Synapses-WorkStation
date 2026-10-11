import { useState } from 'react'
import { Settings } from 'lucide-react'
import type { Project, NewTaskOptions } from '../../../shared/types'
import { usePhases, useProjects, useTasksByProject } from '../lib/hooks'
import { TaskItem } from '../components/tasks/TaskItem'
import { QuickAdd } from '../components/common/QuickAdd'
import { PhaseList } from '../components/phases/PhaseList'
import { EditableText } from '../components/common/EditableText'
import { ProjectEditModal } from '../components/projects/ProjectEditModal'
import { todayStr } from '../lib/dates'
import { CURRENCY_SYMBOLS } from '../../../shared/constants'

interface ProjectDetailViewProps {
    projectId: number
    onDeleted: () => void
}

type Tab = 'tasks' | 'phases' | 'attachments'

export function ProjectDetailView({
    projectId,
    onDeleted
}: ProjectDetailViewProps): React.JSX.Element {
    const { projects, loading: projectsLoading } = useProjects()
    const { tasks, loading: tasksLoading } = useTasksByProject(projectId)
    const { phases, loading: phasesLoading } = usePhases(projectId)

    const [activeTab, setActiveTab] = useState<Tab>('tasks')
    const [showEdit, setShowEdit] = useState(false)

    const loading = projectsLoading || tasksLoading || phasesLoading
    const project = projects.find((p) => p.id === projectId) ?? null

    const handleAddTask = async (text: string, options: NewTaskOptions): Promise<void> => {
        await window.api.createTask(text, projectId, todayStr(), options.dueDate, options.priority)
    }

    const handleToggleTask = async (id: number, done: boolean): Promise<void> => {
        await window.api.toggleTask(id, done)
    }

    const handleDeleteTask = async (id: number): Promise<void> => {
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

    const handleAddPhase = async (name: string, amount: number): Promise<void> => {
        await window.api.createPhase(projectId, name, amount)
    }

    const handleUpdatePhase = async (
        id: number,
        updates: Record<string, unknown>
    ): Promise<void> => {
        await window.api.updatePhase(id, updates)
    }

    const handleDeletePhase = async (id: number): Promise<void> => {
        await window.api.deletePhase(id)
    }

    const handleUpdateProject = async (updates: Partial<Project>): Promise<void> => {
        await window.api.updateProject(projectId, updates)
    }

    const handleDeleteProject = async (): Promise<void> => {
        await window.api.deleteProject(projectId)
        onDeleted()
    }

    if (loading)
        return (
            <div className="view">
                <p>Loading…</p>
            </div>
        )
    if (!project)
        return (
            <div className="view">
                <p>Project not found.</p>
            </div>
        )

    const total = phases.reduce((sum, p) => sum + (p.amount || 0), 0)
    const paid = phases.filter((p) => p.paid).reduce((sum, p) => sum + (p.amount || 0), 0)
    const remaining = total - paid
    const currency = project.currency || 'USD'
    const symbol = CURRENCY_SYMBOLS[currency] || currency

    const moneySummary = total > 0 && (
        <div className="money-summary">
            <span className="money-paid">
                {symbol}
                {paid.toLocaleString()}
            </span>
            <span className="money-sep">/</span>
            <span className="money-total">
                {symbol}
                {total.toLocaleString()}
            </span>
            <span className="money-dot">·</span>
            <span className={`money-remaining ${remaining > 0 ? 'owed' : 'clear'}`}>
                {symbol}
                {remaining.toLocaleString()} {remaining > 0 ? 'remaining' : 'paid in full'}
            </span>
            <span className="money-currency">{currency}</span>
        </div>
    )

    const openTasks = tasks.filter((t) => !t.done)
    const doneTasks = tasks.filter((t) => t.done)

    return (
        <div className="view project-detail">
            <div className="view-header">
                <div className="project-title-block">
                    <EditableText
                        value={project.title}
                        onSave={(newTitle) => handleUpdateProject({ title: newTitle })}
                        className="project-title-edit"
                        inputClassName="project-title-input"
                    />
                    <EditableText
                        value={project.client ?? ''}
                        onSave={(newClient) => handleUpdateProject({ client: newClient || null })}
                        placeholder="+ add client"
                        className="project-client-label"
                        inputClassName="project-client-input"
                        allowEmpty
                    />
                    <EditableText
                        value={project.brief ?? ''}
                        onSave={(newBrief) => handleUpdateProject({ brief: newBrief || null })}
                        placeholder="+ add a brief description"
                        className="project-brief"
                        inputClassName="project-brief-input"
                        multiline
                        allowEmpty
                    />
                </div>
                <div className="header-right">
                    {moneySummary}
                    <button
                        className="edit-project-btn"
                        onClick={() => setShowEdit(true)}
                        title="Edit project details"
                    >
                        <Settings size={15} strokeWidth={2} />
                    </button>
                </div>
            </div>

            {showEdit && (
                <ProjectEditModal
                    project={project}
                    onSave={handleUpdateProject}
                    onDelete={handleDeleteProject}
                    onClose={() => setShowEdit(false)}
                />
            )}

            <div className="tabs">
                <button
                    className={activeTab === 'tasks' ? 'active' : ''}
                    onClick={() => setActiveTab('tasks')}
                >
                    Tasks ({tasks.length})
                </button>
                <button
                    className={activeTab === 'phases' ? 'active' : ''}
                    onClick={() => setActiveTab('phases')}
                >
                    Payments ({phases.length})
                </button>
                <button
                    className={activeTab === 'attachments' ? 'active' : ''}
                    onClick={() => setActiveTab('attachments')}
                >
                    Attachments
                </button>
            </div>

            {activeTab === 'tasks' && (
                <div className="tab-content">
                    <QuickAdd
                        onAdd={handleAddTask}
                        placeholder="Add a task to this project…"
                        projects={[]}
                        hideProject
                        hidePlannedFor
                    />

                    {openTasks.length > 0 && (
                        <section className="task-group">
                            {openTasks.map((t) => (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    onToggle={handleToggleTask}
                                    onDelete={handleDeleteTask}
                                    onSetDueDate={handleSetDueDate}
                                    onSetPriority={handleSetPriority}
                                    onSetText={handleSetText}
                                    onPin={handlePin}
                                />
                            ))}
                        </section>
                    )}

                    {doneTasks.length > 0 && (
                        <section className="task-group">
                            <h3 className="group-title">Completed</h3>
                            {doneTasks.map((t) => (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    onToggle={handleToggleTask}
                                    onDelete={handleDeleteTask}
                                    onSetDueDate={handleSetDueDate}
                                    onSetPriority={handleSetPriority}
                                    onSetText={handleSetText}
                                    onPin={handlePin}
                                />
                            ))}
                        </section>
                    )}

                    {tasks.length === 0 && (
                        <div className="empty-state">
                            <p>No tasks yet. Add the first one above.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'phases' && (
                <div className="tab-content">
                    <PhaseList
                        phases={phases}
                        currency={currency}
                        onAdd={handleAddPhase}
                        onUpdate={handleUpdatePhase}
                        onDelete={handleDeletePhase}
                    />
                </div>
            )}

            {activeTab === 'attachments' && (
                <div className="tab-content">
                    <div className="empty-state">
                        <p>Attachments coming in Phase 5.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

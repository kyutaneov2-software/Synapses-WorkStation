import { useState } from 'react'
import { Settings, ExternalLink } from 'lucide-react'
import type { Project, NewTaskOptions } from '../../../shared/types'
import { usePhases, useProjects, useProjectTags, useTasksByProject } from '../lib/hooks'
import { TaskItem } from '../components/tasks/TaskItem'
import { QuickAdd } from '../components/common/QuickAdd'
import { PhaseList } from '../components/phases/PhaseList'
import { EditableText } from '../components/common/EditableText'
import { ProjectEditModal } from '../components/projects/ProjectEditModal'
import { TagInput } from '../components/common/TagInput'
import { todayStr } from '../lib/dates'
import { PROJECT_TYPE_LABELS } from '../../../shared/constants'
import { projectTypeIcon } from '../lib/projectIcons'
import { formatMoney } from '../../../shared/money'

interface ProjectDetailViewProps {
    projectId: number
    onDeleted: () => void
}

type Tab = 'overview' | 'tasks' | 'payments' | 'files' | 'notes'

function formatDate(dateStr: string | null): string {
    if (!dateStr) return '—'
    const d = new Date(dateStr + 'T00:00:00')
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ProjectDetailView({
    projectId,
    onDeleted
}: ProjectDetailViewProps): React.JSX.Element {
    const { projects, loading: projectsLoading } = useProjects()
    const { tasks, loading: tasksLoading } = useTasksByProject(projectId)
    const { phases, loading: phasesLoading } = usePhases(projectId)
    const { tags } = useProjectTags(projectId)

    const [activeTab, setActiveTab] = useState<Tab>('overview')
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

    const handleTagsChange = async (newTags: string[]): Promise<void> => {
        await window.api.setProjectTags(projectId, newTags)
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

    const total = phases.reduce((sum, p) => sum + (p.amount_cents || 0), 0)
    const paid = phases.filter((p) => p.paid).reduce((sum, p) => sum + (p.amount_cents || 0), 0)
    const remaining = total - paid
    const currency = project.currency || 'USD'

    const moneySummary = total > 0 && (
        <div className="money-summary">
            <span className="money-paid">{formatMoney(paid, currency)}</span>
            <span className="money-sep">/</span>
            <span className="money-total">{formatMoney(total, currency)}</span>
            <span className="money-dot">·</span>
            <span className={`money-remaining ${remaining > 0 ? 'owed' : 'clear'}`}>
                {formatMoney(remaining, currency)} {remaining > 0 ? 'remaining' : 'paid in full'}
            </span>
            <span className="money-currency">{currency}</span>
        </div>
    )

    const openTasks = tasks.filter((t) => !t.done)
    const doneTasks = tasks.filter((t) => t.done)
    const status = project.status || 'active'

    return (
        <div className="view project-detail">
            <div className="view-header">
                <div className="project-title-block">
                    <div className="project-title-row">
                        {projectTypeIcon(project.type, 20)}
                        <EditableText
                            value={project.title}
                            onSave={(newTitle) => handleUpdateProject({ title: newTitle })}
                            className="project-title-edit"
                            inputClassName="project-title-input"
                        />
                        <span className={`status-badge ${status}`}>{status}</span>
                    </div>
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
                    className={activeTab === 'overview' ? 'active' : ''}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button
                    className={activeTab === 'tasks' ? 'active' : ''}
                    onClick={() => setActiveTab('tasks')}
                >
                    Tasks ({tasks.length})
                </button>
                <button
                    className={activeTab === 'payments' ? 'active' : ''}
                    onClick={() => setActiveTab('payments')}
                >
                    Payments ({phases.length})
                </button>
                <button
                    className={activeTab === 'files' ? 'active' : ''}
                    onClick={() => setActiveTab('files')}
                >
                    Files
                </button>
                <button
                    className={activeTab === 'notes' ? 'active' : ''}
                    onClick={() => setActiveTab('notes')}
                >
                    Notes
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="tab-content">
                    <div className="overview">
                        <div className="overview-fields">
                            <div className="overview-field">
                                <span className="overview-field-label">Type</span>
                                <span className="overview-field-value">
                                    {project.type ? PROJECT_TYPE_LABELS[project.type] : '—'}
                                </span>
                            </div>
                            <div className="overview-field">
                                <span className="overview-field-label">Client Contact</span>
                                <span className="overview-field-value">
                                    {project.client_contact || '—'}
                                </span>
                            </div>
                            <div className="overview-field">
                                <span className="overview-field-label">Start Date</span>
                                <span className="overview-field-value">
                                    {formatDate(project.start_date)}
                                </span>
                            </div>
                            <div className="overview-field">
                                <span className="overview-field-label">Due Date</span>
                                <span className="overview-field-value">
                                    {formatDate(project.due_date)}
                                </span>
                            </div>
                            <div className="overview-field">
                                <span className="overview-field-label">Hourly Rate</span>
                                <span className="overview-field-value">
                                    {project.hourly_rate_cents
                                        ? `${formatMoney(project.hourly_rate_cents, currency)}/hr`
                                        : '—'}
                                </span>
                            </div>
                            <div className="overview-field">
                                <span className="overview-field-label">Currency</span>
                                <span className="overview-field-value">{currency}</span>
                            </div>
                        </div>

                        <div className="overview-section">
                            <span className="overview-section-title">Tags</span>
                            <TagInput value={tags.map((t) => t.name)} onChange={handleTagsChange} />
                        </div>

                        <div className="overview-section">
                            <span className="overview-section-title">Tech Stack</span>
                            {project.tech_stack && project.tech_stack.length > 0 ? (
                                <div className="tech-stack-presets">
                                    {project.tech_stack.map((t) => (
                                        <span key={t} className="tech-chip selected">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            ) : (
                                <span className="overview-empty">
                                    No tech stack yet. Add one via the edit modal.
                                </span>
                            )}
                        </div>

                        <div className="overview-section">
                            <span className="overview-section-title">Reference Links</span>
                            {project.reference_links && project.reference_links.length > 0 ? (
                                <div className="ref-links">
                                    {project.reference_links.map((link, i) => (
                                        <div key={i} className="ref-link-row">
                                            <span className="ref-link-label">{link.label}</span>
                                            <a
                                                className="ref-link-url"
                                                href={link.url}
                                                onClick={(e) => {
                                                    e.preventDefault()
                                                    window.open(
                                                        link.url,
                                                        '_blank',
                                                        'noopener,noreferrer'
                                                    )
                                                }}
                                            >
                                                {link.url}
                                                <ExternalLink size={11} strokeWidth={2} />
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <span className="overview-empty">
                                    No reference links yet. Add some via the edit modal.
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}

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

            {activeTab === 'payments' && (
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

            {activeTab === 'files' && (
                <div className="tab-content">
                    <div className="empty-state">
                        <p>File attachments are coming in a future phase.</p>
                    </div>
                </div>
            )}

            {activeTab === 'notes' && (
                <div className="tab-content">
                    <div className="empty-state">
                        <p>Project notes are coming in a future phase.</p>
                    </div>
                </div>
            )}
        </div>
    )
}

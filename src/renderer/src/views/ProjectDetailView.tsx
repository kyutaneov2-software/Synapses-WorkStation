import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Settings, ExternalLink, Calendar, DollarSign, Tag } from 'lucide-react'
import type { Project, NewTaskOptions } from '../../../shared/types'
import {
    usePhases,
    useProject,
    useProjectTags,
    useTasksByProject,
    useTaskActions
} from '../lib/hooks'
import { TaskItem } from '../components/tasks/TaskItem'
import { QuickAdd } from '../components/common/QuickAdd'
import { PhaseList } from '../components/phases/PhaseList'
import { EditableText } from '../components/common/EditableText'
import { ProjectEditModal } from '../components/projects/ProjectEditModal'
import { ProjectNotesList } from '../components/notes/ProjectNotesList'
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
    const { project, loading: projectLoading } = useProject(projectId)
    const { tasks, loading: tasksLoading } = useTasksByProject(projectId)
    const { phases, loading: phasesLoading } = usePhases(projectId)
    const { tags } = useProjectTags(projectId)
    const actions = useTaskActions(tasks)

    const [activeTab, setActiveTab] = useState<Tab>('overview')
    const [showEdit, setShowEdit] = useState(false)

    const loading = projectLoading || tasksLoading || phasesLoading

    const handleAddTask = async (text: string, options: NewTaskOptions): Promise<void> => {
        await window.api.createTask(text, projectId, todayStr(), options.dueDate, options.priority)
    }

    const handleAddPhase = async (name: string, amountCents: number): Promise<void> => {
        await window.api.createPhase(projectId, name, amountCents)
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

    const openTasks = tasks.filter((t) => !t.done)
    const doneTasks = tasks.filter((t) => t.done)
    const status = project.status || 'active'

    return (
        <div className="project-detail-scroll">
            {/* ── HEADER CARD ──────────────────────────────── */}
            <div className="project-header-card">
                <div className="project-header-top">
                    <div className="project-title-block">
                        <div className="project-title-row">
                            {projectTypeIcon(project.type, 24)}
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
                            onSave={(newClient) =>
                                handleUpdateProject({ client: newClient || null })
                            }
                            placeholder="+ add client"
                            className="project-client-label"
                            inputClassName="project-client-input"
                            allowEmpty
                        />
                    </div>

                    <div className="project-header-actions">
                        {total > 0 && (
                            <div className="money-summary-card">
                                <span className="money-summary-label">Financials</span>
                                <div className="money-summary-row">
                                    <span className="money-paid">
                                        {formatMoney(paid, currency)}
                                    </span>
                                    <span className="money-sep">/</span>
                                    <span className="money-total">
                                        {formatMoney(total, currency)}
                                    </span>
                                </div>
                                <span
                                    className={`money-remaining ${remaining > 0 ? 'owed' : 'clear'}`}
                                >
                                    {remaining > 0
                                        ? `${formatMoney(remaining, currency)} remaining`
                                        : 'Paid in full'}
                                </span>
                            </div>
                        )}
                        <button className="edit-project-btn" onClick={() => setShowEdit(true)}>
                            <Settings size={16} strokeWidth={2} />
                        </button>
                    </div>
                </div>

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

            {/* ── TABS ─────────────────────────────────────── */}
            <div className="project-tabs">
                {(['overview', 'tasks', 'payments', 'files', 'notes'] as Tab[]).map((tab) => (
                    <button
                        key={tab}
                        className={activeTab === tab ? 'active' : ''}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'tasks'
                            ? `Tasks (${tasks.length})`
                            : tab === 'payments'
                              ? `Payments (${phases.length})`
                              : tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="active-project-tab"
                                className="active-tab-underline"
                                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* ── TAB CONTENT ──────────────────────────────── */}
            <div className="project-tab-content-wrapper">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.15 } }}
                        transition={{ duration: 0.2 }}
                        className="project-tab-content"
                    >
                        {activeTab === 'overview' && (
                            <div className="project-overview-grid">
                                <div className="overview-cards-col">
                                    <div className="detail-card">
                                        <div className="detail-card-header">
                                            <Calendar size={14} /> <span>Timeline</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Start Date</span>
                                            <span className="detail-value">
                                                {formatDate(project.start_date)}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Due Date</span>
                                            <span className="detail-value">
                                                {formatDate(project.due_date)}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Type</span>
                                            <span className="detail-value">
                                                {project.type
                                                    ? PROJECT_TYPE_LABELS[project.type]
                                                    : '—'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="detail-card">
                                        <div className="detail-card-header">
                                            <DollarSign size={14} /> <span>Financials</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Hourly Rate</span>
                                            <span className="detail-value">
                                                {project.hourly_rate_cents
                                                    ? `${formatMoney(project.hourly_rate_cents, currency)}/hr`
                                                    : '—'}
                                            </span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Currency</span>
                                            <span className="detail-value">{currency}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">Client Contact</span>
                                            <span className="detail-value">
                                                {project.client_contact || '—'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="overview-cards-col overview-cards-wide">
                                    <div className="detail-card">
                                        <div className="detail-card-header">
                                            <Tag size={14} /> <span>Tags & Tech Stack</span>
                                        </div>
                                        <div className="detail-section">
                                            <span className="detail-section-label">Tags</span>
                                            <TagInput
                                                value={tags.map((t) => t.name)}
                                                onChange={handleTagsChange}
                                            />
                                        </div>
                                        <div className="detail-section">
                                            <span className="detail-section-label">Tech Stack</span>
                                            {project.tech_stack && project.tech_stack.length > 0 ? (
                                                <div className="tech-stack-presets">
                                                    {project.tech_stack.map((t) => (
                                                        <span
                                                            key={t}
                                                            className="tech-chip selected"
                                                        >
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="detail-empty">
                                                    No tech stack added.
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="detail-card">
                                        <div className="detail-card-header">
                                            <ExternalLink size={14} /> <span>Reference Links</span>
                                        </div>
                                        {project.reference_links &&
                                        project.reference_links.length > 0 ? (
                                            <div className="ref-links">
                                                {project.reference_links.map((link, i) => (
                                                    <div key={i} className="ref-link-row">
                                                        <span className="ref-link-label">
                                                            {link.label}
                                                        </span>
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
                                                            <ExternalLink
                                                                size={11}
                                                                strokeWidth={2}
                                                            />
                                                        </a>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="detail-empty">
                                                No reference links.
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'tasks' && (
                            <div className="project-tab-panel">
                                <QuickAdd
                                    onAdd={handleAddTask}
                                    placeholder="Add a task to this project…"
                                    projects={[]}
                                    hideProject
                                    hidePlannedFor
                                />
                                {openTasks.length > 0 && (
                                    <section className="task-group">
                                        <AnimatePresence mode="popLayout">
                                            {openTasks.map((t) => (
                                                <TaskItem key={t.id} task={t} {...actions} />
                                            ))}
                                        </AnimatePresence>
                                    </section>
                                )}
                                {doneTasks.length > 0 && (
                                    <section className="task-group">
                                        <h3 className="group-title">Completed</h3>
                                        <AnimatePresence mode="popLayout">
                                            {doneTasks.map((t) => (
                                                <TaskItem key={t.id} task={t} {...actions} />
                                            ))}
                                        </AnimatePresence>
                                    </section>
                                )}
                                {tasks.length === 0 && (
                                    <div className="empty-state">
                                        <p>No tasks yet.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="project-tab-panel">
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
                            <div className="project-tab-panel">
                                <div className="empty-state">
                                    <p>File attachments coming soon.</p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'notes' && (
                            <div className="project-tab-panel">
                                <ProjectNotesList projectId={projectId} />
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {showEdit && (
                <ProjectEditModal
                    project={project}
                    onSave={handleUpdateProject}
                    onDelete={handleDeleteProject}
                    onClose={() => setShowEdit(false)}
                />
            )}
        </div>
    )
}

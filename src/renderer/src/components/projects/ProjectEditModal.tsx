import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Project, ProjectType } from '../../../../shared/types'
import {
    PROJECT_TYPES,
    PROJECT_TYPE_LABELS,
    CURRENCIES,
    CURRENCY_SYMBOLS,
    PROJECT_STATUSES,
    type ProjectStatus,
    type CurrencyCode
} from '../../../../shared/constants'
import { TechStackPicker } from '../common/TechStackPicker'
import { ReferenceLinksEditor } from '../common/ReferenceLinksEditor'
import { parseMoney } from '../../../../shared/money'

interface ProjectEditModalProps {
    project: Project
    onSave: (updates: Partial<Project>) => Promise<void>
    onDelete: () => Promise<void>
    onClose: () => void
}

export function ProjectEditModal({
    project,
    onSave,
    onDelete,
    onClose
}: ProjectEditModalProps): React.JSX.Element {
    const [title, setTitle] = useState(project.title)
    const [client, setClient] = useState(project.client ?? '')
    const [clientContact, setClientContact] = useState(project.client_contact ?? '')
    const [type, setType] = useState<ProjectType>(project.type ?? 'other')
    const [status, setStatus] = useState<ProjectStatus>(project.status ?? 'active')
    const [currency, setCurrency] = useState<CurrencyCode>(project.currency ?? 'USD')
    const [startDate, setStartDate] = useState(project.start_date ?? '')
    const [dueDate, setDueDate] = useState(project.due_date ?? '')
    const [hourlyRate, setHourlyRate] = useState(
        project.hourly_rate_cents != null ? String(project.hourly_rate_cents / 100) : ''
    )
    const [brief, setBrief] = useState(project.brief ?? '')
    const [techStack, setTechStack] = useState<string[]>(project.tech_stack ?? [])
    const [referenceLinks, setReferenceLinks] = useState(project.reference_links ?? [])
    const [saving, setSaving] = useState(false)
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()
        if (!title.trim() || saving) return

        setSaving(true)
        try {
            await onSave({
                title: title.trim(),
                client: client.trim() || null,
                client_contact: clientContact.trim() || null,
                type,
                status,
                currency,
                start_date: startDate || null,
                due_date: dueDate || null,
                hourly_rate_cents: hourlyRate.trim() ? parseMoney(hourlyRate) : null,
                brief: brief.trim() || null,
                tech_stack: techStack.length > 0 ? techStack : null,
                reference_links: referenceLinks.length > 0 ? referenceLinks : null
            })
            onClose()
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (): Promise<void> => {
        if (!confirmingDelete) {
            setConfirmingDelete(true)
            return
        }
        await onDelete()
        onClose()
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="modal-panel modal-panel-wide"
                onClick={(e) => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <div className="modal-header">
                        <h3>Edit Project</h3>
                        <button
                            type="button"
                            className="modal-close"
                            onClick={onClose}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>

                    <div className="modal-body">
                        {/* ... (Keep existing form fields unchanged) ... */}
                        <label className="form-field">
                            <span>Title</span>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                autoFocus
                                required
                            />
                        </label>
                        <div className="form-row">
                            <label className="form-field">
                                <span>Client</span>
                                <input
                                    type="text"
                                    value={client}
                                    onChange={(e) => setClient(e.target.value)}
                                    placeholder="Optional"
                                />
                            </label>
                            <label className="form-field">
                                <span>Client Contact</span>
                                <input
                                    type="text"
                                    value={clientContact}
                                    onChange={(e) => setClientContact(e.target.value)}
                                    placeholder="Discord, email, etc."
                                />
                            </label>
                        </div>
                        <div className="form-row">
                            <label className="form-field">
                                <span>Type</span>
                                <select
                                    value={type}
                                    onChange={(e) => setType(e.target.value as ProjectType)}
                                >
                                    {PROJECT_TYPES.map((t) => (
                                        <option key={t} value={t}>
                                            {PROJECT_TYPE_LABELS[t]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="form-field">
                                <span>Status</span>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                                >
                                    {PROJECT_STATUSES.map((s) => (
                                        <option key={s} value={s}>
                                            {s.charAt(0).toUpperCase() + s.slice(1)}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="form-field">
                                <span>Currency</span>
                                <select
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                                >
                                    {CURRENCIES.map((c) => (
                                        <option key={c} value={c}>
                                            {c} — {CURRENCY_SYMBOLS[c]}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            <label className="form-field">
                                <span>Hourly Rate</span>
                                <input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => setHourlyRate(e.target.value)}
                                    placeholder="0"
                                    step="0.01"
                                />
                            </label>
                        </div>
                        <div className="form-row">
                            <label className="form-field">
                                <span>Start Date</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </label>
                            <label className="form-field">
                                <span>Due Date</span>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                />
                            </label>
                        </div>
                        <label className="form-field">
                            <span>Brief</span>
                            <textarea
                                value={brief}
                                onChange={(e) => setBrief(e.target.value)}
                                placeholder="What's this project about?"
                                rows={3}
                            />
                        </label>
                        <div className="form-field">
                            <span>Tech Stack</span>
                            <TechStackPicker value={techStack} onChange={setTechStack} />
                        </div>
                        <div className="form-field">
                            <span>Reference Links</span>
                            <ReferenceLinksEditor
                                value={referenceLinks}
                                onChange={setReferenceLinks}
                            />
                        </div>
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className={`btn-danger ${confirmingDelete ? 'confirming' : ''}`}
                            onClick={handleDelete}
                        >
                            {confirmingDelete ? 'Click again to confirm' : 'Delete Project'}
                        </button>
                        <div className="modal-footer-right">
                            <button type="button" className="btn-ghost" onClick={onClose}>
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!title.trim() || saving}
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                        </div>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    )
}

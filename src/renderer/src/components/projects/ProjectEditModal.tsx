import { useState } from "react";
import type { Project } from "../../../../shared/types";

interface ProjectEditModalProps {
    project: Project;
    onSave: (updates: Partial<Project>) => Promise<void>;
    onDelete: () => Promise<void>;
    onClose: () => void;
}

export function ProjectEditModal({
    project,
    onSave,
    onDelete,
    onClose,
}: ProjectEditModalProps): React.JSX.Element {
    const [title, setTitle] = useState(project.title);
    const [client, setClient] = useState(project.client ?? "");
    const [status, setStatus] = useState(project.status ?? "active");
    const [currency, setCurrency] = useState(project.currency ?? "USD");
    const [startDate, setStartDate] = useState(project.start_date ?? "");
    const [dueDate, setDueDate] = useState(project.due_date ?? "");
    const [hourlyRate, setHourlyRate] = useState(
        project.hourly_rate != null ? String(project.hourly_rate) : "",
    );
    const [brief, setBrief] = useState(project.brief ?? "");
    const [saving, setSaving] = useState(false);
    const [confirmingDelete, setConfirmingDelete] = useState(false);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        if (!title.trim() || saving) return;

        setSaving(true);
        try {
            await onSave({
                title: title.trim(),
                client: client.trim() || null,
                status,
                currency,
                start_date: startDate || null,
                due_date: dueDate || null,
                hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
                brief: brief.trim() || null,
            });
            onClose();
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (!confirmingDelete) {
            setConfirmingDelete(true);
            return;
        }
        await onDelete();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
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

                        <label className="form-field">
                            <span>Client</span>
                            <input
                                type="text"
                                value={client}
                                onChange={(e) => setClient(e.target.value)}
                                placeholder="Optional"
                            />
                        </label>

                        <div className="form-row">
                            <label className="form-field">
                                <span>Status</span>
                                <select
                                    value={status}
                                    onChange={(e) => setStatus(e.target.value)}
                                >
                                    <option value="active">Active</option>
                                    <option value="paused">Paused</option>
                                    <option value="completed">Completed</option>
                                    <option value="archived">Archived</option>
                                </select>
                            </label>

                            <label className="form-field">
                                <span>Currency</span>
                                <select
                                    value={currency}
                                    onChange={(e) =>
                                        setCurrency(e.target.value)
                                    }
                                >
                                    <option value="USD">USD — $</option>
                                    <option value="PHP">PHP — ₱</option>
                                    <option value="EUR">EUR — €</option>
                                    <option value="GBP">GBP — £</option>
                                </select>
                            </label>

                            <label className="form-field">
                                <span>Hourly Rate</span>
                                <input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) =>
                                        setHourlyRate(e.target.value)
                                    }
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
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
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
                    </div>

                    <div className="modal-footer">
                        <button
                            type="button"
                            className={`btn-danger ${confirmingDelete ? "confirming" : ""}`}
                            onClick={handleDelete}
                        >
                            {confirmingDelete
                                ? "Click again to confirm"
                                : "Delete Project"}
                        </button>
                        <div className="modal-footer-right">
                            <button
                                type="button"
                                className="btn-ghost"
                                onClick={onClose}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={!title.trim() || saving}
                            >
                                {saving ? "Saving…" : "Save"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

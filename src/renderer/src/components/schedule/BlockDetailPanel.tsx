import { useState } from 'react'
import { Play, Trash2, X } from 'lucide-react'
import type { ScheduleBlockWithTask, Task } from '../../../../shared/types'
import { blockDayKey } from '../../lib/scheduleTime'

interface BlockDetailPanelProps {
    mode: 'edit' | 'new'
    block?: ScheduleBlockWithTask
    defaultStart?: string
    defaultEnd?: string
    tasks: Task[]
    onSave: (taskId: number, startAt: string, endAt: string) => Promise<void>
    onDelete?: () => Promise<void>
    onStartFocus?: (taskId: number) => Promise<void>
    onClose: () => void
}

export function BlockDetailPanel({
    mode,
    block,
    defaultStart,
    defaultEnd,
    tasks,
    onSave,
    onDelete,
    onStartFocus,
    onClose
}: BlockDetailPanelProps): React.JSX.Element {
    // Values are derived from props at mount time. If the parent needs to
    // swap to a different block, it remounts this component via `key`, so
    // these initializers re-run. No effect needed — see ScheduleView.
    const startStr = block?.start_at ?? defaultStart ?? ''
    const endStr = block?.end_at ?? defaultEnd ?? ''

    const [taskId, setTaskId] = useState<number>(block?.task_id ?? tasks[0]?.id ?? 0)
    const [date, setDate] = useState<string>(() => blockDayKey(startStr))
    const [startTime, setStartTime] = useState<string>(() => startStr.slice(11, 16))
    const [endTime, setEndTime] = useState<string>(() => endStr.slice(11, 16))
    const [saving, setSaving] = useState(false)
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const handleSave = async (): Promise<void> => {
        if (!date || !startTime || !endTime || !taskId) return
        const startAt = `${date} ${startTime}`
        const endAt = `${date} ${endTime}`
        if (endAt <= startAt) return
        setSaving(true)
        try {
            await onSave(taskId, startAt, endAt)
            onClose()
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (): Promise<void> => {
        if (!onDelete) return
        if (!confirmingDelete) {
            setConfirmingDelete(true)
            return
        }
        await onDelete()
        onClose()
    }

    const durationLabel = (() => {
        if (!startTime || !endTime) return '—'
        const [sh, sm] = startTime.split(':').map(Number)
        const [eh, em] = endTime.split(':').map(Number)
        const total = eh * 60 + em - (sh * 60 + sm)
        if (total <= 0) return '—'
        const h = Math.floor(total / 60)
        const m = total % 60
        if (h === 0) return `${m}m`
        if (m === 0) return `${h}h`
        return `${h}h ${m}m`
    })()

    return (
        <aside className="block-detail">
            <div className="block-detail-header">
                <span className="block-detail-kicker">
                    {mode === 'new' ? 'New block' : 'Selected'}
                </span>
                <button className="block-detail-close" onClick={onClose} aria-label="Close panel">
                    <X size={14} strokeWidth={2.5} />
                </button>
            </div>

            {mode === 'edit' && block && (
                <div className="block-detail-title-group">
                    <div className="block-detail-title">{block.task_text}</div>
                    {block.task_project_title && (
                        <div className="block-detail-project">{block.task_project_title}</div>
                    )}
                </div>
            )}

            {mode === 'new' && (
                <label className="block-detail-field">
                    <span>Task</span>
                    <select
                        value={taskId || ''}
                        onChange={(e) => setTaskId(Number(e.target.value))}
                    >
                        {tasks.length === 0 && <option value="">No tasks available</option>}
                        {tasks.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.text}
                            </option>
                        ))}
                    </select>
                </label>
            )}

            <label className="block-detail-field">
                <span>Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </label>

            <div className="block-detail-row">
                <label className="block-detail-field">
                    <span>Start</span>
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        step={60 * 15}
                    />
                </label>
                <label className="block-detail-field">
                    <span>End</span>
                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        step={60 * 15}
                    />
                </label>
            </div>

            <div className="block-detail-readout">
                <span>Duration</span>
                <strong>{durationLabel}</strong>
            </div>

            <div className="block-detail-actions">
                {mode === 'edit' && onStartFocus && block && (
                    <button
                        className="btn-primary block-detail-focus"
                        onClick={() => onStartFocus(block.task_id)}
                    >
                        <Play size={12} strokeWidth={2.5} />
                        Start focus now
                    </button>
                )}
                <button
                    className="btn-ghost"
                    onClick={handleSave}
                    disabled={saving || !date || !startTime || !endTime}
                >
                    {saving ? 'Saving…' : mode === 'new' ? 'Create block' : 'Save'}
                </button>
                {mode === 'edit' && onDelete && (
                    <button
                        className={`btn-danger ${confirmingDelete ? 'confirming' : ''}`}
                        onClick={handleDelete}
                    >
                        <Trash2 size={12} strokeWidth={2.5} />
                        {confirmingDelete ? 'Click again to confirm' : 'Remove from schedule'}
                    </button>
                )}
            </div>
        </aside>
    )
}

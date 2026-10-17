import { useState } from 'react'
import { Trash2, X, Play } from 'lucide-react'
import type {
    Task,
    ScheduleBlockWithTask,
    ScheduleBlockInput,
    EventType
} from '../../../../shared/types'
import { blockDayKey } from '../../lib/scheduleTime'

interface BlockModalProps {
    mode: 'edit' | 'new'
    block?: ScheduleBlockWithTask
    defaultStart?: string
    defaultEnd?: string
    tasks: Task[]
    onSave: (input: ScheduleBlockInput) => Promise<void>
    onDelete?: () => Promise<void>
    onStartFocus?: (taskId: number) => Promise<void>
    onClose: () => void
}

export function BlockModal({
    mode,
    block,
    defaultStart,
    defaultEnd,
    tasks,
    onSave,
    onDelete,
    onStartFocus,
    onClose
}: BlockModalProps): React.JSX.Element {
    const startStr = block?.start_at ?? defaultStart ?? ''
    const endStr = block?.end_at ?? defaultEnd ?? ''

    const [eventType, setEventType] = useState<EventType>(block?.event_type ?? 'task')
    const [taskId, setTaskId] = useState<number | null>(block?.task_id ?? tasks[0]?.id ?? null)
    const [title, setTitle] = useState(block?.title ?? '')

    const [date, setDate] = useState(blockDayKey(startStr))
    const [startTime, setStartTime] = useState(startStr.slice(11, 16))
    const [endTime, setEndTime] = useState(endStr.slice(11, 16))
    const [saving, setSaving] = useState(false)
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const handleSave = async (): Promise<void> => {
        if (!date || !startTime || !endTime) return
        if (eventType === 'task' && !taskId) return
        if (eventType !== 'task' && !title.trim()) return

        const startAt = `${date} ${startTime}`
        const endAt = `${date} ${endTime}`
        if (endAt <= startAt) return

        setSaving(true)
        try {
            await onSave({
                taskId: eventType === 'task' ? taskId : null,
                title: eventType !== 'task' ? title.trim() : null,
                eventType,
                startAt,
                endAt
            })
            onClose()
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-panel block-modal-panel" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{mode === 'new' ? 'New Schedule Block' : 'Edit Block'}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <X size={16} />
                    </button>
                </div>

                <div className="modal-body">
                    {mode === 'new' ? (
                        <div className="block-type-tabs">
                            <button
                                className={eventType === 'task' ? 'active' : ''}
                                onClick={() => setEventType('task')}
                            >
                                Task
                            </button>
                            <button
                                className={eventType === 'meeting' ? 'active' : ''}
                                onClick={() => setEventType('meeting')}
                            >
                                Meeting
                            </button>
                            <button
                                className={eventType === 'reminder' ? 'active' : ''}
                                onClick={() => setEventType('reminder')}
                            >
                                Reminder
                            </button>
                        </div>
                    ) : (
                        <div className={`event-badge event-badge-${eventType}`}>{eventType}</div>
                    )}

                    {eventType === 'task' ? (
                        <label className="form-field">
                            <span>Select Task</span>
                            <select
                                value={taskId || ''}
                                onChange={(e) => setTaskId(Number(e.target.value))}
                            >
                                {tasks.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.text}
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : (
                        <label className="form-field">
                            <span>Title</span>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Client Call"
                            />
                        </label>
                    )}

                    <label className="form-field">
                        <span>Date</span>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </label>

                    <div className="form-row">
                        <label className="form-field">
                            <span>Start</span>
                            <input
                                type="time"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                step={900}
                            />
                        </label>
                        <label className="form-field">
                            <span>End</span>
                            <input
                                type="time"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                step={900}
                            />
                        </label>
                    </div>
                </div>

                <div className="modal-footer">
                    {mode === 'edit' && onDelete && (
                        <button
                            className={`btn-danger ${confirmingDelete ? 'confirming' : ''}`}
                            onClick={() =>
                                confirmingDelete ? onDelete() : setConfirmingDelete(true)
                            }
                        >
                            <Trash2 size={14} /> {confirmingDelete ? 'Confirm' : 'Delete'}
                        </button>
                    )}
                    <div className="modal-footer-right">
                        {mode === 'edit' &&
                            eventType === 'task' &&
                            onStartFocus &&
                            block?.task_id && (
                                <button
                                    className="btn-ghost"
                                    onClick={() => onStartFocus(block.task_id!)}
                                >
                                    <Play size={14} /> Focus
                                </button>
                            )}
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving...' : 'Save Block'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Play, Trash2, X } from 'lucide-react'
import type {
    ScheduleBlockWithTask,
    Task,
    ScheduleBlockInput,
    EventType
} from '../../../../shared/types'
import { blockDayKey, blockMinutes } from '../../lib/scheduleTime'

interface BlockDetailPanelProps {
    mode: 'edit' | 'new'
    block?: ScheduleBlockWithTask
    defaultStart?: string
    defaultEnd?: string
    defaultTaskId?: number | null
    tasks: Task[]
    onSave: (input: ScheduleBlockInput) => Promise<void>
    onDelete?: () => Promise<void>
    onStartFocus?: (taskId: number) => Promise<void>
    onClose: () => void
}

export function BlockDetailPanel({
    mode,
    block,
    defaultStart,
    defaultEnd,
    defaultTaskId,
    tasks,
    onSave,
    onDelete,
    onStartFocus,
    onClose
}: BlockDetailPanelProps): React.JSX.Element {
    const startStr = block?.start_at ?? defaultStart ?? ''
    const endStr = block?.end_at ?? defaultEnd ?? ''

    const [eventType, setEventType] = useState<EventType>(block?.event_type ?? 'task')
    const [taskId, setTaskId] = useState<number | null>(
        block?.task_id ?? defaultTaskId ?? tasks[0]?.id ?? null
    )
    const [title, setTitle] = useState(block?.title ?? '')
    const [reminder, setReminder] = useState('15')

    const [date, setDate] = useState<string>(() => blockDayKey(startStr))
    const [startTime, setStartTime] = useState<string>(() => startStr.slice(11, 16))
    const [endTime, setEndTime] = useState<string>(() => endStr.slice(11, 16))

    const [saving, setSaving] = useState(false)
    const [confirmingDelete, setConfirmingDelete] = useState(false)

    const adjustTime = (timeStr: string, minutesDelta: number): string => {
        const [h, m] = timeStr.split(':').map(Number)
        let total = h * 60 + m + minutesDelta
        if (total < 0) total = 0
        if (total >= 24 * 60) total = 24 * 60 - 1
        const newH = Math.floor(total / 60)
        const newM = total % 60
        return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`
    }

    const setDuration = (mins: number): void => {
        setEndTime(adjustTime(startTime, mins))
    }

    const currentDurationMins = useMemo(() => {
        if (!startTime || !endTime) return 0
        const [sh, sm] = startTime.split(':').map(Number)
        const [eh, em] = endTime.split(':').map(Number)
        return eh * 60 + em - (sh * 60 + sm)
    }, [startTime, endTime])

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
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
            onClick={onClose}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="modal-panel block-modal-panel"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-header">
                    <div className="block-detail-header-left">
                        <span className="block-detail-kicker">
                            {mode === 'new' ? 'New block' : 'Selected'}
                        </span>
                    </div>
                    <button className="block-detail-close" onClick={onClose}>
                        <X size={16} strokeWidth={2.5} />
                    </button>
                </div>

                <div className="modal-body">
                    {mode === 'edit' && block && block.event_type === 'task' ? (
                        <div className="block-detail-title-group">
                            <div className="block-detail-title">{block.task_text}</div>
                            {block.task_project_title && (
                                <div className="block-detail-project">
                                    {block.task_project_title}
                                </div>
                            )}
                        </div>
                    ) : mode === 'new' ? (
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
                        mode === 'new' ? (
                            <label className="block-detail-field">
                                <span>Task</span>
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
                        ) : null
                    ) : (
                        <label className="block-detail-field">
                            <span>Title</span>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="e.g., Client Call"
                            />
                        </label>
                    )}

                    <label className="block-detail-field">
                        <span>Date</span>
                        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                    </label>

                    <div className="block-detail-row">
                        <label className="block-detail-field">
                            <span>Start</span>
                            <div className="time-input-group">
                                <input
                                    type="time"
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                    step={900}
                                />
                                <button
                                    type="button"
                                    onClick={() => setStartTime(adjustTime(startTime, -15))}
                                >
                                    -15
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setStartTime(adjustTime(startTime, 15))}
                                >
                                    +15
                                </button>
                            </div>
                        </label>
                        <label className="block-detail-field">
                            <span>End</span>
                            <div className="time-input-group">
                                <input
                                    type="time"
                                    value={endTime}
                                    onChange={(e) => setEndTime(e.target.value)}
                                    step={900}
                                />
                                <button
                                    type="button"
                                    onClick={() => setEndTime(adjustTime(endTime, -15))}
                                >
                                    -15
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEndTime(adjustTime(endTime, 15))}
                                >
                                    +15
                                </button>
                            </div>
                        </label>
                    </div>

                    <div className="block-detail-duration">
                        <span>Duration</span>
                        <div className="duration-pills">
                            {[30, 60, 90, 120, 150, 180].map((mins) => (
                                <button
                                    key={mins}
                                    className={currentDurationMins === mins ? 'active' : ''}
                                    onClick={() => setDuration(mins)}
                                >
                                    {mins < 60 ? `${mins}m` : `${mins / 60}h`}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="block-detail-glance">
                        <div className="glance-header">
                            <span>
                                {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                                    weekday: 'long'
                                })}{' '}
                                at a glance
                            </span>
                            <span className="glance-status">No conflicts</span>
                        </div>
                        <div className="glance-timeline">
                            <div className="glance-track">
                                {startTime && endTime && (
                                    <div
                                        className="glance-highlight"
                                        style={{
                                            left: `${(blockMinutes(`${date} ${startTime}`) / (24 * 60)) * 100}%`,
                                            width: `${((blockMinutes(`${date} ${endTime}`) - blockMinutes(`${date} ${startTime}`)) / (24 * 60)) * 100}%`
                                        }}
                                    />
                                )}
                            </div>
                            <div className="glance-labels">
                                <span>8 AM</span>
                                <span>12 PM</span>
                                <span>4 PM</span>
                                <span>8 PM</span>
                                <span>11 PM</span>
                            </div>
                        </div>
                    </div>

                    <div className="block-detail-row" style={{ marginTop: '16px' }}>
                        <label
                            className="block-detail-field"
                            style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}
                        >
                            <span>Reminder</span>
                            <select
                                value={reminder}
                                onChange={(e) => setReminder(e.target.value)}
                                style={{ width: '120px' }}
                            >
                                <option value="0">None</option>
                                <option value="5">5 min before</option>
                                <option value="15">15 min before</option>
                                <option value="30">30 min before</option>
                                <option value="60">1 hour before</option>
                            </select>
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
                            <Trash2 size={12} strokeWidth={2.5} />{' '}
                            {confirmingDelete ? 'Confirm' : 'Delete'}
                        </button>
                    )}
                    <div className="modal-footer-right">
                        {mode === 'edit' &&
                            onStartFocus &&
                            block &&
                            block.event_type === 'task' &&
                            block.task_id && (
                                <button
                                    className="btn-ghost"
                                    onClick={() => onStartFocus(block.task_id!)}
                                >
                                    <Play size={12} strokeWidth={2.5} /> Focus
                                </button>
                            )}
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            {saving ? 'Saving…' : 'Save'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    )
}

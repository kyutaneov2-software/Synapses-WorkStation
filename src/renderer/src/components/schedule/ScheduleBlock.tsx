import { motion } from 'framer-motion'
import type { ScheduleBlockWithTask } from '../../../../shared/types'
import { ROW_HEIGHT, START_HOUR, END_HOUR, blockMinutes, formatHHMM } from '../../lib/scheduleTime'

interface ScheduleBlockProps {
    block: ScheduleBlockWithTask
    offsetLevel: number
    selected: boolean
    isDragging: boolean
    onMouseDown: (e: React.MouseEvent, mode: 'move' | 'resize') => void
}

export function ScheduleBlock({
    block,
    offsetLevel,
    selected,
    isDragging,
    onMouseDown
}: ScheduleBlockProps): React.JSX.Element | null {
    const startMin = blockMinutes(block.start_at)
    const endMin = blockMinutes(block.end_at)
    const dayStart = START_HOUR * 60
    const dayEnd = END_HOUR * 60

    if (endMin <= dayStart || startMin >= dayEnd) return null

    const clampedStart = Math.max(startMin, dayStart)
    const clampedEnd = Math.min(endMin, dayEnd)
    const top = ((clampedStart - dayStart) / 60) * ROW_HEIGHT
    const height = Math.max(22, ((clampedEnd - clampedStart) / 60) * ROW_HEIGHT - 2)

    const offsetPx = offsetLevel * 8

    return (
        <motion.button
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`schedule-block event-${block.event_type} ${selected ? 'selected' : ''} ${
                block.task_done ? 'done' : ''
            } ${isDragging ? 'dragging' : ''}`}
            style={{
                top: `${top}px`,
                height: `${height}px`,
                left: `${offsetPx}px`,
                right: '2px',
                zIndex: isDragging ? 100 : 10 + offsetLevel
            }}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => onMouseDown(e, 'move')}
            title={`${block.task_text || block.title} — ${formatHHMM(block.start_at)}–${formatHHMM(block.end_at)}`}
        >
            <div className="schedule-block-title">{block.task_text || block.title}</div>
            {block.task_project_title && (
                <div className="schedule-block-project">{block.task_project_title}</div>
            )}
            <div className="schedule-block-time">
                {formatHHMM(block.start_at)} – {formatHHMM(block.end_at)}
            </div>

            <div
                className="schedule-block-resize-handle"
                onMouseDown={(e) => {
                    e.stopPropagation()
                    onMouseDown(e, 'resize')
                }}
            />
        </motion.button>
    )
}

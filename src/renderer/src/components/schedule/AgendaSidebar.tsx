import { motion } from 'framer-motion'
import type { ScheduleBlockWithTask, Task } from '../../../../shared/types'
import { dateKey, offsetDays, blockDayKey, formatHHMM } from '../../lib/scheduleTime'

interface AgendaSidebarProps {
    blocks: ScheduleBlockWithTask[]
    tasks: Task[]
    onSelectBlock: (id: number) => void
    onCreateForTask: (taskId: number) => void
}

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
}

const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
}

export function AgendaSidebar({
    blocks,
    tasks,
    onSelectBlock,
    onCreateForTask
}: AgendaSidebarProps): React.JSX.Element {
    const todayKey = dateKey(new Date())
    const tomorrowKey = dateKey(offsetDays(new Date(), 1))

    const todayBlocks = blocks
        .filter((b) => blockDayKey(b.start_at) === todayKey)
        .sort((a, b) => a.start_at.localeCompare(b.start_at))
    const tomorrowBlocks = blocks
        .filter((b) => blockDayKey(b.start_at) === tomorrowKey)
        .sort((a, b) => a.start_at.localeCompare(b.start_at))

    const scheduledTaskIds = new Set(blocks.map((b) => b.task_id).filter(Boolean))
    const unscheduledTasks = tasks.filter((t) => !t.done && !scheduledTaskIds.has(t.id))

    const renderAgendaItem = (block: ScheduleBlockWithTask): React.JSX.Element => (
        <motion.button
            variants={itemVariants}
            key={block.id}
            className={`agenda-item event-${block.event_type}`}
            onClick={() => onSelectBlock(block.id)}
        >
            <div className="agenda-time">{formatHHMM(block.start_at)}</div>
            <div className="agenda-content">
                <div className="agenda-title">{block.task_text || block.title}</div>
                {block.task_project_title && (
                    <div className="agenda-project">{block.task_project_title}</div>
                )}
            </div>
        </motion.button>
    )

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="agenda-sidebar"
        >
            <div className="agenda-section">
                <div className="agenda-label">
                    TODAY -{' '}
                    {new Date()
                        .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
                        .toUpperCase()}
                </div>
                {todayBlocks.length === 0 ? (
                    <p className="agenda-empty">Nothing scheduled.</p>
                ) : (
                    todayBlocks.map(renderAgendaItem)
                )}
            </div>

            <div className="agenda-section">
                <div className="agenda-label">
                    TOMORROW -{' '}
                    {offsetDays(new Date(), 1)
                        .toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })
                        .toUpperCase()}
                </div>
                {tomorrowBlocks.length === 0 ? (
                    <p className="agenda-empty">Nothing scheduled.</p>
                ) : (
                    tomorrowBlocks.map(renderAgendaItem)
                )}
            </div>

            {unscheduledTasks.length > 0 && (
                <div className="agenda-section">
                    <div className="agenda-label">NO TIME SET</div>
                    {unscheduledTasks.map((task) => (
                        <motion.div
                            variants={itemVariants}
                            key={task.id}
                            className="agenda-task-unscheduled"
                            onClick={() => onCreateForTask(task.id)}
                            draggable
                            onDragStart={(e) => {
                                // Cast the Framer Motion event to a native React DragEvent
                                const dragEvent = e as unknown as React.DragEvent<HTMLDivElement>
                                dragEvent.dataTransfer.setData('text/plain', task.id.toString())
                                dragEvent.dataTransfer.effectAllowed = 'copy'
                            }}
                        >
                            <div className="agenda-title">{task.text}</div>
                            <div className="agenda-hint">Drag to calendar or click</div>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}

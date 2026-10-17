import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useScheduleRange, useTasksByView } from '../lib/hooks'
import { MiniMonth } from '../components/schedule/MiniMonth'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { BlockDetailPanel } from '../components/schedule/BlockDetailPanel'
import { AgendaSidebar } from '../components/schedule/AgendaSidebar' // Import the new component
import {
    DEFAULT_DURATION_MINUTES,
    blockMinutes,
    composeLocalDateTime,
    dateKey,
    offsetDays,
    sevenDays,
    startOfWeek
} from '../lib/scheduleTime'
import type { ScheduleBlockInput } from '../../../shared/types'

type ViewMode = 'day' | 'week'

interface NewBlockDraft {
    dayKey: string
    startMinutes: number
    defaultTaskId?: number | null
}

export function ScheduleView(): React.JSX.Element {
    const [viewMode, setViewMode] = useState<ViewMode>('week')
    const [anchor, setAnchor] = useState<Date>(() => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        return d
    })
    const [selectedBlockId, setSelectedBlockId] = useState<number | null>(null)
    const [newBlock, setNewBlock] = useState<NewBlockDraft | null>(null)

    const days = useMemo(() => {
        if (viewMode === 'day') return [anchor]
        return sevenDays(startOfWeek(anchor))
    }, [anchor, viewMode])

    const fromDate = dateKey(days[0])
    const toDate = dateKey(days[days.length - 1])

    const { blocks } = useScheduleRange(fromDate, toDate)
    const { tasks } = useTasksByView('all')

    const openTasks = useMemo(() => tasks.filter((t) => !t.done), [tasks])

    const selectedBlock = useMemo(
        () => blocks.find((b) => b.id === selectedBlockId) ?? null,
        [blocks, selectedBlockId]
    )

    // Calculate stats and project breakdown for the header
    const stats = useMemo(() => {
        const count = blocks.length
        let totalMinutes = 0
        const projectMinutes = new Map<string, number>()

        blocks.forEach((b) => {
            const mins = Math.max(0, blockMinutes(b.end_at) - blockMinutes(b.start_at))
            totalMinutes += mins
            if (b.task_project_title) {
                projectMinutes.set(
                    b.task_project_title,
                    (projectMinutes.get(b.task_project_title) || 0) + mins
                )
            }
        })

        const formatMins = (m: number): string => {
            const h = Math.floor(m / 60)
            const min = m % 60
            return h === 0 ? `${min}m` : min === 0 ? `${h}h` : `${h}h ${min}m`
        }

        const projectDetails = Array.from(projectMinutes.entries())
            .map(([name, mins]) => `${name} ${formatMins(mins)}`)
            .join(' · ')

        return { count, timeLabel: formatMins(totalMinutes), projectDetails }
    }, [blocks])

    const handlePrev = (): void => setAnchor((d) => offsetDays(d, viewMode === 'day' ? -1 : -7))
    const handleNext = (): void => setAnchor((d) => offsetDays(d, viewMode === 'day' ? 1 : 7))
    const handleToday = (): void => {
        const d = new Date()
        d.setHours(0, 0, 0, 0)
        setAnchor(d)
    }

    const handleClickEmpty = (dayKey: string, startMinutes: number): void => {
        setSelectedBlockId(null)
        setNewBlock({ dayKey, startMinutes })
    }

    const handleSelectBlock = (id: number): void => {
        setNewBlock(null)
        setSelectedBlockId(id)
    }

    const handleClosePanel = (): void => {
        setSelectedBlockId(null)
        setNewBlock(null)
    }

    const handleCreateBlock = async (input: ScheduleBlockInput): Promise<void> => {
        await window.api.createBlock(input)
    }

    const handleUpdateBlock = async (input: ScheduleBlockInput): Promise<void> => {
        if (!selectedBlock) return
        await window.api.updateBlock(selectedBlock.id, input)
    }

    const handleDeleteBlock = async (): Promise<void> => {
        if (!selectedBlock) return
        await window.api.deleteBlock(selectedBlock.id)
    }

    const handleStartFocus = async (taskId: number): Promise<void> => {
        await window.api.focusPinTask(taskId)
        await window.api.focusToggle()
    }

    const headerLabel = useMemo(() => {
        if (viewMode === 'day') {
            return anchor.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            })
        }
        const start = days[0]
        const end = days[6]
        const sameMonth = start.getMonth() === end.getMonth()
        if (sameMonth) {
            return `${start.toLocaleDateString(undefined, { month: 'long' })} ${start.getDate()} – ${end.getDate()}, ${start.getFullYear()}`
        }
        return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}, ${end.getFullYear()}`
    }, [anchor, days, viewMode])

    const defaultStart = newBlock
        ? composeLocalDateTime(newBlock.dayKey, newBlock.startMinutes)
        : undefined
    const defaultEnd = newBlock
        ? composeLocalDateTime(newBlock.dayKey, newBlock.startMinutes + DEFAULT_DURATION_MINUTES)
        : undefined

    // Handler to open "New Block" from the Unscheduled Agenda list
    const handleScheduleTask = (taskId: number): void => {
        const today = dateKey(new Date())
        setSelectedBlockId(null)
        setNewBlock({ dayKey: today, startMinutes: 9 * 60, defaultTaskId: taskId })
    }

    return (
        <div className="schedule-layout">
            {/* ── LEFT: sidebar ─────────── */}
            <aside className="schedule-sidebar">
                <div className="schedule-sidebar-top">
                    <MiniMonth anchor={anchor} onSelect={setAnchor} />
                    <AgendaSidebar
                        blocks={blocks}
                        tasks={openTasks}
                        onSelectBlock={handleSelectBlock}
                        onCreateForTask={handleScheduleTask}
                    />
                </div>
            </aside>

            {/* ── RIGHT: main column ───────────── */}
            <div className="schedule-main">
                <div className="schedule-toolbar">
                    <div className="schedule-toolbar-info">
                        <h2 className="schedule-title">{headerLabel}</h2>
                        <div className="schedule-subtitle">
                            {stats.count} block{stats.count === 1 ? '' : 's'} · {stats.timeLabel}{' '}
                            planned
                            {stats.projectDetails && (
                                <span className="schedule-project-stats">
                                    {' '}
                                    · {stats.projectDetails}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="schedule-view-toggle">
                        <button
                            className={viewMode === 'day' ? 'active' : ''}
                            onClick={() => setViewMode('day')}
                        >
                            Day
                        </button>
                        <button
                            className={viewMode === 'week' ? 'active' : ''}
                            onClick={() => setViewMode('week')}
                        >
                            Week
                        </button>
                    </div>

                    <div className="schedule-toolbar-nav">
                        <button onClick={handlePrev} aria-label="Previous">
                            <ChevronLeft size={14} strokeWidth={2.5} />
                        </button>
                        <button onClick={handleToday} className="schedule-today-btn">
                            Today
                        </button>
                        <button onClick={handleNext} aria-label="Next">
                            <ChevronRight size={14} strokeWidth={2.5} />
                        </button>
                    </div>

                    <button
                        className="btn-primary schedule-new-btn"
                        onClick={() => handleClickEmpty(dateKey(new Date()), 9 * 60)}
                    >
                        <Plus size={16} strokeWidth={2.5} /> New Block
                    </button>
                </div>

                <ScheduleGrid
                    days={days}
                    blocks={blocks}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={handleSelectBlock}
                    onClickEmpty={handleClickEmpty}
                    onUpdateBlock={async (id, start, end): Promise<void> => {
                        const existing = blocks.find((b) => b.id === id)
                        if (!existing) return
                        await window.api.updateBlock(id, {
                            taskId: existing.task_id,
                            title: existing.title,
                            eventType: existing.event_type,
                            startAt: start,
                            endAt: end
                        })
                    }}
                />
            </div>

            {/* Modal */}
            {(selectedBlock || newBlock) && (
                <BlockDetailPanel
                    key={
                        selectedBlock
                            ? `edit-${selectedBlock.id}`
                            : `new-${newBlock?.dayKey}-${newBlock?.startMinutes}`
                    }
                    mode={selectedBlock ? 'edit' : 'new'}
                    block={selectedBlock || undefined}
                    defaultStart={defaultStart}
                    defaultEnd={defaultEnd}
                    defaultTaskId={newBlock?.defaultTaskId} // Pass the task ID from Agenda
                    tasks={openTasks}
                    onSave={selectedBlock ? handleUpdateBlock : handleCreateBlock}
                    onDelete={selectedBlock ? handleDeleteBlock : undefined}
                    onStartFocus={handleStartFocus}
                    onClose={handleClosePanel}
                />
            )}
        </div>
    )
}

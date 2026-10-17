import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, StickyNote } from 'lucide-react'
import { useNotes, useScheduleRange, useTasksByView } from '../lib/hooks'
import { MiniMonth } from '../components/schedule/MiniMonth'
import { ScheduleGrid } from '../components/schedule/ScheduleGrid'
import { BlockDetailPanel } from '../components/schedule/BlockDetailPanel'
import {
    DEFAULT_DURATION_MINUTES,
    blockMinutes,
    composeLocalDateTime,
    dateKey,
    offsetDays,
    sevenDays,
    startOfWeek
} from '../lib/scheduleTime'

type ViewMode = 'day' | 'week'

interface NewBlockDraft {
    dayKey: string
    startMinutes: number
}

export function ScheduleView(): React.JSX.Element {
    const navigate = useNavigate()
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
    const { notes } = useNotes()

    const openTasks = useMemo(() => tasks.filter((t) => !t.done), [tasks])
    const recentNotes = useMemo(() => notes.slice(0, 3), [notes])

    const selectedBlock = useMemo(
        () => blocks.find((b) => b.id === selectedBlockId) ?? null,
        [blocks, selectedBlockId]
    )

    const stats = useMemo(() => {
        const count = blocks.length
        const totalMinutes = blocks.reduce(
            (sum, b) => sum + Math.max(0, blockMinutes(b.end_at) - blockMinutes(b.start_at)),
            0
        )
        const h = Math.floor(totalMinutes / 60)
        const m = totalMinutes % 60
        const timeLabel = h === 0 ? `${m}m` : m === 0 ? `${h}h` : `${h}h ${m}m`
        return { count, timeLabel }
    }, [blocks])

    const handlePrev = (): void => {
        setAnchor((d) => offsetDays(d, viewMode === 'day' ? -1 : -7))
    }
    const handleNext = (): void => {
        setAnchor((d) => offsetDays(d, viewMode === 'day' ? 1 : 7))
    }
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

    const handleCreateBlock = async (
        taskId: number,
        startAt: string,
        endAt: string
    ): Promise<void> => {
        await window.api.createBlock(taskId, startAt, endAt)
    }

    const handleUpdateBlock = async (
        _taskId: number,
        startAt: string,
        endAt: string
    ): Promise<void> => {
        if (!selectedBlock) return
        await window.api.updateBlock(selectedBlock.id, startAt, endAt)
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

    return (
        <div className="schedule-layout">
            {/* ── LEFT: sidebar ─────────── */}
            <aside className="schedule-sidebar">
                <div className="schedule-sidebar-top">
                    <MiniMonth anchor={anchor} onSelect={setAnchor} />

                    <div className="schedule-notes-section">
                        <div className="schedule-sidebar-label">Recent Notes</div>
                        <div className="schedule-notes-list">
                            {recentNotes.length === 0 ? (
                                <p className="schedule-sidebar-text">No notes yet.</p>
                            ) : (
                                recentNotes.map((n) => (
                                    <button
                                        key={n.id}
                                        className="schedule-note-item"
                                        onClick={() => navigate(`/notes/${n.id}`)}
                                    >
                                        <StickyNote size={12} strokeWidth={2} />
                                        <span className="schedule-note-title">
                                            {n.title || 'Untitled'}
                                        </span>
                                    </button>
                                ))
                            )}
                        </div>
                        <button
                            className="schedule-add-note-btn"
                            onClick={() => navigate('/notes')}
                        >
                            View all notes
                        </button>
                    </div>
                </div>

                {(selectedBlock || newBlock) && (
                    <div className="schedule-detail-section">
                        {selectedBlock && (
                            <BlockDetailPanel
                                key={`edit-${selectedBlock.id}`}
                                mode="edit"
                                block={selectedBlock}
                                tasks={openTasks}
                                onSave={handleUpdateBlock}
                                onDelete={handleDeleteBlock}
                                onStartFocus={handleStartFocus}
                                onClose={handleClosePanel}
                            />
                        )}
                        {newBlock && (
                            <BlockDetailPanel
                                key={`new-${newBlock.dayKey}-${newBlock.startMinutes}`}
                                mode="new"
                                defaultStart={defaultStart}
                                defaultEnd={defaultEnd}
                                tasks={openTasks}
                                onSave={handleCreateBlock}
                                onClose={handleClosePanel}
                            />
                        )}
                    </div>
                )}
            </aside>

            {/* ── RIGHT: main column ───────────── */}
            <div className="schedule-main">
                <div className="schedule-toolbar">
                    <div className="schedule-toolbar-info">
                        <h2 className="schedule-title">{headerLabel}</h2>
                        <span className="schedule-subtitle">
                            {stats.count} block{stats.count === 1 ? '' : 's'} · {stats.timeLabel}{' '}
                            planned
                        </span>
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
                </div>

                <ScheduleGrid
                    days={days}
                    blocks={blocks}
                    selectedBlockId={selectedBlockId}
                    onSelectBlock={handleSelectBlock}
                    onClickEmpty={handleClickEmpty}
                    onUpdateBlock={async (id, start, end) => {
                        await window.api.updateBlock(id, start, end)
                    }}
                />
            </div>
        </div>
    )
}

import { useEffect, useMemo, useState, useRef } from 'react'
import type { ScheduleBlockWithTask } from '../../../../shared/types'
import { ScheduleBlock } from './ScheduleBlock'
import {
    END_HOUR,
    HOURS_SHOWN,
    ROW_HEIGHT,
    SNAP_MINUTES,
    START_HOUR,
    blockDayKey,
    blockMinutes,
    dateKey,
    formatHour,
    sameDay,
    composeLocalDateTime
} from '../../lib/scheduleTime'

interface ScheduleGridProps {
    days: Date[]
    blocks: ScheduleBlockWithTask[]
    selectedBlockId: number | null
    onSelectBlock: (id: number) => void
    onClickEmpty: (dayKey: string, snappedMinutes: number) => void
    onUpdateBlock: (id: number, startAt: string, endAt: string) => Promise<void>
}

interface BlockWithOffset {
    block: ScheduleBlockWithTask
    offsetLevel: number
}

interface DragState {
    blockId: number
    mode: 'move' | 'resize'
    startX: number
    startY: number
    originalStartMin: number
    originalEndMin: number
    originalDayKey: string
    currentStartMin: number
    currentEndMin: number
    currentDayKey: string
    hasMoved: boolean
}

function computeOffsets(dayBlocks: ScheduleBlockWithTask[]): BlockWithOffset[] {
    const sorted = [...dayBlocks].sort((a, b) => a.start_at.localeCompare(b.start_at))
    const levels = new Map<number, number>()
    for (let i = 0; i < sorted.length; i++) {
        const b = sorted[i]
        const bs = blockMinutes(b.start_at)
        const be = blockMinutes(b.end_at)
        let maxOverlap = -1
        for (let j = 0; j < i; j++) {
            const o = sorted[j]
            const os = blockMinutes(o.start_at)
            const oe = blockMinutes(o.end_at)
            if (os < be && oe > bs) {
                maxOverlap = Math.max(maxOverlap, levels.get(o.id) ?? 0)
            }
        }
        levels.set(b.id, Math.min(maxOverlap + 1, 3))
    }
    return sorted.map((b) => ({ block: b, offsetLevel: levels.get(b.id) ?? 0 }))
}

export function ScheduleGrid({
    days,
    blocks,
    selectedBlockId,
    onSelectBlock,
    onClickEmpty,
    onUpdateBlock
}: ScheduleGridProps): React.JSX.Element {
    const gridHeight = HOURS_SHOWN * ROW_HEIGHT
    const today = new Date()
    const todayKey = dateKey(today)
    const [dragState, setDragState] = useState<DragState | null>(null)

    // Tracks if the last mouse interaction was with a block
    const interactedWithBlock = useRef(false)

    const blocksByDay = useMemo(() => {
        const map = new Map<string, ScheduleBlockWithTask[]>()
        for (const b of blocks) {
            const key = blockDayKey(b.start_at)
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(b)
        }
        return map
    }, [blocks])

    useEffect(() => {
        if (!dragState) return

        const handleMouseMove = (e: MouseEvent): void => {
            const deltaY = e.clientY - dragState.startY
            const deltaX = e.clientX - dragState.startX
            const hasMoved = dragState.hasMoved || Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3

            const deltaMins = Math.round(((deltaY / ROW_HEIGHT) * 60) / SNAP_MINUTES) * SNAP_MINUTES

            let newStart = dragState.originalStartMin
            let newEnd = dragState.originalEndMin

            if (dragState.mode === 'move') {
                newStart += deltaMins
                newEnd += deltaMins
            } else {
                newEnd = Math.max(newStart + SNAP_MINUTES, dragState.originalEndMin + deltaMins)
            }

            const dayStartLimit = START_HOUR * 60
            const dayEndLimit = END_HOUR * 60

            if (dragState.mode === 'move') {
                if (newStart < dayStartLimit) {
                    const shift = dayStartLimit - newStart
                    newStart += shift
                    newEnd += shift
                }
                if (newEnd > dayEndLimit) {
                    const shift = newEnd - dayEndLimit
                    newStart -= shift
                    newEnd -= shift
                }
            } else {
                if (newEnd > dayEndLimit) newEnd = dayEndLimit
            }

            let newDayKey = dragState.originalDayKey
            const elements = document.elementsFromPoint(e.clientX, e.clientY)
            const dayEl = elements.find((el) => el.hasAttribute('data-day'))
            if (dayEl) {
                newDayKey = dayEl.getAttribute('data-day')!
            }

            setDragState((prev) =>
                prev
                    ? {
                          ...prev,
                          hasMoved,
                          currentStartMin: newStart,
                          currentEndMin: newEnd,
                          currentDayKey: newDayKey
                      }
                    : null
            )
        }

        const handleMouseUp = async (): Promise<void> => {
            const {
                blockId,
                currentStartMin,
                currentEndMin,
                currentDayKey,
                originalStartMin,
                originalEndMin,
                originalDayKey,
                hasMoved
            } = dragState

            // Mark that we interacted with a block
            interactedWithBlock.current = true

            if (!hasMoved) {
                onSelectBlock(blockId)
            } else if (
                currentStartMin !== originalStartMin ||
                currentEndMin !== originalEndMin ||
                currentDayKey !== originalDayKey
            ) {
                const newStartAt = composeLocalDateTime(currentDayKey, currentStartMin)
                const newEndAt = composeLocalDateTime(currentDayKey, currentEndMin)
                await onUpdateBlock(blockId, newStartAt, newEndAt)
            }
            setDragState(null)
        }

        window.addEventListener('mousemove', handleMouseMove)
        window.addEventListener('mouseup', handleMouseUp)
        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [dragState, onUpdateBlock, onSelectBlock])

    const handleDayClick = (day: Date, e: React.MouseEvent<HTMLDivElement>): void => {
        // If we just clicked/dragged a block, ignore the resulting click on the grid
        if (interactedWithBlock.current) {
            interactedWithBlock.current = false
            return
        }

        if (dragState) return

        const target = e.currentTarget
        const rect = target.getBoundingClientRect()
        const y = e.clientY - rect.top
        const rawMinutes = (y / ROW_HEIGHT) * 60 + START_HOUR * 60
        const snapped = Math.round(rawMinutes / SNAP_MINUTES) * SNAP_MINUTES
        const clamped = Math.max(START_HOUR * 60, Math.min(snapped, END_HOUR * 60 - SNAP_MINUTES))
        onClickEmpty(dateKey(day), clamped)
    }

    const now = new Date()
    const currentMinutes = now.getHours() * 60 + now.getMinutes()
    const showTimeLine = currentMinutes >= START_HOUR * 60 && currentMinutes <= END_HOUR * 60
    const timeLineTop = ((currentMinutes - START_HOUR * 60) / 60) * ROW_HEIGHT

    return (
        <div className={`schedule-grid-scroll ${dragState ? 'is-dragging' : ''}`}>
            <div className="schedule-grid-headers">
                <div className="schedule-day-header-spacer" />
                {days.map((d) => {
                    const key = dateKey(d)
                    const isToday = key === todayKey
                    return (
                        <div key={key} className={`schedule-day-header ${isToday ? 'today' : ''}`}>
                            <span className="schedule-day-header-weekday">
                                {d.toLocaleDateString(undefined, { weekday: 'short' })}
                            </span>
                            <span className="schedule-day-header-date">{d.getDate()}</span>
                        </div>
                    )
                })}
            </div>

            <div className="schedule-grid" style={{ height: `${gridHeight}px` }}>
                <div className="schedule-time-gutter">
                    {Array.from({ length: HOURS_SHOWN }, (_, i) => (
                        <div
                            key={i}
                            className="schedule-hour-label"
                            style={{ height: `${ROW_HEIGHT}px` }}
                        >
                            {formatHour(START_HOUR + i)}
                        </div>
                    ))}
                </div>

                <div className="schedule-days">
                    {days.map((day) => {
                        const dayKey = dateKey(day)
                        const dayBlocks = blocksByDay.get(dayKey) ?? []
                        const withOffsets = computeOffsets(dayBlocks)
                        const isToday = sameDay(day, today)

                        return (
                            <div
                                key={dayKey}
                                className={`schedule-day ${isToday ? 'today' : ''}`}
                                onClick={(e) => handleDayClick(day, e)}
                                // Reset the interaction flag on any grid mousedown
                                onMouseDown={() => {
                                    interactedWithBlock.current = false
                                }}
                                data-day={dayKey}
                            >
                                {isToday && showTimeLine && !dragState && (
                                    <div
                                        className="schedule-now-line"
                                        style={{ top: `${timeLineTop}px` }}
                                    />
                                )}

                                {withOffsets.map(({ block, offsetLevel }) => {
                                    if (
                                        dragState?.blockId === block.id &&
                                        dragState.currentDayKey !== dayKey
                                    ) {
                                        return null
                                    }

                                    const displayBlock =
                                        dragState?.blockId === block.id
                                            ? {
                                                  ...block,
                                                  start_at: composeLocalDateTime(
                                                      dayKey,
                                                      dragState.currentStartMin
                                                  ),
                                                  end_at: composeLocalDateTime(
                                                      dayKey,
                                                      dragState.currentEndMin
                                                  )
                                              }
                                            : block

                                    return (
                                        <ScheduleBlock
                                            key={block.id}
                                            block={displayBlock}
                                            offsetLevel={offsetLevel}
                                            selected={block.id === selectedBlockId}
                                            isDragging={dragState?.blockId === block.id}
                                            onMouseDown={(e, mode) => {
                                                e.preventDefault()
                                                interactedWithBlock.current = true
                                                setDragState({
                                                    blockId: block.id,
                                                    mode,
                                                    startX: e.clientX,
                                                    startY: e.clientY,
                                                    originalStartMin: blockMinutes(block.start_at),
                                                    originalEndMin: blockMinutes(block.end_at),
                                                    originalDayKey: dayKey,
                                                    currentStartMin: blockMinutes(block.start_at),
                                                    currentEndMin: blockMinutes(block.end_at),
                                                    currentDayKey: dayKey,
                                                    hasMoved: false
                                                })
                                            }}
                                        />
                                    )
                                })}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

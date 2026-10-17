import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { dateKey, sameDay, startOfWeek } from '../../lib/scheduleTime'

interface MiniMonthProps {
    anchor: Date
    onSelect: (d: Date) => void
}

const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
]
const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

export function MiniMonth({ anchor, onSelect }: MiniMonthProps): React.JSX.Element {
    const [month, setMonth] = useState<Date>(() => {
        const d = new Date(anchor)
        d.setDate(1)
        d.setHours(0, 0, 0, 0)
        return d
    })

    const today = new Date()
    const weekStartKey = dateKey(startOfWeek(anchor))
    const weekEndKey = dateKey(new Date(startOfWeek(anchor).getTime() + 6 * 86400000))

    // Build the grid: from Monday before the 1st, to Sunday after the last.
    const firstOfMonth = new Date(month)
    const firstGridDay = startOfWeek(firstOfMonth)

    const cells: Date[] = []
    for (let i = 0; i < 42; i++) {
        const d = new Date(firstGridDay)
        d.setDate(firstGridDay.getDate() + i)
        cells.push(d)
    }

    const prevMonth = (): void => {
        const d = new Date(month)
        d.setMonth(month.getMonth() - 1)
        setMonth(d)
    }
    const nextMonth = (): void => {
        const d = new Date(month)
        d.setMonth(month.getMonth() + 1)
        setMonth(d)
    }

    return (
        <div className="mini-month">
            <div className="mini-month-header">
                <span className="mini-month-label">
                    {MONTHS[month.getMonth()]} {month.getFullYear()}
                </span>
                <div className="mini-month-nav">
                    <button onClick={prevMonth} aria-label="Previous month">
                        <ChevronLeft size={13} strokeWidth={2} />
                    </button>
                    <button onClick={nextMonth} aria-label="Next month">
                        <ChevronRight size={13} strokeWidth={2} />
                    </button>
                </div>
            </div>

            <div className="mini-month-grid">
                {DAY_LABELS.map((l, i) => (
                    <div key={i} className="mini-month-weekday">
                        {l}
                    </div>
                ))}
                {cells.map((d, i) => {
                    const key = dateKey(d)
                    const inMonth = d.getMonth() === month.getMonth()
                    const isToday = sameDay(d, today)
                    const inWeek = key >= weekStartKey && key <= weekEndKey
                    const cls = [
                        'mini-month-day',
                        inMonth ? '' : 'muted',
                        isToday ? 'today' : '',
                        inWeek ? 'in-week' : ''
                    ]
                        .filter(Boolean)
                        .join(' ')
                    return (
                        <button key={i} className={cls} onClick={() => onSelect(d)}>
                            {d.getDate()}
                        </button>
                    )
                })}
            </div>
        </div>
    )
}

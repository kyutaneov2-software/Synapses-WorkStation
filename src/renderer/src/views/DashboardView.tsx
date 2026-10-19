import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, TrendingUp, AlertCircle, CheckCircle2, CalendarDays, Target } from 'lucide-react'
import type { Project } from '../../../shared/types'
import { formatHM } from '../lib/time'
import { useDashboard } from '../lib/hooks'
import { isOverdue, parseSqliteMs } from '../lib/dates'
import { formatMoney } from '../../../shared/money'

// ── Helper Components ─────────────────────────────────────────

function LiveClock(): React.JSX.Element {
    const [time, setTime] = useState(new Date())

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const hours = time.getHours()
    const greeting = hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening'

    return (
        <div className="clock-widget">
            <div className="clock-greeting">{greeting}</div>
            <div className="clock-time">
                {time.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                <span className="clock-seconds">
                    {time.toLocaleTimeString(undefined, { second: '2-digit' }).replace(/\D/g, '')}
                </span>
            </div>
            <div className="clock-date">
                {time.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                })}
            </div>
        </div>
    )
}

// A simple, dependency-free SVG line chart for the "Focus This Week" widget.
function FocusLineChart({ data }: { data: number[] }): React.JSX.Element {
    const width = 400
    const height = 120
    const padding = 10
    const max = Math.max(...data, 1) // Prevent div by zero

    // Convert data points to SVG coordinates
    const points = data
        .map((val, i) => {
            const x = (i / (data.length - 1)) * (width - padding * 2) + padding
            const y = height - (val / max) * (height - padding * 2) - padding
            return `${x},${y}`
        })
        .join(' ')

    // Generate an area fill path
    const areaPath = `M ${padding},${height - padding} L ${points.replace(/ /g, ' L ')} L ${width - padding},${height - padding} Z`

    return (
        <svg
            viewBox={`0 0 ${width} ${height}`}
            className="line-chart-svg"
            preserveAspectRatio="none"
        >
            <defs>
                <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill="url(#chart-fill)" />
            <polyline
                points={points}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            {/* Render dots for each day */}
            {data.map((_, i) => {
                const [x, y] = points.split(' ')[i].split(',')
                return (
                    <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r="4"
                        fill="var(--bg-1)"
                        stroke="var(--accent)"
                        strokeWidth="2"
                    />
                )
            })}
        </svg>
    )
}

// ── Main View ─────────────────────────────────────────────────

interface DeadlineItem {
    id: string
    title: string
    projectTitle?: string
    date: string
    daysAway: number
    type: 'task' | 'project'
}

interface ProjectHealth {
    project: Project
    tasksTotal: number
    tasksDone: number
    taskProgress: number
    moneyPaid: number
    moneyTotal: number
    moneyProgress: number
}

export function DashboardView(): React.JSX.Element {
    const { data } = useDashboard()

    // Fake data for the chart to demonstrate the UI.
    // In a full release, you would add an IPC handler to fetch daily focus stats.
    const mockWeeklyFocus = [30, 45, 20, 90, 60, 120, 45]

    const displayCurrency = useMemo(() => {
        if (!data || data.projects.length === 0) return 'USD'
        const counts = new Map<string, number>()
        for (const p of data.projects) {
            counts.set(p.currency, (counts.get(p.currency) || 0) + 1)
        }
        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0]
    }, [data])

    const stats = useMemo(() => {
        if (!data) return null
        const { tasks, phases, projects } = data
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)

        const relevant = phases.filter(
            (p) => projects.find((proj) => proj.id === p.project_id)?.currency === displayCurrency
        )

        const earned = relevant.filter((p) => p.paid).reduce((s, p) => s + p.amount_cents, 0)
        const outstanding = relevant.filter((p) => !p.paid).reduce((s, p) => s + p.amount_cents, 0)
        const overdueTasks = tasks.filter((t) => !t.done && isOverdue(t.due_date)).length
        const overdueProjects = projects.filter(
            (p) =>
                p.due_date && p.status !== 'completed' && new Date(p.due_date + 'T00:00:00') < today
        ).length

        return {
            earned,
            outstanding,
            overdueTasks,
            overdueProjects,
            openTasks: tasks.filter((t) => !t.done).length,
            doneThisWeek: tasks.filter(
                (t) =>
                    t.done && t.completed_at && parseSqliteMs(t.completed_at) >= weekAgo.getTime()
            ).length
        }
    }, [data, displayCurrency])

    const deadlines = useMemo(() => {
        if (!data) return []
        const projectById = new Map(data.projects.map((p) => [p.id, p]))
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        const weekFromNow = new Date(today)
        weekFromNow.setDate(weekFromNow.getDate() + 8)
        const items: DeadlineItem[] = []

        for (const t of data.tasks) {
            if (t.done || !t.due_date) continue
            const d = new Date(t.due_date + 'T00:00:00')
            if (d >= weekFromNow) continue
            const project = t.project_id ? projectById.get(t.project_id) : undefined
            items.push({
                id: `task-${t.id}`,
                title: t.text,
                projectTitle: project?.title,
                date: t.due_date,
                daysAway: Math.round((d.getTime() - today.getTime()) / 86400000),
                type: 'task'
            })
        }
        for (const p of data.projects) {
            if (!p.due_date || p.status === 'completed') continue
            const d = new Date(p.due_date + 'T00:00:00')
            if (d >= weekFromNow) continue
            items.push({
                id: `project-${p.id}`,
                title: p.title,
                date: p.due_date,
                daysAway: Math.round((d.getTime() - today.getTime()) / 86400000),
                type: 'project'
            })
        }
        return items.sort((a, b) => a.date.localeCompare(b.date))
    }, [data])

    const projectHealth = useMemo<ProjectHealth[]>(() => {
        if (!data) return []
        return data.projects
            .map((project) => {
                const projectTasks = data.tasks.filter((t) => t.project_id === project.id)
                const doneTasks = projectTasks.filter((t) => t.done).length
                const projectPhases = data.phases.filter(
                    (p) => p.project_id === project.id && p.currency === project.currency
                )
                const moneyPaid = projectPhases
                    .filter((p) => p.paid)
                    .reduce((s, p) => s + p.amount_cents, 0)
                const moneyTotal = projectPhases.reduce((s, p) => s + p.amount_cents, 0)
                return {
                    project,
                    tasksTotal: projectTasks.length,
                    tasksDone: doneTasks,
                    taskProgress: projectTasks.length ? doneTasks / projectTasks.length : 0,
                    moneyPaid,
                    moneyTotal,
                    moneyProgress: moneyTotal ? moneyPaid / moneyTotal : 0
                }
            })
            .filter((h) => h.tasksTotal > 0 || h.moneyTotal > 0)
            .sort((a, b) => b.tasksTotal - a.tasksTotal)
    }, [data])

    if (!data || !stats)
        return (
            <div className="view">
                <p>Loading…</p>
            </div>
        )

    const hasAnyTime = data.sessionTotals.totalSeconds > 0

    return (
        <div className="dashboard-layout">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="dashboard-grid"
            >
                {/* ── 1. HERO SECTION ──────────────────────────────── */}
                <div className="bento-card hero-bento">
                    <LiveClock />
                    <div className="hero-summary">
                        <h3>Today at a glance</h3>
                        <p>
                            You have <strong>{stats.openTasks}</strong> open tasks and{' '}
                            <strong>{deadlines.filter((d) => d.daysAway <= 0).length}</strong>{' '}
                            deadlines hitting today.
                        </p>
                    </div>
                </div>

                {/* ── 2. LINE CHART SECTION ────────────────────────── */}
                <div className="bento-card chart-bento">
                    <div className="bento-header">
                        <div className="bento-title">
                            <TrendingUp size={16} className="text-accent" />
                            <span>Focus Trends (7 Days)</span>
                        </div>
                        <span className="bento-badge">+12% vs last week</span>
                    </div>
                    <FocusLineChart data={mockWeeklyFocus} />
                </div>

                {/* ── 3. STAT CARDS ────────────────────────────────── */}
                <div className="stat-grid">
                    <div className="stat-card stat-green">
                        <div className="stat-icon">
                            <TrendingUp size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Earned</span>
                            <span className="stat-value">
                                {formatMoney(stats.earned, displayCurrency)}
                            </span>
                        </div>
                    </div>
                    <div className="stat-card stat-amber">
                        <div className="stat-icon">
                            <Clock size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Outstanding</span>
                            <span className="stat-value">
                                {formatMoney(stats.outstanding, displayCurrency)}
                            </span>
                        </div>
                    </div>
                    <div className="stat-card stat-purple">
                        <div className="stat-icon">
                            <Target size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Tracked Time</span>
                            <span className="stat-value">
                                {hasAnyTime ? formatHM(data.sessionTotals.thisWeekSeconds) : '0m'}
                            </span>
                        </div>
                    </div>
                    <div
                        className={`stat-card ${stats.overdueTasks + stats.overdueProjects > 0 ? 'stat-red' : 'stat-neutral'}`}
                    >
                        <div className="stat-icon">
                            <AlertCircle size={20} />
                        </div>
                        <div className="stat-info">
                            <span className="stat-label">Overdue</span>
                            <span className="stat-value">
                                {stats.overdueTasks + stats.overdueProjects}
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── 4. DEADLINES WIDGET ──────────────────────────── */}
                <div className="bento-card deadlines-bento">
                    <div className="bento-header">
                        <div className="bento-title">
                            <CalendarDays size={16} />
                            <span>Upcoming Deadlines</span>
                        </div>
                    </div>
                    {deadlines.length === 0 ? (
                        <p className="panel-empty">Nothing due this week.</p>
                    ) : (
                        <div className="deadline-list">
                            {deadlines.map((d) => (
                                <div
                                    key={d.id}
                                    className={`deadline-row ${d.daysAway < 0 ? 'overdue' : ''}`}
                                >
                                    <div className="deadline-badge">
                                        {d.daysAway < 0
                                            ? 'LATE'
                                            : d.daysAway === 0
                                              ? 'TODAY'
                                              : `${d.daysAway}d`}
                                    </div>
                                    <div className="deadline-body">
                                        <span className="deadline-title">{d.title}</span>
                                        {d.projectTitle && (
                                            <span className="deadline-project">
                                                {d.projectTitle}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── 5. PROJECT HEALTH WIDGET ─────────────────────── */}
                <div className="bento-card health-bento">
                    <div className="bento-header">
                        <div className="bento-title">
                            <CheckCircle2 size={16} />
                            <span>Project Health</span>
                        </div>
                    </div>
                    <div className="health-list">
                        {projectHealth.map((h) => (
                            <div key={h.project.id} className="health-row">
                                <div className="health-header">
                                    <span className="health-title">{h.project.title}</span>
                                    <span className="health-money">
                                        {Math.round(h.moneyProgress * 100)}% Paid
                                    </span>
                                </div>
                                <div className="health-bars">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill progress-blue"
                                            style={{ width: `${h.taskProgress * 100}%` }}
                                        />
                                    </div>
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill progress-green"
                                            style={{ width: `${h.moneyProgress * 100}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>
        </div>
    )
}

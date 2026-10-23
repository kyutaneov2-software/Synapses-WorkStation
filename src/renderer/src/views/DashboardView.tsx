import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
    TrendingUp,
    AlertCircle,
    CheckCircle2,
    CalendarDays,
    PieChart as PieChartIcon
} from 'lucide-react'
import type { Project, DashboardData } from '../../../shared/types'
import { formatHM } from '../lib/time'
import { useDashboard } from '../lib/hooks'
import { isOverdue } from '../lib/dates'
import { formatMoney } from '../../../shared/money'

// ── Animation Variants ────────────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
} as const

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
                <motion.span
                    key={time.getSeconds()}
                    initial={{ opacity: 0.5, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="clock-seconds"
                >
                    {time.toLocaleTimeString(undefined, { second: '2-digit' }).replace(/\D/g, '')}
                </motion.span>
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

function FocusLineChart({ data, labels }: { data: number[]; labels: string[] }): React.JSX.Element {
    const width = 400
    const height = 120
    const paddingX = 20
    const paddingTop = 10
    const paddingBottom = 30

    const max = Math.max(...data, 1)

    const points = data.map((val, i) => {
        const x = (i / (data.length - 1)) * (width - paddingX * 2) + paddingX
        const y = height - paddingBottom - (val / max) * (height - paddingTop - paddingBottom)
        return { x, y, val, label: labels[i] }
    })

    const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ')
    const areaPath = `M ${paddingX},${height - paddingBottom} L ${polylinePoints.replace(/ /g, ' L ')} L ${width - paddingX},${height - paddingBottom} Z`

    // Gridlines (3 horizontal lines)
    const gridlines = [0.25, 0.5, 0.75].map((pct) => {
        const y = height - paddingBottom - pct * (height - paddingTop - paddingBottom)
        return y
    })

    return (
        <div className="chart-wrapper">
            <svg
                viewBox={`0 0 ${width} ${height}`}
                className="line-chart-svg"
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id="chart-fill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6294FF" stopOpacity="0.2" />
                        <stop offset="100%" stopColor="#6294FF" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Gridlines */}
                {gridlines.map((y, i) => (
                    <line
                        key={i}
                        x1={paddingX}
                        y1={y}
                        x2={width - paddingX}
                        y2={y}
                        stroke="#2A2E38"
                        strokeWidth="1"
                        strokeDasharray="4 4"
                    />
                ))}

                <motion.path
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.5 }}
                    d={areaPath}
                    fill="url(#chart-fill)"
                />

                <motion.polyline
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeInOut' }}
                    points={polylinePoints}
                    fill="none"
                    stroke="#6294FF"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* X-Axis Labels */}
                {points.map((p, i) => (
                    <text
                        key={i}
                        x={p.x}
                        y={height - 10}
                        fill="#9299AA"
                        fontSize="10"
                        textAnchor="middle"
                        fontFamily="Inter"
                    >
                        {p.label}
                    </text>
                ))}

                {/* Data Points with Native Tooltips */}
                {points.map((p, i) => (
                    <motion.circle
                        key={i}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.5 + i * 0.1, type: 'spring' }}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#15171D"
                        stroke="#6294FF"
                        strokeWidth="2"
                        style={{ cursor: 'pointer' }}
                    >
                        <title>{`${p.label}: ${formatHM(p.val * 60)}`}</title>
                    </motion.circle>
                ))}
            </svg>
        </div>
    )
}

interface ChartSegment {
    id: number | string
    title: string
    seconds: number
    dash: number
    offset: number
    color: string
}

// Add this interface right above the ProjectDoughnutChart function
interface RawChartData {
    id: number | string
    title: string
    seconds: number
}

function ProjectDoughnutChart({
    sessionTotals,
    projects
}: {
    sessionTotals: DashboardData['sessionTotals']
    projects: Project[]
}): React.JSX.Element {
    const totalSeconds = sessionTotals.totalSeconds

    // Calculate unassigned time
    const assignedSeconds = Object.values(sessionTotals.byProject).reduce(
        (sum, val) => sum + val,
        0
    )
    const unassignedSeconds = totalSeconds - assignedSeconds

    // FIX: Explicitly type the array as RawChartData[] to allow string IDs
    const projectData: RawChartData[] = Object.entries(sessionTotals.byProject)
        .map(([id, seconds]) => {
            const project = projects.find((p) => p.id === Number(id))
            return {
                id: Number(id),
                title: project?.title || 'Unknown Project',
                seconds: seconds as number
            }
        })
        .filter((d) => d.seconds > 0)

    // Add unassigned time as a segment if it exists
    if (unassignedSeconds > 0) {
        projectData.push({ id: 'unassigned', title: 'Unassigned', seconds: unassignedSeconds })
    }

    projectData.sort((a, b) => b.seconds - a.seconds)

    if (totalSeconds === 0 || projectData.length === 0) {
        return (
            <div className="empty-state-chart">
                <PieChartIcon size={32} opacity={0.3} />
                <p>No focus time recorded yet</p>
            </div>
        )
    }

    const colors = ['#6294FF', '#43D69A', '#9D84FF', '#F4BC34', '#F87171', '#64748B']
    const radius = 60
    const circumference = 2 * Math.PI * radius

    const { segments } = projectData.reduce(
        (acc, d, i) => {
            const pct = d.seconds / totalSeconds
            const dash = pct * circumference
            const offset = -acc.runningOffset
            acc.segments.push({
                ...d,
                dash,
                offset,
                color: d.id === 'unassigned' ? '#64748B' : colors[i % (colors.length - 1)]
            })
            acc.runningOffset += dash
            return acc
        },
        { segments: [] as ChartSegment[], runningOffset: 0 }
    )

    return (
        <div className="doughnut-container">
            <div className="doughnut-graphic">
                <svg viewBox="0 0 160 160" className="doughnut-svg">
                    <g transform="rotate(-90 80 80)">
                        {segments.map((d, i) => (
                            <motion.circle
                                key={d.id}
                                initial={{ strokeDasharray: `0 ${circumference}` }}
                                animate={{ strokeDasharray: `${d.dash} ${circumference}` }}
                                transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                                cx="80"
                                cy="80"
                                r={radius}
                                fill="none"
                                stroke={d.color}
                                strokeWidth="24"
                                strokeDashoffset={d.offset}
                                strokeLinecap="butt"
                            />
                        ))}
                    </g>
                </svg>
                <div className="doughnut-center">
                    <span className="doughnut-total">{formatHM(totalSeconds)}</span>
                    <span className="doughnut-label">Total Focus</span>
                </div>
            </div>
            <div className="doughnut-legend">
                {segments.map((d) => (
                    <div key={d.id} className="legend-item">
                        <span className="legend-color" style={{ background: d.color }} />
                        <span className="legend-name">{d.title}</span>
                        <span className="legend-value">{formatHM(d.seconds)}</span>
                    </div>
                ))}
            </div>
        </div>
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

    // Generate dynamic mock data for the last 7 days
    const last7DaysLabels = Array.from({ length: 7 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() - (6 - i))
        return d.toLocaleDateString(undefined, { weekday: 'short' })
    })
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
            openTasks: tasks.filter((t) => !t.done).length
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
                const projectPhases = data.phases.filter(
                    (p) => p.project_id === project.id && p.currency === project.currency
                )
                const moneyPaid = projectPhases
                    .filter((p) => p.paid)
                    .reduce((s, p) => s + p.amount_cents, 0)
                const moneyTotal = projectPhases.reduce((s, p) => s + p.amount_cents, 0)
                return {
                    project,
                    moneyPaid,
                    moneyTotal,
                    moneyProgress: moneyTotal ? moneyPaid / moneyTotal : 0,
                    tasksTotal: 0,
                    tasksDone: 0,
                    taskProgress: 0
                }
                // REMOVED the filter that was hiding projects with 0 phases
            })
            .sort((a, b) => b.moneyProgress - a.moneyProgress)
    }, [data])

    if (!data || !stats)
        return (
            <div className="view">
                <p>Loading…</p>
            </div>
        )

    return (
        <div className="dashboard-container">
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="dashboard-header"
            >
                <h1>Dashboard</h1>
                <p>An overview of your activity, focus, and projects.</p>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="dashboard-grid"
            >
                {/* ── ROW 1: Analytics ───────────────────── */}
                <motion.div variants={cardVariants} className="bento-card chart-bento">
                    <div className="bento-header">
                        <div className="bento-title">
                            <TrendingUp size={16} className="text-accent" />
                            <span>Focus Trends (7 Days)</span>
                        </div>
                        <span className="bento-badge">+12% vs last week</span>
                    </div>
                    <FocusLineChart data={mockWeeklyFocus} labels={last7DaysLabels} />
                </motion.div>

                <motion.div variants={cardVariants} className="bento-card doughnut-bento">
                    <div className="bento-header">
                        <div className="bento-title">
                            <PieChartIcon size={16} className="text-accent" />
                            <span>Tracked Time by Project</span>
                        </div>
                    </div>
                    <ProjectDoughnutChart
                        sessionTotals={data.sessionTotals}
                        projects={data.projects}
                    />
                </motion.div>

                {/* ── ROW 2: Summary & Clock ─────────────── */}
                <motion.div variants={cardVariants} className="bento-card hero-bento">
                    <LiveClock />
                    <div className="hero-summary">
                        <h3>Today at a glance</h3>
                        <p>
                            You have <strong>{stats.openTasks}</strong> open tasks and{' '}
                            <strong>{deadlines.filter((d) => d.daysAway <= 0).length}</strong>{' '}
                            deadlines hitting today.
                        </p>
                    </div>
                </motion.div>

                <motion.div variants={cardVariants} className="bento-card financial-bento">
                    <div className="bento-header">
                        <div className="bento-title">
                            <AlertCircle size={16} />
                            <span>Financial Summary</span>
                        </div>
                    </div>
                    <div className="financial-content">
                        <div className="financial-primary">
                            <span className="financial-label">Earned</span>
                            <span className="financial-value-lg text-green">
                                {formatMoney(stats.earned, displayCurrency)}
                            </span>
                        </div>
                        <div className="financial-secondary">
                            <div className="financial-row">
                                <span className="financial-label">Outstanding</span>
                                <span className="financial-value-md text-amber">
                                    {formatMoney(stats.outstanding, displayCurrency)}
                                </span>
                            </div>
                            <div className="financial-row">
                                <span className="financial-label">Overdue Items</span>
                                <span
                                    className={`financial-value-sm ${stats.overdueTasks + stats.overdueProjects > 0 ? 'text-red' : 'text-muted'}`}
                                >
                                    {stats.overdueTasks + stats.overdueProjects}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* ── ROW 3: Deadlines & Health ──────────── */}
                <motion.div variants={cardVariants} className="bento-card deadlines-bento">
                    <div className="bento-header">
                        <div className="bento-title">
                            <CalendarDays size={16} />
                            <span>Upcoming Deadlines</span>
                        </div>
                    </div>
                    {deadlines.length === 0 ? (
                        <div className="empty-state-mini">
                            <p>Nothing due this week.</p>
                        </div>
                    ) : (
                        <div className="deadline-list">
                            {deadlines.map((d) => (
                                <motion.div
                                    key={d.id}
                                    whileHover={{ x: 4, backgroundColor: 'rgba(255,255,255,0.02)' }}
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
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div variants={cardVariants} className="bento-card health-bento">
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
                                <div className="progress-track">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${h.moneyProgress * 100}%` }}
                                        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                                        className="progress-fill"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </motion.div>
        </div>
    )
}

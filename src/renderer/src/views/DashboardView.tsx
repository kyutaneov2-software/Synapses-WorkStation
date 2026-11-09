import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart as PieChartIcon } from 'lucide-react'
import type { Project, DashboardData } from '../../../shared/types'
import { formatHM } from '../lib/time'
import { useDashboard } from '../lib/hooks'
import { isOverdue } from '../lib/dates'
import { formatMoney } from '../../../shared/money'
import { useSettings } from '../lib/hooks'

const easeOut = [0.16, 1, 0.3, 1] as const

const containerVariants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: { staggerChildren: 0.05, delayChildren: 0.05 }
    }
}

const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    show: {
        opacity: 1,
        y: 0,
        transition: { type: 'spring', stiffness: 280, damping: 28 }
    }
} as const

const CHART_COLORS = [
    'var(--accent)',
    'var(--success)',
    'var(--purple)',
    'var(--warning)',
    'var(--danger)'
] as const
const UNASSIGNED_COLOR = 'var(--text-2)'

function LiveClock(): React.JSX.Element {
    const [time, setTime] = useState(new Date())
    const { settings } = useSettings()

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000)
        return () => clearInterval(timer)
    }, [])

    const hours = time.getHours()
    const baseGreeting =
        hours < 12 ? 'Good morning' : hours < 18 ? 'Good afternoon' : 'Good evening'

    const greeting = settings.username ? `${baseGreeting}, ${settings.username}` : baseGreeting

    return (
        <div className="hero-clock-block">
            <span className="hero-clock-greeting">{greeting}</span>
            <div className="hero-clock-time" data-time>
                {time.toLocaleTimeString(undefined, {
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
            <span className="hero-clock-date">
                {time.toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric'
                })}
            </span>
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
    const assignedSeconds = Object.values(sessionTotals.byProject).reduce((s, v) => s + v, 0)
    const unassignedSeconds = totalSeconds - assignedSeconds

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
                color:
                    d.id === 'unassigned' ? UNASSIGNED_COLOR : CHART_COLORS[i % CHART_COLORS.length]
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
                                transition={{ duration: 0.9, delay: i * 0.08, ease: easeOut }}
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
    moneyPaid: number
    moneyTotal: number
    moneyProgress: number
}

export function DashboardView(): React.JSX.Element {
    const { data } = useDashboard()
    const { settings } = useSettings()

    const chartData = data?.sessionTotals.last7Days ?? []

    // FIX: Find the currency that actually has money attached to it.
    // If all are 0, fall back to the most frequently used currency.
    const displayCurrency = useMemo(() => {
        // 1. If no data or no projects, use the user's default setting
        if (!data || data.projects.length === 0) return settings.defaultCurrency

        // 2. Otherwise, still try to find the most common currency from actual projects
        const counts = new Map<string, number>()
        for (const p of data.projects) {
            counts.set(p.currency, (counts.get(p.currency) || 0) + 1)
        }

        // 3. If all projects are empty (0 count), fall back to settings
        if (counts.size === 0) return settings.defaultCurrency

        return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0][0]
    }, [data, settings.defaultCurrency])

    const stats = useMemo(() => {
        if (!data) return null
        const { tasks, phases, projects } = data
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const relevant = phases.filter((p) => {
            const proj = projects.find((proj) => proj.id === p.project_id)
            const projCurrency = proj?.currency || 'USD'
            return projCurrency === displayCurrency
        })

        const earned = relevant.filter((p) => p.paid).reduce((s, p) => s + p.amount_cents, 0)
        const outstanding = relevant.filter((p) => !p.paid).reduce((s, p) => s + p.amount_cents, 0)
        const totalContract = earned + outstanding
        const collectedPct = totalContract > 0 ? Math.round((earned / totalContract) * 100) : 0

        const overdueTasks = tasks.filter((t) => !t.done && isOverdue(t.due_date)).length
        const overdueProjects = projects.filter(
            (p) =>
                p.due_date && p.status !== 'completed' && new Date(p.due_date + 'T00:00:00') < today
        ).length

        return {
            earned,
            outstanding,
            collectedPct,
            overdueTasks,
            overdueProjects,
            openTasks: tasks.filter((t) => !t.done).length
        }
    }, [data, displayCurrency])

    const todayFocusSeconds = chartData.length > 0 ? chartData[chartData.length - 1].seconds : 0

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
                // FIX: Removed the invalid `p.currency === project.currency` check
                const projectPhases = data.phases.filter((p) => p.project_id === project.id)
                const moneyPaid = projectPhases
                    .filter((p) => p.paid)
                    .reduce((s, p) => s + p.amount_cents, 0)
                const moneyTotal = projectPhases.reduce((s, p) => s + p.amount_cents, 0)
                return {
                    project,
                    moneyPaid,
                    moneyTotal,
                    moneyProgress: moneyTotal ? moneyPaid / moneyTotal : 0
                }
            })
            .sort((a, b) => b.moneyProgress - a.moneyProgress)
    }, [data])

    const dueToday = deadlines.filter((d) => d.daysAway <= 0).length
    const overdueTotal = stats ? stats.overdueTasks + stats.overdueProjects : 0

    if (!data || !stats) {
        return (
            <div className="view">
                <p>Loading…</p>
            </div>
        )
    }

    return (
        <div className="dashboard-container">
            <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: easeOut }}
                className="dashboard-ribbon"
            >
                <div className="ribbon-greeting">
                    <h1>Dashboard</h1>
                    <p>Your freelance command deck — focus, money, and momentum.</p>
                </div>
                <div className="ribbon-kpis">
                    <div className="ribbon-kpi">
                        <span className="ribbon-kpi-label">Focus Today</span>
                        <span className="ribbon-kpi-value" data-time>
                            {formatHM(todayFocusSeconds)}
                        </span>
                    </div>
                    <div className="ribbon-kpi">
                        <span className="ribbon-kpi-label">Open Tasks</span>
                        <span className="ribbon-kpi-value" data-tabular>
                            {stats.openTasks}
                        </span>
                    </div>
                    <div className={`ribbon-kpi ${overdueTotal > 0 ? 'alert' : ''}`}>
                        <span className="ribbon-kpi-label">Overdue</span>
                        <span className="ribbon-kpi-value" data-tabular>
                            {overdueTotal}
                        </span>
                    </div>
                </div>
            </motion.div>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="dashboard-grid"
            >
                <div className="dashboard-main">
                    <motion.div variants={cardVariants} className="deck-card hero-card">
                        <div className="hero-top">
                            <LiveClock />
                            <div className="hero-live-pill">
                                <span className="live-dot" />
                                Live
                            </div>
                        </div>

                        <div className="hero-summary">
                            <span>
                                You have <strong>{stats.openTasks}</strong> open tasks
                            </span>
                            <span className="hero-summary-sep">·</span>
                            <span>
                                <strong>{dueToday}</strong> hitting today
                            </span>
                            {overdueTotal > 0 && (
                                <>
                                    <span className="hero-summary-sep">·</span>
                                    <span style={{ color: 'var(--danger)' }}>
                                        <strong>{overdueTotal}</strong> overdue
                                    </span>
                                </>
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={cardVariants} className="deck-card finance-card">
                        <div className="finance-header">
                            <span className="finance-label">Earned</span>
                            <span className="finance-period">Across all projects</span>
                        </div>
                        <div className="finance-hero-value text-green" data-money>
                            {formatMoney(stats.earned, displayCurrency)}
                        </div>
                        <div className="finance-progress">
                            <div className="finance-progress-bar">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${stats.collectedPct}%` }}
                                    transition={{ duration: 0.9, delay: 0.2, ease: easeOut }}
                                    className="finance-progress-fill"
                                />
                            </div>
                            <span className="finance-progress-label">
                                {stats.collectedPct}% collected
                            </span>
                        </div>
                        <div className="finance-outstanding">
                            <div className="finance-outstanding-row">
                                <span className="finance-outstanding-label">Outstanding</span>
                                <span className="finance-outstanding-value" data-money>
                                    {formatMoney(stats.outstanding, displayCurrency)}
                                </span>
                            </div>
                            {overdueTotal > 0 && (
                                <span className="finance-overdue-pill">
                                    <span className="finance-overdue-dot" />
                                    {overdueTotal} overdue
                                </span>
                            )}
                        </div>
                    </motion.div>

                    <motion.div variants={cardVariants} className="deck-card health-card">
                        <div className="health-header">
                            <span className="health-title">Project Health</span>
                            <span className="health-meta" data-tabular>
                                {projectHealth.length} active
                            </span>
                        </div>
                        {projectHealth.length === 0 ? (
                            <div className="empty-state-mini">
                                <p>No projects yet.</p>
                            </div>
                        ) : (
                            <div className="health-grid">
                                {projectHealth.map((h) => (
                                    <div key={h.project.id} className="health-mini">
                                        <div className="health-mini-title">{h.project.title}</div>
                                        <div className="health-mini-progress">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${h.moneyProgress * 100}%` }}
                                                transition={{
                                                    duration: 0.8,
                                                    delay: 0.1,
                                                    ease: easeOut
                                                }}
                                                className="health-mini-fill"
                                            />
                                        </div>
                                        <div className="health-mini-pct">
                                            {Math.round(h.moneyProgress * 100)}% paid
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                <div className="dashboard-rail">
                    <motion.div variants={cardVariants} className="deck-card doughnut-card">
                        <div className="doughnut-header">
                            <span className="doughnut-title">Time by Project</span>
                            <span className="doughnut-subtitle">All-time focus</span>
                        </div>
                        <ProjectDoughnutChart
                            sessionTotals={data.sessionTotals}
                            projects={data.projects}
                        />
                    </motion.div>

                    <motion.div variants={cardVariants} className="deck-card deadlines-card">
                        <div className="deadlines-header">
                            <span className="deadlines-title">Upcoming</span>
                            <span className="deadlines-count" data-tabular>
                                {deadlines.length}
                            </span>
                        </div>
                        {deadlines.length === 0 ? (
                            <div className="empty-state-mini">
                                <p>Nothing due this week. Breathe.</p>
                            </div>
                        ) : (
                            <div className="deadlines-list">
                                {deadlines.map((d) => {
                                    const isOverdue = d.daysAway < 0
                                    const isSoon = d.daysAway >= 0 && d.daysAway <= 2
                                    return (
                                        <div
                                            key={d.id}
                                            className={`deadline-item ${isOverdue ? 'overdue' : isSoon ? 'soon' : ''}`}
                                        >
                                            <div className="deadline-marker">
                                                <div className="deadline-dot" />
                                                <div className="deadline-line" />
                                            </div>
                                            <div className="deadline-content">
                                                <span className="deadline-when">
                                                    {isOverdue
                                                        ? 'Overdue'
                                                        : d.daysAway === 0
                                                          ? 'Today'
                                                          : d.daysAway === 1
                                                            ? 'Tomorrow'
                                                            : `In ${d.daysAway}d`}
                                                </span>
                                                <span className="deadline-title-text">
                                                    {d.title}
                                                </span>
                                                {d.projectTitle && (
                                                    <span className="deadline-project-text">
                                                        {d.projectTitle}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </motion.div>
                </div>
            </motion.div>
        </div>
    )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    Plus,
    Trash2,
    CheckCircle2,
    TrendingUp,
    Flame,
    Droplets,
    X,
    Award,
    Target
} from 'lucide-react'
import { useGoals } from '../lib/hooks'
import type { Goal, GoalType } from '../../../shared/types'

const getToday = (): string => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const GOAL_ICONS: Record<GoalType, React.JSX.Element> = {
    everyday: <CheckCircle2 size={18} />,
    add_it_up: <TrendingUp size={18} />,
    challenge: <Flame size={18} />,
    daily_target: <Droplets size={18} />
}

const GOAL_TYPES: { id: GoalType; label: string; desc: string }[] = [
    { id: 'everyday', label: 'Everyday', desc: 'Build a daily habit' },
    { id: 'add_it_up', label: 'Add It Up', desc: 'Track savings or totals' },
    { id: 'challenge', label: 'Challenge', desc: 'Hit a specific milestone' },
    { id: 'daily_target', label: 'Daily Target', desc: 'Do X amount per day' }
]

const DEFAULT_UNITS: Record<GoalType, string> = {
    everyday: 'days',
    add_it_up: 'PHP',
    challenge: 'reps',
    daily_target: 'hours'
}

export function GoalsSpace(): React.JSX.Element {
    const { goals } = useGoals()
    const [creating, setCreating] = useState(false)

    const [title, setTitle] = useState('')
    const [type, setType] = useState<GoalType>('everyday')
    const [target, setTarget] = useState('30')
    const [unit, setUnit] = useState(DEFAULT_UNITS['everyday'])

    const activeGoals = goals.filter((g) => g.progress < 100)
    const completedGoals = goals.filter((g) => g.progress >= 100)
    const avgProgress =
        goals.length > 0
            ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
            : 0

    const handleTypeChange = (nextType: GoalType): void => {
        setType(nextType)
        setUnit(DEFAULT_UNITS[nextType])
        const defaultTargets: Record<GoalType, string> = {
            everyday: '30',
            add_it_up: '1000',
            challenge: '100',
            daily_target: '7'
        }
        setTarget(defaultTargets[nextType])
    }

    const handleCreate = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()
        if (!title.trim() || !target) return
        await window.api.createGoal(title.trim(), null, type, Number(target), unit)
        setTitle('')
        setCreating(false)
    }

    return (
        <div className="goals-layout">
            <div className="goals-main">
                <div className="goals-header">
                    <div>
                        <h1>Goals</h1>
                        <p>Track your habits, challenges, and savings.</p>
                    </div>
                    <button className="btn-primary" onClick={() => setCreating(true)}>
                        <Plus size={16} /> New Goal
                    </button>
                </div>

                <AnimatePresence>
                    {creating && (
                        <motion.div
                            initial={{ opacity: 0, height: 0, y: -20 }}
                            animate={{ opacity: 1, height: 'auto', y: 0 }}
                            exit={{ opacity: 0, height: 0, y: -20 }}
                            className="goal-create-panel"
                        >
                            <div className="goal-create-header">
                                <h2>Create a new goal</h2>
                                <button className="btn-ghost" onClick={() => setCreating(false)}>
                                    <X size={16} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="goal-form-modern">
                                <div className="goal-form-group">
                                    <label>What is your goal?</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        placeholder="e.g., Save for a new PC, Read 10 mins daily..."
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="goal-form-group">
                                    <label>Goal Type</label>
                                    <div className="goal-type-grid">
                                        {GOAL_TYPES.map((gt) => (
                                            <div
                                                key={gt.id}
                                                className={`goal-type-card type-${gt.id} ${type === gt.id ? 'active' : ''}`}
                                                onClick={() => handleTypeChange(gt.id)}
                                            >
                                                <div className="goal-type-icon">
                                                    {GOAL_ICONS[gt.id]}
                                                </div>
                                                <div className="goal-type-info">
                                                    <strong>{gt.label}</strong>
                                                    <span>{gt.desc}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="goal-form-row">
                                    <div className="goal-form-group">
                                        <label>Target Amount</label>
                                        <input
                                            type="number"
                                            value={target}
                                            onChange={(e) => setTarget(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="goal-form-group">
                                        <label>Unit (e.g., days, PHP, reps)</label>
                                        <input
                                            type="text"
                                            value={unit}
                                            onChange={(e) => setUnit(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className="goal-form-actions">
                                    <button
                                        type="button"
                                        className="btn-ghost"
                                        onClick={() => setCreating(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn-primary">
                                        Create Goal
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="goals-grid">
                    <AnimatePresence mode="popLayout">
                        {activeGoals.map((goal) => (
                            <GoalCard key={goal.id} goal={goal} />
                        ))}
                    </AnimatePresence>
                    {activeGoals.length === 0 && !creating && (
                        <div
                            className="empty-state"
                            style={{ gridColumn: '1 / -1', padding: '60px 0' }}
                        >
                            <Target size={48} strokeWidth={1} opacity={0.2} />
                            <h3>No active goals</h3>
                            <p>Create a new goal to start tracking your progress.</p>
                        </div>
                    )}
                </div>
            </div>

            <aside className="goals-sidebar">
                <div className="bento-card goals-stats-card">
                    <div className="bento-header">
                        <div className="bento-title">
                            <Award size={16} />
                            <span>Overview</span>
                        </div>
                    </div>
                    <div className="goals-stat-row">
                        <div className="goals-stat-item">
                            <span className="goals-stat-value">{activeGoals.length}</span>
                            <span className="goals-stat-label">Active</span>
                        </div>
                        <div className="goals-stat-item">
                            <span className="goals-stat-value text-green">
                                {completedGoals.length}
                            </span>
                            <span className="goals-stat-label">Completed</span>
                        </div>
                        <div className="goals-stat-item">
                            <span className="goals-stat-value text-accent">{avgProgress}%</span>
                            <span className="goals-stat-label">Avg Progress</span>
                        </div>
                    </div>
                </div>

                <div className="bento-card goals-completed-card">
                    <div className="bento-header">
                        <div className="bento-title">
                            <CheckCircle2 size={16} />
                            <span>Completed</span>
                        </div>
                    </div>
                    <div className="goals-completed-list">
                        {completedGoals.length === 0 ? (
                            <div className="empty-state-mini">
                                <p>No goals completed yet. Keep pushing!</p>
                            </div>
                        ) : (
                            completedGoals.map((g) => (
                                <div key={g.id} className="completed-goal-row">
                                    <div
                                        className={`goal-type-icon type-${g.type}`}
                                        style={{ width: 32, height: 32 }}
                                    >
                                        {GOAL_ICONS[g.type]}
                                    </div>
                                    <div className="completed-goal-info">
                                        <span className="completed-goal-title">{g.title}</span>
                                        <span className="completed-goal-stats">
                                            {g.target_value} {g.target_unit}
                                        </span>
                                    </div>
                                    <CheckCircle2 size={16} className="text-green" />
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </aside>
        </div>
    )
}

function GoalCard({ goal }: { goal: Goal }): React.JSX.Element {
    const [logValue, setLogValue] = useState('')

    const handleLog = async (value: number): Promise<void> => {
        await window.api.logGoal(goal.id, value, getToday())
        setLogValue('')
    }

    const handleDelete = async (): Promise<void> => {
        if (confirm('Delete this goal?')) await window.api.deleteGoal(goal.id)
    }

    const radius = 28
    const circumference = 2 * Math.PI * radius
    const strokeDashoffset = circumference - (goal.progress / 100) * circumference
    const isDoneToday = goal.today_value > 0

    let inputPlaceholder = `Add ${goal.target_unit || 'value'}`
    if (goal.type === 'add_it_up') inputPlaceholder = `Add amount`
    else if (goal.type === 'challenge') inputPlaceholder = `Add reps`
    else if (goal.type === 'daily_target') inputPlaceholder = `Log today's amount`

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`goal-card type-border-${goal.type}`}
        >
            <div className="goal-card-top">
                <div className="goal-icon-title">
                    <div className={`goal-type-icon type-${goal.type}`}>
                        {GOAL_ICONS[goal.type]}
                    </div>
                    <div className="goal-info">
                        <h3>{goal.title}</h3>
                        <p className="goal-type-label">
                            {goal.type === 'add_it_up'
                                ? 'Savings Tracker'
                                : goal.type === 'everyday'
                                  ? 'Habit Tracker'
                                  : goal.type.replace('_', ' ')}
                        </p>
                    </div>
                </div>
                <div className="goal-progress-ring">
                    <svg width="72" height="72" viewBox="0 0 72 72">
                        <circle
                            className="ring-bg"
                            cx="36"
                            cy="36"
                            r={radius}
                            strokeWidth="6"
                            fill="none"
                        />
                        <motion.circle
                            className={`ring-fill type-${goal.type}`}
                            cx="36"
                            cy="36"
                            r={radius}
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={circumference}
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                        />
                    </svg>
                    <span className="goal-progress-text">{goal.progress}%</span>
                </div>
            </div>

            <div className="goal-stats-pill">
                <span className="goal-stats-current">
                    {goal.type === 'add_it_up' ? `${goal.target_unit} ` : ''}
                    {goal.current_value.toLocaleString()}
                </span>
                <span className="goal-stats-divider">/</span>
                <span className="goal-stats-target">
                    {goal.target_value.toLocaleString()}{' '}
                    {goal.type !== 'add_it_up' ? goal.target_unit : ''}
                </span>
            </div>

            <div className="goal-card-bottom">
                {goal.type === 'everyday' ? (
                    <button
                        className={`btn-primary w-full ${isDoneToday ? 'opacity-50' : ''}`}
                        disabled={isDoneToday}
                        onClick={() => handleLog(1)}
                    >
                        {isDoneToday ? 'Checked in for today ✓' : 'Check in for today'}
                    </button>
                ) : (
                    <div className="goal-unified-input">
                        <input
                            type="number"
                            placeholder={inputPlaceholder}
                            value={logValue}
                            onChange={(e) => setLogValue(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && logValue && handleLog(Number(logValue))
                            }
                        />
                        <button
                            className="goal-log-btn"
                            onClick={() => logValue && handleLog(Number(logValue))}
                            disabled={!logValue}
                        >
                            Log
                        </button>
                    </div>
                )}
                <button className="goal-delete" onClick={handleDelete} title="Delete Goal">
                    <Trash2 size={16} />
                </button>
            </div>
        </motion.div>
    )
}

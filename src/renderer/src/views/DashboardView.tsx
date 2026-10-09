import { useEffect, useState, useMemo } from "react";
import type { Project, DashboardData } from "../../../shared/types";
import { formatHM } from "../lib/time";

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$",
    PHP: "₱",
    EUR: "€",
    GBP: "£",
};

interface DeadlineItem {
    id: string;
    title: string;
    projectTitle?: string;
    date: string;
    daysAway: number;
    type: "task" | "project";
}

interface ProjectHealth {
    project: Project;
    tasksTotal: number;
    tasksDone: number;
    taskProgress: number;
    moneyPaid: number;
    moneyTotal: number;
    moneyProgress: number;
}

function todayMidnight(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

function daysAway(dateStr: string): number {
    const d = new Date(dateStr + "T00:00:00");
    return Math.round((d.getTime() - todayMidnight().getTime()) / 86400000);
}

function isThisMonth(isoString: string): boolean {
    const d = new Date(isoString);
    const now = new Date();
    return (
        d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
    );
}

export function DashboardView(): React.JSX.Element {
    const [data, setData] = useState<DashboardData | null>(null);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const d = await window.api.getDashboardData();
            if (!cancelled) setData(d);
        })();

        const unsubscribe = window.api.onDataChanged(() => {
            window.api.getDashboardData().then((d) => {
                if (!cancelled) setData(d);
            });
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    const displayCurrency = useMemo(() => {
        if (!data || data.phases.length === 0) return "USD";
        const counts = new Map<string, number>();
        for (const p of data.phases) {
            counts.set(p.currency, (counts.get(p.currency) || 0) + 1);
        }
        let best = "USD";
        let bestCount = 0;
        for (const [c, n] of counts) {
            if (n > bestCount) {
                best = c;
                bestCount = n;
            }
        }
        return best;
    }, [data]);

    const symbol = CURRENCY_SYMBOLS[displayCurrency] || displayCurrency;

    const stats = useMemo(() => {
        if (!data) {
            return {
                earned: 0,
                outstanding: 0,
                earnedThisMonth: 0,
                paidCount: 0,
                unpaidCount: 0,
                thisMonthCount: 0,
                overdueTasks: 0,
                overdueProjects: 0,
                openTasks: 0,
                doneThisWeek: 0,
            };
        }

        const { tasks, phases, projects } = data;
        const today = todayMidnight();
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);

        const relevant = phases.filter((p) => p.currency === displayCurrency);

        const earned = relevant
            .filter((p) => p.paid)
            .reduce((s, p) => s + p.amount, 0);

        const outstanding = relevant
            .filter((p) => !p.paid)
            .reduce((s, p) => s + p.amount, 0);

        const thisMonth = relevant.filter(
            (p) => p.paid && p.paid_at && isThisMonth(p.paid_at),
        );

        const earnedThisMonth = thisMonth.reduce((s, p) => s + p.amount, 0);

        const overdueTasks = tasks.filter((t) => {
            if (t.done || !t.planned_for) return false;
            return new Date(t.planned_for + "T00:00:00") < today;
        }).length;

        const overdueProjects = projects.filter((p) => {
            if (!p.due_date || p.status === "completed") return false;
            return new Date(p.due_date + "T00:00:00") < today;
        }).length;

        const openTasks = tasks.filter((t) => !t.done).length;

        const doneThisWeek = tasks.filter(
            (t) =>
                t.done && t.completed_at && new Date(t.completed_at) >= weekAgo,
        ).length;

        return {
            earned,
            outstanding,
            earnedThisMonth,
            paidCount: relevant.filter((p) => p.paid).length,
            unpaidCount: relevant.filter((p) => !p.paid).length,
            thisMonthCount: thisMonth.length,
            overdueTasks,
            overdueProjects,
            openTasks,
            doneThisWeek,
        };
    }, [data, displayCurrency]);

    const deadlines = useMemo(() => {
        if (!data) return [];
        const projectById = new Map(data.projects.map((p) => [p.id, p]));
        const today = todayMidnight();
        const weekFromNow = new Date(today);
        weekFromNow.setDate(weekFromNow.getDate() + 8);

        const items: DeadlineItem[] = [];

        for (const t of data.tasks) {
            if (t.done) continue;
            const dateStr = t.due_date || t.planned_for;
            if (!dateStr) continue;
            const d = new Date(dateStr + "T00:00:00");
            if (d >= weekFromNow) continue;
            const project = t.project_id
                ? projectById.get(t.project_id)
                : undefined;
            items.push({
                id: `task-${t.id}`,
                title: t.text,
                projectTitle: project?.title,
                date: dateStr,
                daysAway: daysAway(dateStr),
                type: "task",
            });
        }

        for (const p of data.projects) {
            if (!p.due_date || p.status === "completed") continue;
            const d = new Date(p.due_date + "T00:00:00");
            if (d >= weekFromNow) continue;
            items.push({
                id: `project-${p.id}`,
                title: p.title,
                date: p.due_date,
                daysAway: daysAway(p.due_date),
                type: "project",
            });
        }

        items.sort((a, b) => a.date.localeCompare(b.date));
        return items;
    }, [data]);

    const projectHealth = useMemo<ProjectHealth[]>(() => {
        if (!data) return [];
        return data.projects
            .map((project) => {
                const projectTasks = data.tasks.filter(
                    (t) => t.project_id === project.id,
                );
                const doneTasks = projectTasks.filter((t) => t.done).length;
                const projectPhases = data.phases.filter(
                    (p) => p.project_id === project.id,
                );
                const moneyPaid = projectPhases
                    .filter((p) => p.paid)
                    .reduce((s, p) => s + p.amount, 0);
                const moneyTotal = projectPhases.reduce(
                    (s, p) => s + p.amount,
                    0,
                );
                return {
                    project,
                    tasksTotal: projectTasks.length,
                    tasksDone: doneTasks,
                    taskProgress: projectTasks.length
                        ? doneTasks / projectTasks.length
                        : 0,
                    moneyPaid,
                    moneyTotal,
                    moneyProgress: moneyTotal ? moneyPaid / moneyTotal : 0,
                };
            })
            .filter((h) => h.tasksTotal > 0 || h.moneyTotal > 0)
            .sort((a, b) => b.tasksTotal - a.tasksTotal);
    }, [data]);

    if (!data)
        return (
            <div className="view">
                <p>Loading…</p>
            </div>
        );

    const todayLabel = new Date().toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
    });

    const maxProjectSeconds = Math.max(
        1,
        ...Object.values(data.sessionTotals.byProject),
    );

    const hasAnyTime = data.sessionTotals.totalSeconds > 0;

    return (
        <div className="view dashboard-view">
            <div className="view-header">
                <h2>Dashboard</h2>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button
                        className="test-notification-btn"
                        onClick={() => window.api.testNotification()}
                        title="Fire a test notification"
                    >
                        🔔 Test
                    </button>
                    <span className="view-count">{todayLabel}</span>
                </div>
            </div>

            {/* Stat cards */}
            <div className="stat-grid">
                <div className="stat-card stat-green">
                    <span className="stat-label">Earned</span>
                    <span className="stat-value">
                        {symbol}
                        {stats.earned.toLocaleString()}
                    </span>
                    <span className="stat-sub">
                        {stats.paidCount} phase
                        {stats.paidCount === 1 ? "" : "s"} paid
                    </span>
                </div>

                <div className="stat-card stat-amber">
                    <span className="stat-label">Outstanding</span>
                    <span className="stat-value">
                        {symbol}
                        {stats.outstanding.toLocaleString()}
                    </span>
                    <span className="stat-sub">
                        {stats.unpaidCount} phase
                        {stats.unpaidCount === 1 ? "" : "s"} open
                    </span>
                </div>

                <div className="stat-card stat-blue">
                    <span className="stat-label">This Month</span>
                    <span className="stat-value">
                        {symbol}
                        {stats.earnedThisMonth.toLocaleString()}
                    </span>
                    <span className="stat-sub">
                        {stats.thisMonthCount} payment
                        {stats.thisMonthCount === 1 ? "" : "s"}
                    </span>
                </div>

                <div className="stat-card stat-purple">
                    <span className="stat-label">Tracked This Week</span>
                    <span className="stat-value">
                        {hasAnyTime
                            ? formatHM(data.sessionTotals.thisWeekSeconds)
                            : "0m"}
                    </span>
                    <span className="stat-sub">
                        {hasAnyTime
                            ? `${formatHM(data.sessionTotals.totalSeconds)} all time`
                            : "Start a timer in Focus"}
                    </span>
                </div>

                <div
                    className={`stat-card ${
                        stats.overdueTasks + stats.overdueProjects > 0
                            ? "stat-red"
                            : "stat-neutral"
                    }`}
                >
                    <span className="stat-label">Overdue</span>
                    <span className="stat-value">
                        {stats.overdueTasks + stats.overdueProjects}
                    </span>
                    <span className="stat-sub">
                        {stats.overdueTasks} task
                        {stats.overdueTasks === 1 ? "" : "s"} ·{" "}
                        {stats.overdueProjects} project
                        {stats.overdueProjects === 1 ? "" : "s"}
                    </span>
                </div>
            </div>

            {/* Two-column row */}
            <div className="dashboard-row">
                <div className="dashboard-panel">
                    <h3>Deadlines this week</h3>
                    {deadlines.length === 0 ? (
                        <p className="panel-empty">
                            Nothing due in the next 7 days.
                        </p>
                    ) : (
                        <div className="deadline-list">
                            {deadlines.map((d) => {
                                const dayLabel =
                                    d.daysAway < 0
                                        ? `${Math.abs(d.daysAway)}d overdue`
                                        : d.daysAway === 0
                                          ? "Today"
                                          : d.daysAway === 1
                                            ? "Tomorrow"
                                            : `${d.daysAway}d`;
                                return (
                                    <div
                                        key={d.id}
                                        className={`deadline-row ${d.daysAway < 0 ? "overdue" : ""}`}
                                    >
                                        <span className="deadline-type">
                                            {d.type === "project" ? "◆" : "●"}
                                        </span>
                                        <div className="deadline-body">
                                            <span className="deadline-title">
                                                {d.title}
                                            </span>
                                            {d.projectTitle && (
                                                <span className="deadline-project">
                                                    {d.projectTitle}
                                                </span>
                                            )}
                                        </div>
                                        <span className="deadline-date">
                                            {dayLabel}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="dashboard-panel">
                    <h3>Quick stats</h3>
                    <div className="quick-stats">
                        <div className="quick-stat-row">
                            <span>Active projects</span>
                            <strong>{data.projects.length}</strong>
                        </div>
                        <div className="quick-stat-row">
                            <span>Open tasks</span>
                            <strong>{stats.openTasks}</strong>
                        </div>
                        <div className="quick-stat-row">
                            <span>Completed (7 days)</span>
                            <strong className="green">
                                {stats.doneThisWeek}
                            </strong>
                        </div>
                        <div className="quick-stat-row">
                            <span>Tracked (7 days)</span>
                            <strong className="purple">
                                {hasAnyTime
                                    ? formatHM(
                                          data.sessionTotals.thisWeekSeconds,
                                      )
                                    : "—"}
                            </strong>
                        </div>
                        <div className="quick-stat-row">
                            <span>Total tasks</span>
                            <strong>{data.tasks.length}</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Project health */}
            <div className="dashboard-panel">
                <h3>Project health</h3>
                {projectHealth.length === 0 ? (
                    <p className="panel-empty">
                        No active work yet. Create a project to see it here.
                    </p>
                ) : (
                    <div className="health-list">
                        {projectHealth.map((h) => {
                            const projectSeconds =
                                data.sessionTotals.byProject[h.project.id] ?? 0;
                            return (
                                <div key={h.project.id} className="health-row">
                                    <div className="health-header">
                                        <span className="health-title">
                                            {h.project.title}
                                        </span>
                                        <span className="health-money">
                                            {symbol}
                                            {h.moneyPaid.toLocaleString()} /{" "}
                                            {symbol}
                                            {h.moneyTotal.toLocaleString()}
                                            {h.moneyTotal > 0 &&
                                                h.moneyPaid ===
                                                    h.moneyTotal && (
                                                    <span className="health-paid-check">
                                                        {" "}
                                                        ✓
                                                    </span>
                                                )}
                                        </span>
                                    </div>
                                    <div className="health-bars">
                                        <div className="health-bar-wrap">
                                            <span className="health-bar-label">
                                                Tasks
                                            </span>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill progress-blue"
                                                    style={{
                                                        width: `${h.taskProgress * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="health-bar-count">
                                                {h.tasksDone}/{h.tasksTotal}
                                            </span>
                                        </div>
                                        <div className="health-bar-wrap">
                                            <span className="health-bar-label">
                                                Money
                                            </span>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill progress-green"
                                                    style={{
                                                        width: `${h.moneyProgress * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="health-bar-count">
                                                {h.moneyTotal > 0
                                                    ? `${Math.round(h.moneyProgress * 100)}%`
                                                    : "—"}
                                            </span>
                                        </div>
                                        {hasAnyTime && (
                                            <div className="health-bar-wrap">
                                                <span className="health-bar-label">
                                                    Time
                                                </span>
                                                <div className="progress-bar">
                                                    <div
                                                        className="progress-fill progress-purple"
                                                        style={{
                                                            width: `${(projectSeconds / maxProjectSeconds) * 100}%`,
                                                        }}
                                                    />
                                                </div>
                                                <span className="health-bar-count">
                                                    {projectSeconds > 0
                                                        ? formatHM(
                                                              projectSeconds,
                                                          )
                                                        : "—"}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

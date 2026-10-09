import { useEffect, useState, useCallback } from "react";
import type {
    Project,
    Task,
    ProjectPhase,
    NewTaskOptions,
} from "../../../shared/types";
import { TaskItem } from "../components/tasks/TaskItem";
import { QuickAdd } from "../components/common/QuickAdd";
import { PhaseList } from "../components/phases/PhaseList";
import { EditableText } from "../components/common/EditableText";
import { ProjectEditModal } from "../components/projects/ProjectEditModal";

interface ProjectDetailViewProps {
    projectId: number;
    onDeleted: () => void;
}

type Tab = "tasks" | "phases" | "attachments";

const CURRENCY_SYMBOLS: Record<string, string> = {
    USD: "$",
    PHP: "₱",
    EUR: "€",
    GBP: "£",
};

function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ProjectDetailView({
    projectId,
    onDeleted,
}: ProjectDetailViewProps): React.JSX.Element {
    const [project, setProject] = useState<Project | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [phases, setPhases] = useState<ProjectPhase[]>([]);
    const [activeTab, setActiveTab] = useState<Tab>("tasks");
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);

    const load = useCallback(async (): Promise<void> => {
        const [projects, t, p] = await Promise.all([
            window.api.getProjects(),
            window.api.getTasksByProject(projectId),
            window.api.getPhases(projectId),
        ]);
        setProject(projects.find((proj) => proj.id === projectId) ?? null);
        setTasks(t);
        setPhases(p);
        setLoading(false);
    }, [projectId]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const [projects, t, p] = await Promise.all([
                window.api.getProjects(),
                window.api.getTasksByProject(projectId),
                window.api.getPhases(projectId),
            ]);
            if (cancelled) return;
            setProject(projects.find((proj) => proj.id === projectId) ?? null);
            setTasks(t);
            setPhases(p);
            setLoading(false);
        })();

        const unsubscribe = window.api.onDataChanged(() => {
            window.api.getProjects().then((projects) => {
                if (!cancelled)
                    setProject(
                        projects.find((proj) => proj.id === projectId) ?? null,
                    );
            });
            window.api.getTasksByProject(projectId).then((t) => {
                if (!cancelled) setTasks(t);
            });
            window.api.getPhases(projectId).then((p) => {
                if (!cancelled) setPhases(p);
            });
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [projectId]);

    const handleAddTask = async (
        text: string,
        options: NewTaskOptions,
    ): Promise<void> => {
        await window.api.createTask(
            text,
            projectId,
            todayStr(),
            options.dueDate,
            options.priority,
        );
        await load();
    };

    const handleToggleTask = async (
        id: number,
        done: boolean,
    ): Promise<void> => {
        await window.api.toggleTask(id, done);
        await load();
    };

    const handleDeleteTask = async (id: number): Promise<void> => {
        await window.api.deleteTask(id);
        await load();
    };

    const handleSetDueDate = async (
        id: number,
        date: string | null,
    ): Promise<void> => {
        await window.api.updateTask(id, { due_date: date });
        await load();
    };

    const handleSetPriority = async (
        id: number,
        priority: number,
    ): Promise<void> => {
        await window.api.updateTask(id, { priority });
        await load();
    };

    const handleAddPhase = async (
        name: string,
        amount: number,
        currency: string,
    ): Promise<void> => {
        await window.api.createPhase(projectId, name, amount, currency);
        await load();
    };

    const handleUpdatePhase = async (
        id: number,
        updates: Record<string, unknown>,
    ): Promise<void> => {
        await window.api.updatePhase(id, updates);
        await load();
    };

    const handleDeletePhase = async (id: number): Promise<void> => {
        await window.api.deletePhase(id);
        await load();
    };

    const handleUpdateProject = async (
        updates: Partial<Project>,
    ): Promise<void> => {
        await window.api.updateProject(projectId, updates);
        await load();
    };

    const handleDeleteProject = async (): Promise<void> => {
        await window.api.deleteProject(projectId);
        onDeleted();
    };

    if (loading)
        return (
            <div className="view">
                <p>Loading…</p>
            </div>
        );
    if (!project)
        return (
            <div className="view">
                <p>Project not found.</p>
            </div>
        );

    const total = phases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const paid = phases
        .filter((p) => p.paid)
        .reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = total - paid;
    const currency = phases[0]?.currency || "USD";
    const symbol = CURRENCY_SYMBOLS[currency] || currency;

    const moneySummary = total > 0 && (
        <div className="money-summary">
            <span className="money-paid">
                {symbol}
                {paid.toLocaleString()}
            </span>
            <span className="money-sep">/</span>
            <span className="money-total">
                {symbol}
                {total.toLocaleString()}
            </span>
            <span className="money-dot">·</span>
            <span
                className={`money-remaining ${remaining > 0 ? "owed" : "clear"}`}
            >
                {symbol}
                {remaining.toLocaleString()}{" "}
                {remaining > 0 ? "remaining" : "paid in full"}
            </span>
            <span className="money-currency">{currency}</span>
        </div>
    );

    const openTasks = tasks.filter((t) => !t.done);
    const doneTasks = tasks.filter((t) => t.done);

    return (
        <div className="view project-detail">
            <div className="view-header">
                <div className="project-title-block">
                    <EditableText
                        value={project.title}
                        onSave={(newTitle) =>
                            handleUpdateProject({ title: newTitle })
                        }
                        className="project-title-edit"
                        inputClassName="project-title-input"
                    />
                    <EditableText
                        value={project.client ?? ""}
                        onSave={(newClient) =>
                            handleUpdateProject({ client: newClient || null })
                        }
                        placeholder="+ add client"
                        className="project-client-label"
                        inputClassName="project-client-input"
                        allowEmpty
                    />
                </div>
                <div className="header-right">
                    {moneySummary}
                    <button
                        className="edit-project-btn"
                        onClick={() => setShowEdit(true)}
                        title="Edit project details"
                    >
                        ⚙
                    </button>
                </div>
            </div>

            {showEdit && (
                <ProjectEditModal
                    project={project}
                    onSave={handleUpdateProject}
                    onDelete={handleDeleteProject}
                    onClose={() => setShowEdit(false)}
                />
            )}

            <div className="tabs">
                <button
                    className={activeTab === "tasks" ? "active" : ""}
                    onClick={() => setActiveTab("tasks")}
                >
                    Tasks ({tasks.length})
                </button>
                <button
                    className={activeTab === "phases" ? "active" : ""}
                    onClick={() => setActiveTab("phases")}
                >
                    Payments ({phases.length})
                </button>
                <button
                    className={activeTab === "attachments" ? "active" : ""}
                    onClick={() => setActiveTab("attachments")}
                >
                    Attachments
                </button>
            </div>

            {activeTab === "tasks" && (
                <div className="tab-content">
                    <QuickAdd
                        onAdd={handleAddTask}
                        placeholder="Add a task to this project…"
                        projects={[]}
                        hideProject
                        hidePlannedFor
                    />

                    {openTasks.length > 0 && (
                        <section className="task-group">
                            {openTasks.map((t) => (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    onToggle={handleToggleTask}
                                    onDelete={handleDeleteTask}
                                    onSetDueDate={handleSetDueDate}
                                    onSetPriority={handleSetPriority}
                                />
                            ))}
                        </section>
                    )}

                    {doneTasks.length > 0 && (
                        <section className="task-group">
                            <h3 className="group-title">Completed</h3>
                            {doneTasks.map((t) => (
                                <TaskItem
                                    key={t.id}
                                    task={t}
                                    onToggle={handleToggleTask}
                                    onDelete={handleDeleteTask}
                                    onSetDueDate={handleSetDueDate}
                                    onSetPriority={handleSetPriority}
                                />
                            ))}
                        </section>
                    )}

                    {tasks.length === 0 && (
                        <div className="empty-state">
                            <p>No tasks yet. Add the first one above.</p>
                        </div>
                    )}
                </div>
            )}

            {activeTab === "phases" && (
                <div className="tab-content">
                    <PhaseList
                        phases={phases}
                        onAdd={handleAddPhase}
                        onUpdate={handleUpdatePhase}
                        onDelete={handleDeletePhase}
                    />
                </div>
            )}

            {activeTab === "attachments" && (
                <div className="tab-content">
                    <div className="empty-state">
                        <p>Attachments coming in Phase 5.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

import { useEffect, useState, useCallback } from "react";
import type { Task, Project, NewTaskOptions } from "../../../shared/types";
import { TaskItem } from "../components/tasks/TaskItem";
import { QuickAdd } from "../components/common/QuickAdd";
import { tomorrowStr } from "../lib/dates";

export function TomorrowView(): React.JSX.Element {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async (): Promise<void> => {
        const [t, p] = await Promise.all([
            window.api.getTasksByView("tomorrow"),
            window.api.getProjects(),
        ]);
        setTasks(t);
        setProjects(p);
        setLoading(false);
    }, []);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            const [t, p] = await Promise.all([
                window.api.getTasksByView("tomorrow"),
                window.api.getProjects(),
            ]);
            if (!cancelled) {
                setTasks(t);
                setProjects(p);
                setLoading(false);
            }
        })();

        const unsubscribe = window.api.onDataChanged(() => {
            window.api.getTasksByView("tomorrow").then((t) => {
                if (!cancelled) setTasks(t);
            });
            window.api.getProjects().then((p) => {
                if (!cancelled) setProjects(p);
            });
        });

        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, []);

    const handleAdd = async (
        text: string,
        options: NewTaskOptions,
    ): Promise<void> => {
        await window.api.createTask(
            text,
            options.projectId,
            tomorrowStr(),
            options.dueDate,
            options.priority,
        );
        await load();
    };

    const handleToggle = async (id: number, done: boolean): Promise<void> => {
        await window.api.toggleTask(id, done);
        await load();
    };

    const handleDelete = async (id: number): Promise<void> => {
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

    const projectById = new Map(projects.map((p) => [p.id, p]));

    if (loading)
        return (
            <div className="view">
                <p>Loading…</p>
            </div>
        );

    return (
        <div className="view">
            <div className="view-header">
                <h2>Tomorrow</h2>
                <span className="view-count">
                    {tasks.length} task{tasks.length === 1 ? "" : "s"}
                </span>
            </div>

            <QuickAdd
                onAdd={handleAdd}
                placeholder="Plan something for tomorrow…"
                projects={projects}
                hidePlannedFor
            />

            {tasks.map((t) => (
                <TaskItem
                    key={t.id}
                    task={t}
                    project={
                        t.project_id ? projectById.get(t.project_id) : undefined
                    }
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onSetDueDate={handleSetDueDate}
                    onSetPriority={handleSetPriority}
                />
            ))}

            {tasks.length === 0 && (
                <div className="empty-state">
                    <p>
                        Tomorrow is a blank slate. Add something to plan ahead.
                    </p>
                </div>
            )}
        </div>
    );
}

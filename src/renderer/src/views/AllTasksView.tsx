import { useEffect, useState, useMemo, useCallback } from "react";
import type { Task, Project, NewTaskOptions } from "../../../shared/types";
import { TaskItem } from "../components/tasks/TaskItem";
import { QuickAdd } from "../components/common/QuickAdd";
import { isOverdue } from "../lib/dates";

type StatusFilter = "all" | "open" | "done" | "overdue";
type SortBy = "recent" | "due" | "priority";

export function AllTasksView(): React.JSX.Element {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
    const [projectFilter, setProjectFilter] = useState<
        number | "all" | "inbox"
    >("all");
    const [sortBy, setSortBy] = useState<SortBy>("recent");
    const [groupByProject, setGroupByProject] = useState(true);

    const load = useCallback(async (): Promise<void> => {
        const [t, p] = await Promise.all([
            window.api.getTasksByView("all"),
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
                window.api.getTasksByView("all"),
                window.api.getProjects(),
            ]);
            if (!cancelled) {
                setTasks(t);
                setProjects(p);
                setLoading(false);
            }
        })();

        const unsubscribe = window.api.onDataChanged(() => {
            window.api.getTasksByView("all").then((t) => {
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

    const projectById = useMemo(
        () => new Map(projects.map((p) => [p.id, p])),
        [projects],
    );

    const filtered = useMemo(() => {
        let result = [...tasks];

        const q = search.trim().toLowerCase();
        if (q) {
            result = result.filter((t) => t.text.toLowerCase().includes(q));
        }

        if (statusFilter === "open") {
            result = result.filter((t) => !t.done);
        } else if (statusFilter === "done") {
            result = result.filter((t) => t.done);
        } else if (statusFilter === "overdue") {
            result = result.filter((t) => !t.done && isOverdue(t.planned_for));
        }

        if (projectFilter === "inbox") {
            result = result.filter((t) => t.project_id === null);
        } else if (typeof projectFilter === "number") {
            result = result.filter((t) => t.project_id === projectFilter);
        }

        if (sortBy === "due") {
            result.sort((a, b) => {
                if (!a.due_date && !b.due_date) return 0;
                if (!a.due_date) return 1;
                if (!b.due_date) return -1;
                return a.due_date.localeCompare(b.due_date);
            });
        } else if (sortBy === "priority") {
            result.sort((a, b) => b.priority - a.priority);
        } else {
            result.sort((a, b) => b.created_at.localeCompare(a.created_at));
        }

        return result;
    }, [tasks, search, statusFilter, projectFilter, sortBy]);

    const grouped = useMemo(() => {
        if (!groupByProject) return null;
        const groups = new Map<number | "inbox", Task[]>();
        for (const t of filtered) {
            const key = t.project_id ?? "inbox";
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(t);
        }
        return groups;
    }, [filtered, groupByProject]);

    const handleAdd = async (
        text: string,
        options: NewTaskOptions,
    ): Promise<void> => {
        await window.api.createTask(
            text,
            options.projectId,
            options.plannedFor,
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

    const handleSetText = async (id: number, text: string): Promise<void> => {
        await window.api.updateTask(id, { text });
        await load(); // or load() depending on the file
    };

    const totalCount = tasks.length;
    const openCount = tasks.filter((t) => !t.done).length;
    const doneCount = tasks.filter((t) => t.done).length;
    const overdueCount = tasks.filter(
        (t) => !t.done && isOverdue(t.planned_for),
    ).length;

    if (loading)
        return (
            <div className="view">
                <p>Loading…</p>
            </div>
        );

    return (
        <div className="view all-tasks-view">
            <div className="view-header">
                <h2>All Tasks</h2>
                <span className="view-count">
                    {filtered.length} of {totalCount}
                </span>
            </div>

            <QuickAdd
                onAdd={handleAdd}
                placeholder="Add a task…"
                projects={projects}
            />

            <div className="filter-bar">
                <input
                    type="text"
                    className="filter-search"
                    placeholder="Search tasks…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />

                <div className="filter-chips">
                    <button
                        className={`filter-chip ${statusFilter === "all" ? "active" : ""}`}
                        onClick={() => setStatusFilter("all")}
                    >
                        All <span className="chip-count">{totalCount}</span>
                    </button>
                    <button
                        className={`filter-chip ${statusFilter === "open" ? "active" : ""}`}
                        onClick={() => setStatusFilter("open")}
                    >
                        Open <span className="chip-count">{openCount}</span>
                    </button>
                    <button
                        className={`filter-chip ${
                            statusFilter === "overdue" ? "active" : ""
                        } ${overdueCount > 0 ? "has-overdue" : ""}`}
                        onClick={() => setStatusFilter("overdue")}
                    >
                        Overdue{" "}
                        <span className="chip-count">{overdueCount}</span>
                    </button>
                    <button
                        className={`filter-chip ${statusFilter === "done" ? "active" : ""}`}
                        onClick={() => setStatusFilter("done")}
                    >
                        Done <span className="chip-count">{doneCount}</span>
                    </button>
                </div>

                <div className="filter-selects">
                    <select
                        value={
                            projectFilter === "all"
                                ? "all"
                                : projectFilter === "inbox"
                                  ? "inbox"
                                  : String(projectFilter)
                        }
                        onChange={(e) => {
                            const v = e.target.value;
                            setProjectFilter(
                                v === "all"
                                    ? "all"
                                    : v === "inbox"
                                      ? "inbox"
                                      : Number(v),
                            );
                        }}
                    >
                        <option value="all">All projects</option>
                        <option value="inbox">Inbox only</option>
                        {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.title}
                            </option>
                        ))}
                    </select>

                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as SortBy)}
                    >
                        <option value="recent">Recent</option>
                        <option value="due">Due date</option>
                        <option value="priority">Priority</option>
                    </select>

                    <label className="filter-toggle">
                        <input
                            type="checkbox"
                            checked={groupByProject}
                            onChange={(e) =>
                                setGroupByProject(e.target.checked)
                            }
                        />
                        <span>Group by project</span>
                    </label>
                </div>
            </div>

            {filtered.length === 0 && (
                <div className="empty-state">
                    <p>
                        {search ||
                        statusFilter !== "all" ||
                        projectFilter !== "all"
                            ? "No tasks match these filters."
                            : "No tasks yet. Add one above."}
                    </p>
                </div>
            )}

            {grouped
                ? Array.from(grouped.entries()).map(([key, groupTasks]) => {
                      const project =
                          key === "inbox" ? null : projectById.get(key);
                      return (
                          <section key={String(key)} className="task-group">
                              <h3 className="group-title">
                                  {project ? project.title : "Inbox"}
                                  <span className="group-count">
                                      {groupTasks.length}
                                  </span>
                              </h3>
                              {groupTasks.map((t) => (
                                  <TaskItem
                                      key={t.id}
                                      task={t}
                                      project={project ?? undefined}
                                      onToggle={handleToggle}
                                      onDelete={handleDelete}
                                      onSetDueDate={handleSetDueDate}
                                      onSetPriority={handleSetPriority}
                                      onSetText={handleSetText}
                                  />
                              ))}
                          </section>
                      );
                  })
                : filtered.map((t) => (
                      <TaskItem
                          key={t.id}
                          task={t}
                          project={
                              t.project_id
                                  ? projectById.get(t.project_id)
                                  : undefined
                          }
                          onToggle={handleToggle}
                          onDelete={handleDelete}
                          onSetDueDate={handleSetDueDate}
                          onSetPriority={handleSetPriority}
                          onSetText={handleSetText}
                      />
                  ))}
        </div>
    );
}

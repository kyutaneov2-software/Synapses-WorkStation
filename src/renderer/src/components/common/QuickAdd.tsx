import { useEffect, useRef, useState } from "react";
import type { Project, NewTaskOptions } from "../../../../shared/types";
import {
    PRIORITY_VALUES,
    priorityLevel,
    type PriorityLevel,
} from "../../../../shared/constants";

interface QuickAddProps {
    onAdd: (text: string, options: NewTaskOptions) => Promise<void>;
    placeholder?: string;
    projects?: Project[];
    defaultProjectId?: number | null;
    defaultPlannedFor?: string | null;
    hideProject?: boolean;
    hidePlannedFor?: boolean;
}

function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function tomorrowStr(): string {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const PRIORITY_CYCLE: PriorityLevel[] = ["none", "low", "medium", "high"];

export function QuickAdd({
    onAdd,
    placeholder = "Add a task…",
    projects = [],
    defaultProjectId = null,
    defaultPlannedFor = null,
    hideProject = false,
    hidePlannedFor = false,
}: QuickAddProps): React.JSX.Element {
    const [text, setText] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [focused, setFocused] = useState(false);

    // Metadata — initialised from defaults, then user-controlled
    const [projectId, setProjectId] = useState<number | null>(defaultProjectId);
    const [plannedFor, setPlannedFor] = useState<string | null>(
        defaultPlannedFor,
    );
    const [dueDate, setDueDate] = useState<string | null>(null);
    const [priority, setPriority] = useState(0);

    const wrapperRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Close expanded state when clicking outside
    useEffect(() => {
        if (!focused) return;
        const handler = (e: MouseEvent): void => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(e.target as Node)
            ) {
                setFocused(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [focused]);

    // ... rest of the component unchanged

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        const trimmed = text.trim();
        if (!trimmed || submitting) return;

        setSubmitting(true);
        try {
            await onAdd(trimmed, {
                projectId,
                plannedFor,
                dueDate,
                priority,
            });
            setText("");
            setDueDate(null);
            setFocused(false);
            inputRef.current?.blur();
        } finally {
            setSubmitting(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent): void => {
        if (e.key === "Escape") {
            setText("");
            setFocused(false);
            inputRef.current?.blur();
        }
    };

    const cyclePriority = (): void => {
        const current = priorityLevel(priority);
        const idx = PRIORITY_CYCLE.indexOf(current);
        const next = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length];
        setPriority(PRIORITY_VALUES[next]);
    };

    const level = priorityLevel(priority);

    const plannedForLabel =
        plannedFor === todayStr()
            ? "Today"
            : plannedFor === tomorrowStr()
              ? "Tomorrow"
              : (plannedFor ?? "No plan");

    return (
        <div
            ref={wrapperRef}
            className={`quick-add-wrapper ${focused ? "focused" : ""}`}
        >
            <form onSubmit={handleSubmit} className="quick-add-main">
                <span className="quick-add-icon">+</span>
                <input
                    ref={inputRef}
                    type="text"
                    className="quick-add-input"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    disabled={submitting}
                />
                <button
                    type="submit"
                    className="quick-add-submit"
                    disabled={!text.trim() || submitting}
                    title="Add task (Enter)"
                >
                    ↵
                </button>
            </form>

            {focused && (
                <div className="quick-add-meta">
                    {!hideProject && (
                        <select
                            className="meta-chip"
                            value={
                                projectId === null ? "inbox" : String(projectId)
                            }
                            onChange={(e) =>
                                setProjectId(
                                    e.target.value === "inbox"
                                        ? null
                                        : Number(e.target.value),
                                )
                            }
                            title="Project"
                        >
                            <option value="inbox">📁 Inbox</option>
                            {projects.map((p) => (
                                <option key={p.id} value={p.id}>
                                    📁 {p.title}
                                </option>
                            ))}
                        </select>
                    )}

                    <input
                        type="date"
                        className="meta-chip meta-date"
                        value={dueDate ?? ""}
                        onChange={(e) => setDueDate(e.target.value || null)}
                        title="Due date"
                    />

                    <button
                        type="button"
                        className={`meta-chip meta-priority priority-${level}`}
                        onClick={cyclePriority}
                        title="Priority (click to cycle)"
                    >
                        <span className={`priority-dot priority-${level}`} />
                        {level === "none"
                            ? "Priority"
                            : level[0].toUpperCase() + level.slice(1)}
                    </button>

                    {!hidePlannedFor && (
                        <select
                            className="meta-chip"
                            value={plannedFor ?? "none"}
                            onChange={(e) =>
                                setPlannedFor(
                                    e.target.value === "none"
                                        ? null
                                        : e.target.value,
                                )
                            }
                            title="Planned for"
                        >
                            <option value="none">📅 {plannedForLabel}</option>
                            <option value={todayStr()}>Today</option>
                            <option value={tomorrowStr()}>Tomorrow</option>
                        </select>
                    )}

                    <span className="quick-add-hint">
                        <kbd>Enter</kbd> to add
                    </span>
                </div>
            )}
        </div>
    );
}

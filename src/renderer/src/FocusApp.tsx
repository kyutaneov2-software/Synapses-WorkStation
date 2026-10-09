import { useEffect, useRef, useState } from "react";
import type { Task, Project } from "../../shared/types";
import { formatHMS } from "./lib/time";

function FocusApp(): React.JSX.Element {
    const [task, setTask] = useState<Task | null>(null);
    const [projectName, setProjectName] = useState<string | null>(null);
    const [tomorrowInput, setTomorrowInput] = useState("");
    const [showInput, setShowInput] = useState(false);
    const [trackingTaskId, setTrackingTaskId] = useState<number | null>(null);
    const [startedAt, setStartedAt] = useState<number | null>(null);
    const [elapsed, setElapsed] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);

    // Load current task + active session on mount
    useEffect(() => {
        let cancelled = false;

        (async () => {
            const [t, session] = await Promise.all([
                window.api.focusGetCurrent(),
                window.api.getActiveSession(),
            ]);
            if (cancelled) return;
            setTask(t);
            if (session && session.task_id !== null) {
                setTrackingTaskId(session.task_id);
                setStartedAt(
                    new Date(
                        session.started_at.replace(" ", "T") + "Z",
                    ).getTime(),
                );
            }
        })();

        const onWindowFocus = (): void => {
            window.api.focusGetCurrent().then((t) => {
                if (!cancelled) setTask(t);
            });
        };
        window.addEventListener("focus", onWindowFocus);

        const unsubscribe = window.api.onDataChanged(() => {
            window.api.focusGetCurrent().then((t) => {
                if (!cancelled) setTask(t);
            });
        });

        return () => {
            cancelled = true;
            window.removeEventListener("focus", onWindowFocus);
            unsubscribe();
        };
    }, []);

    // Resolve project name when the task changes
    useEffect(() => {
        let cancelled = false;

        (async () => {
            if (!task || task.project_id === null) {
                if (!cancelled) setProjectName(null);
                return;
            }
            const projects: Project[] = await window.api.getProjects();
            if (cancelled) return;
            const match = projects.find((p) => p.id === task.project_id);
            setProjectName(match?.title ?? null);
        })();

        return () => {
            cancelled = true;
        };
    }, [task]);

    // Live tick
    useEffect(() => {
        if (startedAt === null) return;

        const tick = (): void => {
            setElapsed(Math.floor((Date.now() - startedAt) / 1000));
        };
        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [startedAt]);

    const handleComplete = async (): Promise<void> => {
        if (!task) return;
        if (trackingTaskId === task.id) {
            await window.api.stopSession();
            setTrackingTaskId(null);
            setStartedAt(null);
        }
        const next = await window.api.focusComplete(task.id);
        setTask(next);
    };

    const handleToggleTimer = async (): Promise<void> => {
        if (!task) return;

        if (trackingTaskId === task.id) {
            await window.api.stopSession();
            setTrackingTaskId(null);
            setStartedAt(null);
        } else {
            const session = await window.api.startSession(task.id);
            setTrackingTaskId(task.id);
            setStartedAt(
                new Date(session.started_at.replace(" ", "T") + "Z").getTime(),
            );
        }
    };

    const handleAddTomorrow = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        const text = tomorrowInput.trim();
        if (!text) return;
        await window.api.focusQuickAddTomorrow(text);
        setTomorrowInput("");
        setShowInput(false);
    };

    const toggleInput = (): void => {
        setShowInput((s) => !s);
        setTimeout(() => inputRef.current?.focus(), 50);
    };

    const isTracking = task !== null && trackingTaskId === task.id;

    return (
        <div className="focus-shell">
            {/* Main task area */}
            <div className="focus-main">
                {task ? (
                    <div className="focus-task no-drag">
                        <button
                            className="focus-check"
                            onClick={handleComplete}
                            title="Complete task"
                            aria-label="Complete task"
                        >
                            <span className="focus-check-box" />
                        </button>

                        <div className="focus-task-body">
                            <div className="focus-text" title={task.text}>
                                {task.text}
                            </div>
                            {projectName && (
                                <div className="focus-project">
                                    {projectName}
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="focus-empty">
                        <span className="focus-empty-check">✓</span>
                        <span className="focus-empty-text">
                            All clear for today
                        </span>
                    </div>
                )}
            </div>

            {/* Live timer badge — floats top-right */}
            {isTracking && (
                <div className="focus-timer-badge no-drag">
                    <span className="focus-timer-dot" />
                    <span className="focus-timer-time">
                        {formatHMS(elapsed)}
                    </span>
                </div>
            )}

            {/* Footer */}
            <div className="focus-bottom">
                {showInput ? (
                    <form
                        onSubmit={handleAddTomorrow}
                        className="focus-form no-drag"
                    >
                        <input
                            ref={inputRef}
                            type="text"
                            placeholder="+ tomorrow…"
                            value={tomorrowInput}
                            onChange={(e) => setTomorrowInput(e.target.value)}
                            onBlur={() => !tomorrowInput && setShowInput(false)}
                        />
                    </form>
                ) : (
                    <button className="focus-add no-drag" onClick={toggleInput}>
                        + tomorrow
                    </button>
                )}

                <div className="focus-actions no-drag">
                    {task && (
                        <button
                            className={`focus-timer-btn ${isTracking ? "active" : ""}`}
                            onClick={handleToggleTimer}
                            title={isTracking ? "Stop timer" : "Start timer"}
                            aria-label={
                                isTracking ? "Stop timer" : "Start timer"
                            }
                        >
                            {isTracking ? "❚❚" : "▶"}
                        </button>
                    )}
                    <button
                        className="focus-hide"
                        onClick={() => window.api.focusToggle()}
                        title="Hide window (Ctrl+Shift+F)"
                        aria-label="Hide window"
                    >
                        ×
                    </button>
                </div>
            </div>
        </div>
    );
}

export default FocusApp;

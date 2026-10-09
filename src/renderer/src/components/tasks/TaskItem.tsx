import { Square, CheckSquare, Target } from "lucide-react";
import type { Task, Project } from "../../../../shared/types";
import { isOverdue } from "../../lib/dates";
import { DueDatePicker } from "./DueDatePicker";
import { PriorityBadge } from "./PriorityBadge";
import { EditableText } from "../common/EditableText";

interface TaskItemProps {
    task: Task;
    project?: Project;
    onToggle: (id: number, done: boolean) => void;
    onDelete: (id: number) => void;
    onSetDueDate: (id: number, date: string | null) => void;
    onSetPriority: (id: number, priority: number) => void;
    onSetText: (id: number, text: string) => void;
    onPin: (id: number) => void;
}

export function TaskItem({
    task,
    project,
    onToggle,
    onDelete,
    onSetDueDate,
    onSetPriority,
    onSetText,
    onPin,
}: TaskItemProps): React.JSX.Element {
    const overdue = isOverdue(task.planned_for);
    const isPinned = task.is_current === 1;

    return (
        <div
            className={`task-item ${task.done ? "done" : ""} ${isPinned ? "pinned" : ""}`}
        >
            <button
                className="task-checkbox"
                onClick={() => onToggle(task.id, !task.done)}
                aria-label={task.done ? "Mark incomplete" : "Mark complete"}
            >
                {task.done ? (
                    <CheckSquare size={18} strokeWidth={2} />
                ) : (
                    <Square size={18} strokeWidth={2} />
                )}
            </button>

            <PriorityBadge
                value={task.priority}
                onChange={(p) => onSetPriority(task.id, p)}
            />

            <div className="task-body">
                <EditableText
                    value={task.text}
                    onSave={(newText) => onSetText(task.id, newText)}
                    className="task-text"
                    inputClassName="task-text-input"
                />
                <div className="task-meta">
                    {project && (
                        <span className="task-project">{project.title}</span>
                    )}
                    {isPinned && (
                        <span className="task-badge pinned">Focused</span>
                    )}
                    {overdue && (
                        <span className="task-badge overdue">Overdue</span>
                    )}
                    <DueDatePicker
                        value={task.due_date}
                        onChange={(date) => onSetDueDate(task.id, date)}
                    />
                </div>
            </div>

            <button
                className={`task-pin ${isPinned ? "active" : ""}`}
                onClick={() => onPin(task.id)}
                title={
                    isPinned ? "Unpin from Focus window" : "Pin to Focus window"
                }
                aria-label={
                    isPinned ? "Unpin from Focus window" : "Pin to Focus window"
                }
            >
                <Target size={15} strokeWidth={2} />
            </button>

            <button
                className="task-delete"
                onClick={() => onDelete(task.id)}
                title="Delete task"
            >
                ×
            </button>
        </div>
    );
}

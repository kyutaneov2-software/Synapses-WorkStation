import type { Task, Project } from "../../../../shared/types";
import { isOverdue } from "../../lib/dates";
import { DueDatePicker } from "./DueDatePicker";
import { PriorityBadge } from "./PriorityBadge";

interface TaskItemProps {
    task: Task;
    project?: Project;
    onToggle: (id: number, done: boolean) => void;
    onDelete: (id: number) => void;
    onSetDueDate: (id: number, date: string | null) => void;
    onSetPriority: (id: number, priority: number) => void;
}

export function TaskItem({
    task,
    project,
    onToggle,
    onDelete,
    onSetDueDate,
    onSetPriority,
}: TaskItemProps): React.JSX.Element {
    const overdue = isOverdue(task.planned_for);

    return (
        <div className={`task-item ${task.done ? "done" : ""}`}>
            <button
                className="task-checkbox"
                onClick={() => onToggle(task.id, !task.done)}
                aria-label={task.done ? "Mark incomplete" : "Mark complete"}
            >
                {task.done ? "☑" : "☐"}
            </button>

            <PriorityBadge
                value={task.priority}
                onChange={(p) => onSetPriority(task.id, p)}
            />

            <div className="task-body">
                <span className="task-text">{task.text}</span>
                <div className="task-meta">
                    {project && (
                        <span className="task-project">{project.title}</span>
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
                className="task-delete"
                onClick={() => onDelete(task.id)}
                title="Delete task"
            >
                ×
            </button>
        </div>
    );
}

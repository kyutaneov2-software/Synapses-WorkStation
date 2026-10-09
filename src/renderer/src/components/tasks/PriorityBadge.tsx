import {
    PRIORITY_LABELS,
    PRIORITY_VALUES,
    priorityLevel,
    type PriorityLevel,
} from "../../../../shared/constants";

interface PriorityBadgeProps {
    value: number;
    onChange: (newValue: number) => void;
}

const CYCLE: PriorityLevel[] = ["none", "low", "medium", "high"];

export function PriorityBadge({
    value,
    onChange,
}: PriorityBadgeProps): React.JSX.Element {
    const level = priorityLevel(value);

    const handleClick = (e: React.MouseEvent): void => {
        e.stopPropagation();
        const idx = CYCLE.indexOf(level);
        const next = CYCLE[(idx + 1) % CYCLE.length];
        onChange(PRIORITY_VALUES[next]);
    };

    return (
        <button
            type="button"
            className={`priority-dot priority-${level}`}
            onClick={handleClick}
            title={`${PRIORITY_LABELS[level]} — click to change`}
            aria-label={`Priority: ${PRIORITY_LABELS[level]}`}
        />
    );
}

import { useEffect, useRef, useState } from "react";
import { Calendar } from "lucide-react";

interface DueDatePickerProps {
    value: string | null;
    onChange: (date: string | null) => void;
}

function todayStr(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(base: Date, days: number): string {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatLabel(dateStr: string): string {
    const today = todayStr();
    const tomorrow = addDays(new Date(), 1);
    if (dateStr === today) return "Due today";
    if (dateStr === tomorrow) return "Due tomorrow";

    const d = new Date(dateStr + "T00:00:00");
    const now = new Date();
    const sameYear = d.getFullYear() === now.getFullYear();
    return `Due ${d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        ...(sameYear ? {} : { year: "numeric" }),
    })}`;
}

export function DueDatePicker({
    value,
    onChange,
}: DueDatePickerProps): React.JSX.Element {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent): void => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent): void => {
            if (e.key === "Escape") setOpen(false);
        };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [open]);

    const handleQuickSet = (dateStr: string | null): void => {
        onChange(dateStr);
        setOpen(false);
    };

    let badgeClass = "due-badge";
    if (value) {
        const today = todayStr();
        if (value < today) badgeClass += " overdue";
        else if (value === today) badgeClass += " due-today";
    } else {
        badgeClass += " empty";
    }

    return (
        <div className="due-picker-wrap" ref={ref}>
            <button
                type="button"
                className={badgeClass}
                onClick={(e) => {
                    e.stopPropagation();
                    setOpen((o) => !o);
                }}
                title={
                    value ? `Due ${value} — click to change` : "Set due date"
                }
            >
                {value ? (
                    formatLabel(value)
                ) : (
                    <Calendar size={13} strokeWidth={2} />
                )}
            </button>

            {open && (
                <div
                    className="due-popover"
                    onClick={(e) => e.stopPropagation()}
                >
                    <input
                        type="date"
                        className="due-date-input"
                        value={value ?? ""}
                        onChange={(e) => {
                            const v = e.target.value || null;
                            onChange(v);
                        }}
                    />
                    <div className="due-quick-actions">
                        <button
                            type="button"
                            onClick={() => handleQuickSet(todayStr())}
                        >
                            Today
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                handleQuickSet(addDays(new Date(), 1))
                            }
                        >
                            Tomorrow
                        </button>
                        <button
                            type="button"
                            onClick={() =>
                                handleQuickSet(addDays(new Date(), 7))
                            }
                        >
                            +1 week
                        </button>
                    </div>
                    {value && (
                        <button
                            type="button"
                            className="due-clear-btn"
                            onClick={() => handleQuickSet(null)}
                        >
                            Clear due date
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}

import { useEffect, useRef, useState } from "react";

interface EditableTextProps {
    value: string;
    onSave: (newValue: string) => Promise<void> | void;
    placeholder?: string;
    className?: string;
    inputClassName?: string;
    multiline?: boolean;
    allowEmpty?: boolean;
}

export function EditableText({
    value,
    onSave,
    placeholder = "Click to edit",
    className = "",
    inputClassName = "",
    multiline = false,
    allowEmpty = false,
}: EditableTextProps): React.JSX.Element {
    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState(value);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        if (editing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [editing]);

    const startEditing = (): void => {
        setDraft(value);
        setEditing(true);
    };

    const commit = async (): Promise<void> => {
        const trimmed = draft.trim();
        const final = allowEmpty ? trimmed : trimmed || value;

        if (final !== value) {
            await onSave(final);
        }
        setEditing(false);
    };

    const cancel = (): void => {
        setDraft(value);
        setEditing(false);
    };

    const handleKeyDown = (
        e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    ): void => {
        if (e.key === "Enter" && !multiline) {
            e.preventDefault();
            commit();
        }
        if (e.key === "Escape") {
            e.preventDefault();
            cancel();
        }
        if (e.key === "Enter" && multiline && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            commit();
        }
    };

    if (editing) {
        if (multiline) {
            return (
                <textarea
                    ref={inputRef as React.RefObject<HTMLTextAreaElement>}
                    className={`editable-input ${inputClassName}`}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={commit}
                    onKeyDown={handleKeyDown}
                    rows={3}
                />
            );
        }
        return (
            <input
                ref={inputRef as React.RefObject<HTMLInputElement>}
                className={`editable-input ${inputClassName}`}
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commit}
                onKeyDown={handleKeyDown}
            />
        );
    }

    const isEmpty = !value || value.trim() === "";
    return (
        <span
            className={`editable-text ${className} ${isEmpty ? "empty" : ""}`}
            onClick={startEditing}
            title="Click to edit"
        >
            {isEmpty ? placeholder : value}
        </span>
    );
}

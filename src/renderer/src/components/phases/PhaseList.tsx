import { useState } from "react";
import type { ProjectPhase } from "../../../../shared/types";
import { EditableText } from "../common/EditableText";

interface PhaseListProps {
    phases: ProjectPhase[];
    onAdd: (name: string, amount: number, currency: string) => Promise<void>;
    onUpdate: (id: number, updates: Record<string, unknown>) => Promise<void>;
    onDelete: (id: number) => Promise<void>;
}

const CURRENCIES = ["USD", "PHP", "EUR", "GBP"] as const;

const SYMBOLS: Record<string, string> = {
    USD: "$",
    PHP: "₱",
    EUR: "€",
    GBP: "£",
};

export function PhaseList({
    phases,
    onAdd,
    onUpdate,
    onDelete,
}: PhaseListProps): React.JSX.Element {
    const [adding, setAdding] = useState(false);
    const [name, setName] = useState("");
    const [amount, setAmount] = useState("");
    const [currency, setCurrency] = useState("USD");

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        const trimmed = name.trim();
        const parsed = parseFloat(amount);
        if (!trimmed || isNaN(parsed)) return;

        await onAdd(trimmed, parsed, currency);
        setName("");
        setAmount("");
        setAdding(false);
    };

    const handleTogglePaid = async (phase: ProjectPhase): Promise<void> => {
        await onUpdate(phase.id, {
            paid: phase.paid ? 0 : 1,
            paid_at: phase.paid ? null : new Date().toISOString(),
        });
    };

    const handleAmountChange = async (
        phase: ProjectPhase,
        newAmount: number,
    ): Promise<void> => {
        if (isNaN(newAmount) || newAmount === phase.amount) return;
        await onUpdate(phase.id, { amount: newAmount });
    };

    const handleCurrencyChange = async (
        phase: ProjectPhase,
        newCurrency: string,
    ): Promise<void> => {
        if (newCurrency === phase.currency) return;
        await onUpdate(phase.id, { currency: newCurrency });
    };

    return (
        <div className="phase-list">
            {phases.map((phase) => (
                <div
                    key={phase.id}
                    className={`phase-item ${phase.paid ? "paid" : ""}`}
                >
                    <button
                        className="phase-check"
                        onClick={() => handleTogglePaid(phase)}
                        title={phase.paid ? "Mark unpaid" : "Mark paid"}
                    >
                        {phase.paid ? "☑" : "☐"}
                    </button>

                    <div className="phase-name-wrap">
                        <EditableText
                            value={phase.name}
                            onSave={(newName) =>
                                onUpdate(phase.id, { name: newName })
                            }
                            className="phase-name"
                            inputClassName="phase-name-input-inline"
                        />
                    </div>

                    <div className="phase-amount-group">
                        <span className="currency-symbol">
                            {SYMBOLS[phase.currency] || phase.currency}
                        </span>
                        <input
                            type="number"
                            className="phase-amount-input"
                            defaultValue={phase.amount}
                            onBlur={(e) => {
                                const v = parseFloat(e.target.value);
                                if (!isNaN(v)) handleAmountChange(phase, v);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter")
                                    (e.target as HTMLInputElement).blur();
                            }}
                        />
                        <select
                            className="currency-select"
                            value={phase.currency}
                            onChange={(e) =>
                                handleCurrencyChange(phase, e.target.value)
                            }
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>

                    {phase.paid_at && (
                        <span className="phase-paid-date">
                            {new Date(phase.paid_at).toLocaleDateString()}
                        </span>
                    )}

                    <button
                        className="phase-delete"
                        onClick={() => onDelete(phase.id)}
                        title="Delete phase"
                    >
                        ×
                    </button>
                </div>
            ))}

            {adding ? (
                <form
                    className="phase-item phase-add-form"
                    onSubmit={handleSubmit}
                >
                    <span className="phase-check">☐</span>
                    <input
                        className="phase-name-input"
                        type="text"
                        placeholder="Phase name (e.g., Deposit)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    <div className="phase-amount-group">
                        <span className="currency-symbol">
                            {SYMBOLS[currency] || currency}
                        </span>
                        <input
                            type="number"
                            className="phase-amount-input"
                            placeholder="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <select
                            className="currency-select"
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                        >
                            {CURRENCIES.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" className="phase-save">
                        Save
                    </button>
                    <button
                        type="button"
                        className="phase-cancel"
                        onClick={() => {
                            setAdding(false);
                            setName("");
                            setAmount("");
                        }}
                    >
                        Cancel
                    </button>
                </form>
            ) : (
                <button
                    className="phase-add-btn"
                    onClick={() => setAdding(true)}
                >
                    + Add payment phase
                </button>
            )}
        </div>
    );
}

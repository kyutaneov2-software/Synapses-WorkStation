import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Square, CheckSquare } from 'lucide-react'
import type { ProjectPhase } from '../../../../shared/types'
import { EditableText } from '../common/EditableText'
import { CURRENCY_SYMBOLS } from '../../../../shared/constants'
import { parseMoney } from '../../../../shared/money'
import { parseSqliteDate } from '../../lib/dates'

interface PhaseListProps {
    phases: ProjectPhase[]
    currency: string
    onAdd: (name: string, amountCents: number) => Promise<void>
    onUpdate: (id: number, updates: Record<string, unknown>) => Promise<void>
    onDelete: (id: number) => Promise<void>
}

export function PhaseList({
    phases,
    currency,
    onAdd,
    onUpdate,
    onDelete
}: PhaseListProps): React.JSX.Element {
    const [adding, setAdding] = useState(false)
    const [name, setName] = useState('')
    const [amount, setAmount] = useState('')

    const symbol = CURRENCY_SYMBOLS[currency] || currency

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault()
        const trimmed = name.trim()
        const cents = parseMoney(amount)
        if (!trimmed || cents === null) return

        await onAdd(trimmed, cents)
        setName('')
        setAmount('')
        setAdding(false)
    }

    const handleTogglePaid = async (phase: ProjectPhase): Promise<void> => {
        await onUpdate(phase.id, {
            paid: phase.paid ? 0 : 1,
            paid_at: phase.paid ? null : new Date().toISOString().slice(0, 19).replace('T', ' ')
        })
    }

    const handleAmountChange = async (phase: ProjectPhase, newCents: number): Promise<void> => {
        if (newCents === phase.amount_cents) return
        await onUpdate(phase.id, { amount_cents: newCents })
    }

    return (
        <div className="phase-list">
            <AnimatePresence mode="popLayout">
                {phases.map((phase) => (
                    <motion.div
                        layout
                        key={phase.id}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={`phase-item ${phase.paid ? 'paid' : ''}`}
                    >
                        <button
                            className="phase-check"
                            onClick={() => handleTogglePaid(phase)}
                            title={phase.paid ? 'Mark unpaid' : 'Mark paid'}
                        >
                            {phase.paid ? (
                                <CheckSquare size={18} strokeWidth={2} />
                            ) : (
                                <Square size={18} strokeWidth={2} />
                            )}
                        </button>

                        <div className="phase-name-wrap">
                            <EditableText
                                value={phase.name}
                                onSave={(newName) => onUpdate(phase.id, { name: newName })}
                                className="phase-name"
                                inputClassName="phase-name-input-inline"
                            />
                            {phase.paid_at && (
                                <span className="phase-paid-date">
                                    Paid {parseSqliteDate(phase.paid_at).toLocaleDateString()}
                                </span>
                            )}
                        </div>

                        <div className="phase-amount-group">
                            <span className="currency-symbol">{symbol}</span>
                            <input
                                type="number"
                                className="phase-amount-input"
                                defaultValue={phase.amount_cents / 100}
                                step="0.01"
                                onBlur={(e) => {
                                    const cents = parseMoney(e.target.value)
                                    if (cents !== null) handleAmountChange(phase, cents)
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                                }}
                            />
                            <span className="currency-code">{currency}</span>
                        </div>

                        <button
                            className="phase-delete"
                            onClick={() => onDelete(phase.id)}
                            title="Delete phase"
                        >
                            ×
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>

            {adding ? (
                <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="phase-item phase-add-form"
                    onSubmit={handleSubmit}
                >
                    <span className="phase-check">
                        <Square size={18} strokeWidth={2} />
                    </span>
                    <input
                        className="phase-name-input"
                        type="text"
                        placeholder="Phase name (e.g., Deposit)"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        autoFocus
                    />
                    <div className="phase-amount-group">
                        <span className="currency-symbol">{symbol}</span>
                        <input
                            type="number"
                            className="phase-amount-input"
                            placeholder="0"
                            step="0.01"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <span className="currency-code">{currency}</span>
                    </div>
                    <button type="submit" className="phase-save">
                        Save
                    </button>
                    <button
                        type="button"
                        className="phase-cancel"
                        onClick={() => {
                            setAdding(false)
                            setName('')
                            setAmount('')
                        }}
                    >
                        Cancel
                    </button>
                </motion.form>
            ) : (
                <button className="phase-add-btn" onClick={() => setAdding(true)}>
                    + Add payment phase
                </button>
            )}
        </div>
    )
}
